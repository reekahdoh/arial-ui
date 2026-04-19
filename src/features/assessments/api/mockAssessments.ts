import type { AssessmentSummary } from '../../../domain/assessment';

export const mockAssessments: AssessmentSummary[] = [
  {
    id: 'asm_01h2k9',
    title: 'Vendor onboarding — Northwind Logistics',
    ownerName: 'A. Chen',
    updatedAt: '2026-04-10T14:22:00.000Z',
    severity: 'high',
    workflowStatus: 'in_review',
  },
  {
    id: 'asm_01h2m3',
    title: 'Annual IT controls review',
    ownerName: 'M. Ortiz',
    updatedAt: '2026-04-08T09:05:00.000Z',
    severity: 'medium',
    workflowStatus: 'draft',
  },
  {
    id: 'asm_01h2n8',
    title: 'Clinical data handling (EU)',
    ownerName: 'R. Patel',
    updatedAt: '2026-04-02T11:41:00.000Z',
    severity: 'critical',
    workflowStatus: 'in_review',
  },
  {
    id: 'asm_01h2p1',
    title: 'Office relocation — physical security',
    ownerName: 'J. Kim',
    updatedAt: '2026-03-21T16:18:00.000Z',
    severity: 'low',
    workflowStatus: 'approved',
  },
  {
    id: 'asm_01h2q4',
    title: 'Legacy payroll integration sunset',
    ownerName: 'S. Nguyen',
    updatedAt: '2026-03-15T08:55:00.000Z',
    severity: 'medium',
    workflowStatus: 'archived',
  },
];
