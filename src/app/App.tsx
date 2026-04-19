import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { appTheme } from '../theme';
import { AppShellLayout } from './AppShellLayout';
import { RequireAuth } from './RequireAuth';
import { AssessmentsListPage } from '../features/assessments/pages/AssessmentsListPage';
import { AddCustomerContextPage } from '../features/assessments/pages/AddCustomerContextPage';
import { NewRiskAssessmentPage } from '../features/assessments/pages/NewRiskAssessmentPlaceholderPage';
import { AiraHomePage } from '../features/home/pages/AiraHomePage';
import { WelcomeAuthPage } from '../features/auth/pages/WelcomeAuthPage';
import { DomainPage } from '../features/domains/pages/DomainPage';
import { NewAuthorativeReferencePage } from '../features/domains/pages/NewAuthorativeReferencePage';
import { AssessmentRedirect } from './AssessmentRedirect';

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
                <Route path="/assessments/new/customer-context" element={<AddCustomerContextPage />} />
                <Route path="/assessments/new" element={<NewRiskAssessmentPage />} />
                <Route path="/assessments" element={<AssessmentsListPage />} />
                <Route path="/assessments/:assessmentId" element={<AssessmentRedirect />} />
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
