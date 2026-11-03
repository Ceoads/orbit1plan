/** Count only persisted subject assignments as filed; semester repairs are separate. */
export function filingOutcome(
  before: { subject_id: string | null; semester_id: string | null },
  after: { subject_id: string | null; semester_id: string | null },
) {
  return {
    filed: !before.subject_id && !!after.subject_id ? 1 : 0,
    ambiguous: !after.subject_id ? 1 : 0,
    semestersUpdated: before.semester_id !== after.semester_id ? 1 : 0,
  };
}