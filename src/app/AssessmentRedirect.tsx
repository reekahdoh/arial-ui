import { Navigate, useParams } from 'react-router-dom';

export function AssessmentRedirect() {
  const { assessmentId } = useParams();
  const target = assessmentId
    ? `/assessments/new?assessmentId=${encodeURIComponent(assessmentId)}`
    : '/assessments/new';
  return <Navigate to={target} replace />;
}

