import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useAuth } from '../../../contexts/AuthContext';
import type { ProjectRequirementsFields } from '../../../domain/projectRequirements';
import { emptyProjectRequirements, normalizeProjectRequirements } from '../../../domain/projectRequirements';
import { loadProjectRequirements, persistProjectRequirements } from '../../../services/assessments/projectRequirementsPersistence';
import { ActiveRequirementsSection } from './AddProjectRequirementsSections';
import { ContextTypeTiles, FeedbackAlerts, HeaderActions, SupportingContextTable } from './AddProjectRequirementsSummary';
import { supportingContextRows, toOpenableHttpUrl, uploadRequirementsDocument, type ContextSectionId } from './addProjectRequirementsHelpers';

function savedRequirementsFromBaseline(baseline: string): ProjectRequirementsFields {
  try {
    return normalizeProjectRequirements(JSON.parse(baseline) as Partial<ProjectRequirementsFields>);
  } catch {
    return emptyProjectRequirements();
  }
}

type PageViewProps = {
  activeSection: ContextSectionId | null;
  assessmentId: string;
  backTo: string;
  canSave: boolean;
  ctx: ProjectRequirementsFields;
  isDirty: boolean;
  loading: boolean;
  loadError: string | null;
  openableUrl: string | null;
  persistError: string | null;
  persistInfo: string | null;
  saving: boolean;
  supportingRows: ReturnType<typeof supportingContextRows>;
  websiteUrlError: boolean;
  clearPersistError: () => void;
  clearPersistInfo: () => void;
  save: () => void;
  setActiveSection: (section: ContextSectionId) => void;
  setCtx: Dispatch<SetStateAction<ProjectRequirementsFields>>;
  setSelectedFile: (file: File | null) => void;
};

function ProjectRequirementsPageView(props: PageViewProps) {
  return (
    <>
      <PageHeader
        title="Add Project Requirements"
        description={
          <>
            Project Requirements capture what your project needs to achieve.
            <br />
            <br />• What is it that you need your solution to do?
            <br />• Why are you bringing this into your organisation?
            <br />
            <br />
            These requirements are likely captured in official documents, or web pages, but also in email threads. You
            can upload it all here.
          </>
        }
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
        actions={<HeaderActions backTo={props.backTo} canSave={props.canSave} isDirty={props.isDirty} saving={props.saving} onSave={props.save} />}
      />
      <AppCard>
        <FeedbackAlerts
          loadError={props.loadError}
          persistError={props.persistError}
          persistInfo={props.persistInfo}
          clearPersistError={props.clearPersistError}
          clearPersistInfo={props.clearPersistInfo}
        />
        <SupportingContextTable rows={props.supportingRows} />
        <ContextTypeTiles activeSection={props.activeSection} setActiveSection={props.setActiveSection} />
        <ActiveRequirementsSection
          activeSection={props.activeSection}
          assessmentId={props.assessmentId}
          ctx={props.ctx}
          loading={props.loading}
          openableUrl={props.openableUrl}
          websiteUrlError={props.websiteUrlError}
          setCtx={props.setCtx}
          setSelectedFile={props.setSelectedFile}
        />
      </AppCard>
    </>
  );
}

function useLoadProjectRequirements({
  assessmentId,
  setBaseline,
  setCtx,
  setLoadError,
  setLoading,
  setSelectedFile,
}: {
  assessmentId: string;
  setBaseline: Dispatch<SetStateAction<string>>;
  setCtx: Dispatch<SetStateAction<ProjectRequirementsFields>>;
  setLoadError: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setSelectedFile: Dispatch<SetStateAction<File | null>>;
}) {
  useEffect(() => {
    if (!assessmentId) {
      const empty = emptyProjectRequirements();
      setCtx(empty);
      setBaseline(JSON.stringify(empty));
      setLoadError(null);
      return;
    }

    let cancelled = false;
    const clearing = emptyProjectRequirements();
    setLoading(true);
    setLoadError(null);
    setCtx(clearing);
    setBaseline(JSON.stringify(clearing));

    void (async () => {
      try {
        const loaded = await loadProjectRequirements(assessmentId);
        if (cancelled) return;
        setSelectedFile(null);
        setCtx(loaded);
        setBaseline(JSON.stringify(loaded));
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load saved context');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assessmentId, setBaseline, setCtx, setLoadError, setLoading, setSelectedFile]);
}

export function AddProjectRequirementsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get('assessmentId') ?? '';
  const backTo = assessmentId ? `/assessments/new?assessmentId=${encodeURIComponent(assessmentId)}` : '/assessments/new';
  const [ctx, setCtx] = useState<ProjectRequirementsFields>(() => emptyProjectRequirements());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [baseline, setBaseline] = useState(() => JSON.stringify(emptyProjectRequirements()));
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [persistInfo, setPersistInfo] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ContextSectionId | null>(null);

  useLoadProjectRequirements({ assessmentId, setBaseline, setCtx, setLoadError, setLoading, setSelectedFile });

  const openableUrl = toOpenableHttpUrl(ctx.websiteUrl);
  const websiteUrlError = !!ctx.websiteUrl.trim() && !openableUrl;
  const isDirty = useMemo(() => JSON.stringify(ctx) !== baseline, [ctx, baseline]);
  const savedSnapshot = useMemo(() => savedRequirementsFromBaseline(baseline), [baseline]);
  const supportingRows = useMemo(() => supportingContextRows(savedSnapshot), [savedSnapshot]);

  useEffect(() => {
    if (isDirty) setPersistInfo(null);
  }, [isDirty]);

  const canSave = !!assessmentId && !loading && !websiteUrlError && isDirty;
  const save = async (): Promise<boolean> => {
    if (!canSave) return false;
    setSaving(true);
    setPersistError(null);
    setPersistInfo(null);
    try {
      let fieldsToSave = ctx;
      if (selectedFile) {
        const documentContent = await selectedFile.text();
        const requirementsDocId = await uploadRequirementsDocument(assessmentId, selectedFile, user);
        fieldsToSave = {
          ...ctx,
          documentContent: documentContent || null,
          requirementsDocId,
        };
      }

      const result = await persistProjectRequirements(assessmentId, fieldsToSave);
      if (!result.ok) {
        setPersistError(result.message);
        return false;
      }

      if (fieldsToSave !== ctx) {
        setCtx(fieldsToSave);
      }
      setBaseline(JSON.stringify(fieldsToSave));
      setPersistInfo('Saved.');
      navigate(`/assessments/new?assessmentId=${encodeURIComponent(assessmentId)}`);
      return true;
    } catch (err) {
      setPersistError(err instanceof Error ? err.message : 'Failed to save project requirements');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProjectRequirementsPageView
      activeSection={activeSection}
      assessmentId={assessmentId}
      backTo={backTo}
      canSave={canSave}
      ctx={ctx}
      isDirty={isDirty}
      loading={loading}
      loadError={loadError}
      openableUrl={openableUrl}
      persistError={persistError}
      persistInfo={persistInfo}
      saving={saving}
      supportingRows={supportingRows}
      websiteUrlError={websiteUrlError}
      clearPersistError={() => setPersistError(null)}
      clearPersistInfo={() => setPersistInfo(null)}
      save={() => void save()}
      setActiveSection={setActiveSection}
      setCtx={setCtx}
      setSelectedFile={setSelectedFile}
    />
  );
}
