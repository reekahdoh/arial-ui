const projectRequirementsFiles = new Map<string, File>();

export function setProjectRequirementsFile(assessmentId: string, file: File) {
  projectRequirementsFiles.set(assessmentId, file);
}

export function getProjectRequirementsFile(assessmentId: string): File | null {
  return projectRequirementsFiles.get(assessmentId) ?? null;
}
