/**
 * Format a Date as YYYY-MM-DD using LOCAL timezone components.
 *
 * IMPORTANT: never use `date.toISOString().split('T')[0]` to compare with
 * event_date stored in DB — toISOString() returns UTC, which shifts the date
 * by a day for users east of UTC (e.g., Paris CET/CEST). That bug makes
 * Monday classes appear under Sunday's column.
 */
export const toLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
