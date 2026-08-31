#!/usr/bin/env python3
"""Find duplicate and semantically similar questions in a questionnaire export.

Extracts every (question_id, question) pair from the ``bank`` object of a
questions export and reports:

* exact duplicates - questions whose (trimmed) text is identical but whose
  ``question_id`` differs;
* semantically similar questions - distinct question texts whose TF-IDF cosine
  similarity is at or above a configurable threshold (near-duplicates).

The similarity detection is dependency-free (pure Python TF-IDF cosine over
normalized word tokens), so it runs offline without numpy/sklearn or an
embedding API.

Usage:
    python3 find_duplicate_questions.py [path] [--json] [-o OUTPUT]
                                        [--similar] [--threshold T]

Examples:
    python3 find_duplicate_questions.py
    python3 find_duplicate_questions.py questions.json
    python3 find_duplicate_questions.py questions.json --similar
    python3 find_duplicate_questions.py questions.json --similar --threshold 0.7
    python3 find_duplicate_questions.py questions.json --similar --json -o report.json
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from collections import defaultdict

DEFAULT_SIMILARITY_THRESHOLD = 0.8

# Very common English words plus questionnaire boilerplate that carry little
# discriminative signal; removing them sharpens the similarity comparison.
STOP_WORDS = frozenset(
    """
    a an and are as at be been being by can could do does for from had has have
    if in into is it its may might not of on or over should so such than that the
    their them then there these they this those to used using was were what when
    where whether which while who will with would you your
    """.split()
)

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def load_bank(path: str) -> dict:
    """Load the questions file and return its ``bank`` dict."""
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    bank = data.get("bank")
    if not isinstance(bank, dict):
        raise ValueError(f"'bank' object not found or not a dict in {path!r}")
    return bank


def extract_pairs(bank: dict) -> list[tuple[str, str]]:
    """Return a list of (question_id, question_text) pairs from the bank."""
    pairs: list[tuple[str, str]] = []
    for qid, entry in bank.items():
        if not isinstance(entry, dict):
            continue
        # Prefer the question_id inside the entry, fall back to the map key.
        question_id = entry.get("question_id", qid)
        question = entry.get("question") or ""
        pairs.append((question_id, question))
    return pairs


def find_duplicates(pairs: list[tuple[str, str]]) -> dict[str, list[str]]:
    """Group question_ids by normalized (trimmed) question text.

    Returns only groups where the same text maps to more than one question_id.
    """
    groups: dict[str, list[str]] = defaultdict(list)
    for question_id, question in pairs:
        groups[question.strip()].append(question_id)

    return {text: ids for text, ids in groups.items() if len(ids) > 1}


def build_report(pairs: list[tuple[str, str]]) -> dict:
    """Build a structured report of totals and duplicate groups."""
    duplicates = find_duplicates(pairs)
    unique_texts = {question.strip() for _, question in pairs}

    # Sort groups by count (desc) then by text for stable output.
    duplicate_groups = [
        {"question": text, "question_ids": ids, "count": len(ids)}
        for text, ids in sorted(
            duplicates.items(), key=lambda item: (-len(item[1]), item[0])
        )
    ]

    return {
        "total_questions": len(pairs),
        "unique_question_texts": len(unique_texts),
        "duplicate_texts": len(duplicate_groups),
        "extra_duplicate_entries": sum(g["count"] - 1 for g in duplicate_groups),
        "duplicates": duplicate_groups,
    }


def tokenize(text: str) -> list[str]:
    """Lowercase, split into word tokens, drop stop words, light de-pluralize."""
    tokens = []
    for tok in _TOKEN_RE.findall(text.lower()):
        if tok in STOP_WORDS:
            continue
        # Very light stemming so "forecasts"/"forecast" and "outputs"/"output"
        # collapse together without pulling in a stemming dependency.
        if len(tok) > 4 and tok.endswith("es"):
            tok = tok[:-2]
        elif len(tok) > 3 and tok.endswith("s"):
            tok = tok[:-1]
        tokens.append(tok)
    return tokens


def build_tfidf_vectors(
    texts: list[str],
) -> tuple[list[dict[str, float]], list[float]]:
    """Return per-document TF-IDF vectors (as dicts) and their L2 norms."""
    tokenized = [tokenize(t) for t in texts]

    # Document frequency for each term.
    doc_freq: dict[str, int] = defaultdict(int)
    for toks in tokenized:
        for term in set(toks):
            doc_freq[term] += 1

    n_docs = len(texts)
    idf = {
        term: math.log((1 + n_docs) / (1 + df)) + 1.0
        for term, df in doc_freq.items()
    }

    vectors: list[dict[str, float]] = []
    norms: list[float] = []
    for toks in tokenized:
        term_freq: dict[str, int] = defaultdict(int)
        for term in toks:
            term_freq[term] += 1
        vec = {term: tf * idf[term] for term, tf in term_freq.items()}
        norm = math.sqrt(sum(w * w for w in vec.values()))
        vectors.append(vec)
        norms.append(norm)
    return vectors, norms


def cosine(
    vec_a: dict[str, float],
    norm_a: float,
    vec_b: dict[str, float],
    norm_b: float,
) -> float:
    """Cosine similarity between two sparse TF-IDF vectors."""
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    # Iterate over the smaller vector for efficiency.
    if len(vec_a) > len(vec_b):
        vec_a, vec_b = vec_b, vec_a
    dot = sum(weight * vec_b.get(term, 0.0) for term, weight in vec_a.items())
    return dot / (norm_a * norm_b)


def find_similar_questions(
    pairs: list[tuple[str, str]],
    threshold: float,
) -> list[dict]:
    """Find pairs of distinct question texts with cosine similarity >= threshold.

    Exact duplicate texts are collapsed to a single representative first, so the
    output surfaces near-duplicates rather than re-reporting exact matches.
    """
    # Map each unique text to the question_ids that use it.
    text_to_ids: dict[str, list[str]] = defaultdict(list)
    for question_id, question in pairs:
        text_to_ids[question.strip()].append(question_id)

    texts = list(text_to_ids.keys())
    vectors, norms = build_tfidf_vectors(texts)

    similar: list[dict] = []
    for i in range(len(texts)):
        for j in range(i + 1, len(texts)):
            score = cosine(vectors[i], norms[i], vectors[j], norms[j])
            if score >= threshold:
                similar.append(
                    {
                        "similarity": round(score, 4),
                        "question_a": texts[i],
                        "question_ids_a": text_to_ids[texts[i]],
                        "question_b": texts[j],
                        "question_ids_b": text_to_ids[texts[j]],
                    }
                )

    similar.sort(key=lambda item: -item["similarity"])
    return similar


def print_similar_report(similar: list[dict], threshold: float) -> None:
    """Print a human-readable report of semantically similar question pairs."""
    print(
        f"\nSemantically similar questions "
        f"(TF-IDF cosine >= {threshold}, excluding exact duplicates):"
    )
    print("=" * 72)
    if not similar:
        print("\nNo similar question pairs found above the threshold.")
        return
    print(f"Found {len(similar)} similar pair(s).")
    for i, pair in enumerate(similar, 1):
        print(f"\n{i}. similarity={pair['similarity']}")
        print(f"   A [{', '.join(pair['question_ids_a'])}]")
        print(f"     {pair['question_a']}")
        print(f"   B [{', '.join(pair['question_ids_b'])}]")
        print(f"     {pair['question_b']}")


def print_text_report(report: dict) -> None:
    """Print a human-readable report to stdout."""
    print(f"Total questions:            {report['total_questions']}")
    print(f"Unique question texts:      {report['unique_question_texts']}")
    print(f"Duplicate texts (>1):       {report['duplicate_texts']}")
    print(f"Extra duplicate entries:    {report['extra_duplicate_entries']}")
    if "similar_pairs" in report:
        threshold = report.get("similarity_threshold")
        print(
            f"Similar pairs (>= {threshold}):    "
            f"{len(report['similar_pairs'])}"
        )

    if not report["duplicates"]:
        print("\nNo duplicate questions found.")
        return

    print("\nDuplicate questions (same text, different question_id):")
    print("=" * 72)
    for i, group in enumerate(report["duplicates"], 1):
        print(f"\n{i}. (x{group['count']}) {group['question']}")
        for qid in group["question_ids"]:
            print(f"     - {qid}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "path",
        nargs="?",
        default="questions.json",
        help="Path to the questions JSON file (default: questions.json)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit the report as JSON instead of human-readable text",
    )
    parser.add_argument(
        "-o",
        "--output",
        help="Write JSON output to this file (implies --json)",
    )
    parser.add_argument(
        "--similar",
        action="store_true",
        help="Also detect semantically similar (near-duplicate) questions",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=DEFAULT_SIMILARITY_THRESHOLD,
        help=(
            "TF-IDF cosine similarity threshold in [0, 1] for --similar "
            f"(default: {DEFAULT_SIMILARITY_THRESHOLD})"
        ),
    )
    args = parser.parse_args(argv)

    try:
        bank = load_bank(args.path)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    pairs = extract_pairs(bank)
    report = build_report(pairs)

    if args.similar:
        similar = find_similar_questions(pairs, args.threshold)
        report["similarity_threshold"] = args.threshold
        report["similar_pairs_count"] = len(similar)
        report["similar_pairs"] = similar

    if args.output:
        with open(args.output, "w", encoding="utf-8") as fh:
            json.dump(report, fh, indent=2, ensure_ascii=False)
        print(f"Wrote JSON report to {args.output}")
    elif args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print_text_report(report)
        if args.similar:
            print_similar_report(report["similar_pairs"], args.threshold)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
