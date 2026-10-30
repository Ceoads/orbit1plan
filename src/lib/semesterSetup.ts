export interface SemesterDraft { id?: string; name: string; start_date: string; end_date: string }

export function semesterSetupError(rows: SemesterDraft[]): string | null {
  if (rows.length < 2) return "Renseigne au moins deux semestres.";
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  for (const row of rows) {
    if (!row.name.trim() || row.name.trim().length > 100 || !validDate(row.start_date) || !validDate(row.end_date)) return "Renseigne le nom et les deux dates de chaque semestre.";
    if (row.end_date < row.start_date) return "La fin d’un semestre doit être après son début.";
  }
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      if (rows[i].start_date <= rows[j].end_date && rows[j].start_date <= rows[i].end_date) return "Les dates des semestres ne doivent pas se chevaucher.";
    }
  }
  return null;
}

export function needsSemesterSetup(rows: SemesterDraft[]) {
  return semesterSetupError(rows) !== null;
}