import { Alert, Box, Button, LinearProgress, TextField, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export type AssessmentCompletionAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  startIcon?: ReactNode;
};

function AssessmentProgress({
  progressPercent,
  ariaLabel,
}: {
  progressPercent: number | null;
  ariaLabel: string;
}) {
  if (progressPercent === null) return null;

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="overline" color="text.secondary">
          Progress
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(progressPercent)}%
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={progressPercent} aria-label={ariaLabel} sx={{ height: 8, borderRadius: 999 }} />
    </Box>
  );
}

function formatStageLabel(stage: string): string {
  const trimmed = stage.trim();
  // Some backend stages are already human-readable and begin with "Stage"
  // (e.g. "Stage 2: Risk Assessment"). Avoid rendering "Stage: Stage ..." twice.
  if (/^stage\b/i.test(trimmed)) return trimmed;
  return `Stage: ${trimmed}`;
}

function AssessmentQuestion({ question }: { question: string | null }) {
  if (!question) return null;

  return (
    <Box
      sx={{
        mb: 2,
        width: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 2,
        py: 1.75,
        backgroundColor: 'background.paper',
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        Question
      </Typography>
      <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.55 }}>
        {question}
      </Typography>
    </Box>
  );
}

function AssessmentOptions({
  options,
  answer,
  isSubmittingAnswer,
  setAnswer,
}: {
  options: string[];
  answer: string;
  isSubmittingAnswer: boolean;
  setAnswer: (answer: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <Box sx={{ mb: 2, width: '100%' }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        Please Select Your Answer
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {options.map((option) => {
          const selected = answer === option;
          return (
            <Box
              key={option}
              role="button"
              tabIndex={isSubmittingAnswer ? -1 : 0}
              aria-pressed={selected}
              onClick={() => {
                if (isSubmittingAnswer) return;
                setAnswer(option);
              }}
              onKeyDown={(e) => {
                if (isSubmittingAnswer) return;
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                setAnswer(option);
              }}
              sx={{
                width: '100%',
                border: '1px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                borderRadius: 2,
                px: 2,
                py: 1.5,
                cursor: isSubmittingAnswer ? 'default' : 'pointer',
                backgroundColor: selected ? 'action.selected' : 'background.paper',
                opacity: isSubmittingAnswer ? 0.6 : 1,
                transition: 'border-color 120ms ease, background-color 120ms ease',
                '&:hover': {
                  borderColor: isSubmittingAnswer ? 'divider' : 'primary.main',
                },
              }}
            >
              <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
                {option}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function AssessmentAnswerForm({
  answer,
  isSubmittingAnswer,
  setAnswer,
  submitAnswer,
}: {
  answer: string;
  isSubmittingAnswer: boolean;
  setAnswer: (answer: string) => void;
  submitAnswer: () => void;
}) {
  return (
    <>
      <TextField
        fullWidth
        multiline
        minRows={5}
        label="Your answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={isSubmittingAnswer}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          if (e.shiftKey) return;
          e.preventDefault();
          submitAnswer();
        }}
      />
      <Button
        variant="contained"
        onClick={submitAnswer}
        disabled={!answer.trim() || isSubmittingAnswer}
        sx={{ mt: 1.5, width: '100%' }}
      >
        Provide Answer
      </Button>
    </>
  );
}

function AssessmentHeaderMessages({
  error,
  aiStage,
  status,
  alwaysShowStatus,
}: {
  error: string | null;
  aiStage?: string | null;
  status: string;
  alwaysShowStatus: boolean;
}) {
  const stageText = !error && aiStage?.trim() ? formatStageLabel(aiStage) : null;
  const showStatus = alwaysShowStatus || Boolean(error) || status.trim() !== '';
  return (
    <>
      {stageText ? (
        <Typography variant="body2" color="text.secondary">
          {stageText}
        </Typography>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ width: '100%', maxWidth: 520 }}>
          {error}
        </Alert>
      ) : null}
      {showStatus ? (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
          {error ? 'Stopped.' : status}
        </Typography>
      ) : null}
    </>
  );
}

export function AssessmentQuestionAnswerContent({
  aiStage = null,
  answer,
  completionAction,
  error,
  isSubmittingAnswer,
  options = [],
  progressAriaLabel,
  progressPercent,
  question,
  showAnswerForm,
  status,
  alwaysShowStatus = false,
  setAnswer,
  submitAnswer,
}: {
  aiStage?: string | null;
  answer: string;
  completionAction?: AssessmentCompletionAction | null;
  error: string | null;
  isSubmittingAnswer: boolean;
  options?: string[];
  progressAriaLabel: string;
  progressPercent: number | null;
  question: string | null;
  showAnswerForm: boolean;
  status: string;
  alwaysShowStatus?: boolean;
  setAnswer: (answer: string) => void;
  submitAnswer: () => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
      <AssessmentHeaderMessages error={error} aiStage={aiStage} status={status} alwaysShowStatus={alwaysShowStatus} />
      {!error && completionAction ? (
        <Button
          size="large"
          variant="contained"
          startIcon={completionAction.startIcon}
          onClick={completionAction.onClick}
          disabled={completionAction.disabled}
          sx={{ mt: 1, px: 4, py: 1.5, borderRadius: 999 }}
        >
          {completionAction.label}
        </Button>
      ) : null}
      {progressPercent !== null ? (
        <Box sx={{ width: '100%', maxWidth: 720, mt: 1 }}>
          <AssessmentProgress progressPercent={progressPercent} ariaLabel={progressAriaLabel} />
        </Box>
      ) : null}
      {showAnswerForm ? (
        <Box sx={{ width: '100%', maxWidth: 720, mt: 1 }}>
          <AssessmentQuestion question={question} />
          <AssessmentOptions
            options={options}
            answer={answer}
            isSubmittingAnswer={isSubmittingAnswer}
            setAnswer={setAnswer}
          />
          <AssessmentAnswerForm
            answer={answer}
            isSubmittingAnswer={isSubmittingAnswer}
            setAnswer={setAnswer}
            submitAnswer={submitAnswer}
          />
        </Box>
      ) : null}
    </Box>
  );
}
