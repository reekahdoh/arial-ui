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

export function AssessmentQuestionAnswerContent({
  answer,
  completionAction,
  error,
  isSubmittingAnswer,
  progressAriaLabel,
  progressPercent,
  question,
  showAnswerForm,
  status,
  alwaysShowStatus = false,
  setAnswer,
  submitAnswer,
}: {
  answer: string;
  completionAction?: AssessmentCompletionAction | null;
  error: string | null;
  isSubmittingAnswer: boolean;
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
      {error ? (
        <Alert severity="error" sx={{ width: '100%', maxWidth: 520 }}>
          {error}
        </Alert>
      ) : null}
      {alwaysShowStatus || error || status.trim() !== '' ? (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
          {error ? 'Stopped.' : status}
        </Typography>
      ) : null}
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
