import { Outlet } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { RiskAssessmentRunProvider } from '../contexts/RiskAssessmentRunContext';

export function AppShellLayout() {
  return (
    <RiskAssessmentRunProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </RiskAssessmentRunProvider>
  );
}
