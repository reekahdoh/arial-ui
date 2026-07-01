import { Navigate, useLocation } from 'react-router-dom';

export function AssessingRiskRedirect() {
  const location = useLocation();
  return <Navigate to={`/assessments/running${location.search}`} replace state={location.state} />;
}
