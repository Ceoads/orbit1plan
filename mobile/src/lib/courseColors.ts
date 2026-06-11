// Fixed course → color mapping. Falls back to a stable hash-based color
// from the palette when a course isn't explicitly mapped.

export interface CourseColor {
  hex: string;          // accent / left border
  soft: string;         // very subtle bg tint for list cards
}

const FIXED_MAP: { keywords: string[]; color: CourseColor }[] = [
  { keywords: ["plan d'action commerciale", "plan action commerciale", "pac"], color: { hex: "#F4845F", soft: "#FFF2EC" } },
  { keywords: ["anglais", "english"], color: { hex: "#5B8DEF", soft: "#EEF3FE" } },
  { keywords: ["nego", "négo", "négociation", "negociation"], color: { hex: "#4CAF7D", soft: "#ECF8F1" } },
  { keywords: ["relation client", "grc"], color: { hex: "#9C6FDE", soft: "#F3ECFB" } },
  { keywords: ["fonda management", "fondamentaux du management", "management"], color: { hex: "#3BBFBF", soft: "#E8F8F8" } },
];

const PALETTE: CourseColor[] = [
  { hex: "#F4845F", soft: "#FFF2EC" },
  { hex: "#5B8DEF", soft: "#EEF3FE" },
  { hex: "#4CAF7D", soft: "#ECF8F1" },
  { hex: "#9C6FDE", soft: "#F3ECFB" },
  { hex: "#3BBFBF", soft: "#E8F8F8" },
  { hex: "#E8B84A", soft: "#FCF6E4" },
  { hex: "#E85A86", soft: "#FCEAF1" },
  { hex: "#6C7BE8", soft: "#EEF0FC" },
];

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

export const getCourseColor = (name?: string | null): CourseColor => {
  if (!name) return PALETTE[0];
  const n = norm(name);
  for (const entry of FIXED_MAP) {
    if (entry.keywords.some((k) => n.includes(k))) return entry.color;
  }
  return PALETTE[hash(n) % PALETTE.length];
};
