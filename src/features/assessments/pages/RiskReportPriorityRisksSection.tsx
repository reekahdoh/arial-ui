import { Box, Typography } from '@mui/material';
import { riskReportSectionSx } from './riskReportStyles';
import type { HighRiskSummary } from './riskReportTypes';

function RiskDetailList({ risks }: { risks: HighRiskSummary['risks'] }) {
  if (risks.length === 0) return null;
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="body2" color="text.secondary">
        leading to
      </Typography>
      <Box component="ul" sx={{ m: 0, mt: 0.75, pl: 2.5 }}>
        {risks.map((riskDetail) => (
          <Box component="li" key={riskDetail.key} sx={{ mb: 0.75 }}>
            <Typography variant="body2" component="span" sx={{ fontWeight: 700 }}>
              {riskDetail.name}
            </Typography>
            {riskDetail.description ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {riskDetail.description}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function PriorityRiskItem({ risk, showImpact }: { risk: HighRiskSummary; showImpact: boolean }) {
  return (
    <Box component="li" sx={{ mb: 1.5 }}>
      <Typography variant="subtitle1" component="span" sx={{ fontWeight: 700 }}>
        {risk.name}
      </Typography>
      {risk.description ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {risk.description}
        </Typography>
      ) : null}
      <RiskDetailList risks={risk.risks} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {showImpact && risk.impact ? `Impact: ${risk.impact}. ` : ''}
        {risk.likelihood ? `Likelihood: ${risk.likelihood}.` : ''}
      </Typography>
    </Box>
  );
}

export function RiskReportPriorityRisksSection({
  title,
  risks,
  emptyMessage,
  showImpact,
}: {
  title: string;
  risks: HighRiskSummary[];
  emptyMessage: string;
  showImpact: boolean;
}) {
  return (
    <Box sx={riskReportSectionSx}>
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      {risks.length > 0 ? (
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {risks.map((risk) => (
            <PriorityRiskItem key={risk.key} risk={risk} showImpact={showImpact} />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      )}
    </Box>
  );
}
