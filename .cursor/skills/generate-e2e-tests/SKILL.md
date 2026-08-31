---
name: generate-e2e-tests
description: >-
  Generates Playwright smoke tests from implemented AIRA UI routes and pages.
  Use when the user asks to generate E2E tests, add Playwright coverage for a
  feature, write staging tests, or after shipping a user-facing flow.
---

# Generate E2E tests

Assisted generation from the **implemented UI** (routes, pages, copy). Do not invent coverage from historical chat prompts. Keep tests smoke-level unless the user asks for a deeper journey.

## Workflow

1. Inventory routes in `src/app/App.tsx` and the page(s) under change.
2. Reuse existing fixtures:
   - Sign-in: `e2e/login.ts` (`signInWithPassword`). Never Google OAuth.
   - Authenticated specs belong in the `authenticated` Playwright project (storageState from `e2e/auth.setup.ts`).
   - Public/unauthenticated specs belong in `e2e/smoke/public.spec.ts` (no storageState).
3. Prefer `getByRole` / `getByLabel`. Add `data-testid="aira-*"` only when MUI roles are ambiguous (tables, wizard steps). Examples: `aira-assessments-table`, `aira-wizard-name`.
4. Assert visible user outcomes (heading, CTA, URL). Do not assert implementation details, network payloads, or Firestore internals.
5. Default to smoke: load the page, assert heading/CTA. **Do not** complete wizard save, upload requirements, run Q&A (`/assessments/running` polls every 30s), or generate a risk report unless the user explicitly asks.
6. Put new specs under `e2e/smoke/` and register them in `playwright.config.ts` `testMatch` if they are not already covered by `home|assessments|public`.
7. Run `npx playwright test` with `PLAYWRIGHT_BASE_URL` (and `E2E_LOGIN_NAME` / `E2E_PASSWORD` for authenticated projects). Fix failures before finishing.

## Constraints

- Credentials come from env (`.env.staging` or CI secrets). Never commit passwords.
- Wizard: opening `/assessments/new` and asserting `aira-wizard-name` is OK. Do not click through to persist.
- Jest (`npm test`) is separate. Do not put Playwright files under `src/`.

## Output

One Playwright spec (or an extension of an existing smoke spec) plus any `aira-*` test ids required to make selectors stable.
