import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { appTheme } from '../theme';
import { AppShellLayout } from './AppShellLayout';
import { RequireAuth } from './RequireAuth';
import { AssessmentsListPage } from '../features/assessments/pages/AssessmentsListPage';
import { AddProjectRequirementsPage } from '../features/assessments/pages/AddProjectRequirementsPage';
import { NewRiskAssessmentPage } from '../features/assessments/pages/NewRiskAssessmentPlaceholderPage';
import { PreparingRiskAssessmentPage } from '../features/assessments/pages/PreparingRiskAssessmentPage';
import { AssessingRiskRedirect } from '../features/assessments/pages/AssessingRiskRedirect';
import { RiskReportPage } from '../features/assessments/pages/RiskReportPage';
import { AiraHomePage } from '../features/home/pages/AiraHomePage';
import { WelcomeAuthPage } from '../features/auth/pages/WelcomeAuthPage';
import { DomainPage } from '../features/domains/pages/DomainPage';
import { CustomerDomainPage } from '../features/domains/pages/CustomerDomainPage';
import { NewAuthorativeReferencePage } from '../features/domains/pages/NewAuthorativeReferencePage';
import { NewCustomerReferencePage } from '../features/domains/pages/NewCustomerReferencePage';
import { AssessmentRedirect } from './AssessmentRedirect';

function LegacyProjectRequirementsRedirect() {
  const location = useLocation();
  return <Navigate to={`/assessments/new/project-requirements${location.search}`} replace />;
}

export default function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline enableColorScheme />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomeAuthPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShellLayout />}>
                <Route path="/home" element={<AiraHomePage />} />
                <Route path="/overview" element={<Navigate to="/home" replace />} />
                <Route path="/assessments/new/customer-context" element={<LegacyProjectRequirementsRedirect />} />
                <Route path="/assessments/new/project-requirements" element={<AddProjectRequirementsPage />} />
                <Route path="/assessments/new" element={<NewRiskAssessmentPage />} />
                <Route path="/assessments/running" element={<PreparingRiskAssessmentPage />} />
                <Route path="/assessments/assessing-risk" element={<AssessingRiskRedirect />} />
                <Route path="/assessments/risk-report" element={<RiskReportPage />} />
                <Route path="/assessments" element={<AssessmentsListPage />} />
                <Route path="/assessments/:assessmentId" element={<AssessmentRedirect />} />
                <Route path="/customer-domain" element={<CustomerDomainPage />} />
                <Route path="/customer-domain/references/new" element={<NewCustomerReferencePage />} />
                <Route path="/customer-domains/:domainKey" element={<CustomerDomainPage />} />
                <Route path="/customer-domains/:domainKey/references/new" element={<NewCustomerReferencePage />} />
                <Route path="/domains/:domainKey" element={<DomainPage />} />
                <Route path="/domains/:domainKey/references/new" element={<NewAuthorativeReferencePage />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
