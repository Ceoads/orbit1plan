import { describe, it, expect, vi } from "vitest";
import { buildCourseVaultPath } from "./courseNavigation";

describe("buildCourseVaultPath - 'Voir toutes les notes de ce cours'", () => {
  it("ouvre Vault avec la bonne matière pré-sélectionnée", () => {
    const path = buildCourseVaultPath({ id: "subj-123" });
    expect(path).toBe("/?tab=vault&subject=subj-123");
    expect(path).toContain("tab=vault");
    expect(path).toContain("subject=subj-123");
  });

  it("ouvre quand même Vault si aucune matière n'est liée au cours", () => {
    expect(buildCourseVaultPath(null)).toBe("/?tab=vault");
    expect(buildCourseVaultPath(undefined)).toBe("/?tab=vault");
  });

  it("simule un clic depuis la page d'emploi du temps et navigue vers Vault", () => {
    const navigate = vi.fn();

    // Simule le handler de CourseHubPage atteint depuis /schedule
    const handleClick = (subject: { id: string } | null) => {
      navigate(buildCourseVaultPath(subject));
    };

    // Cas 1 : cours avec matière
    handleClick({ id: "math-101" });
    expect(navigate).toHaveBeenLastCalledWith("/?tab=vault&subject=math-101");

    // Cas 2 : cours sans matière → Vault s'ouvre quand même
    handleClick(null);
    expect(navigate).toHaveBeenLastCalledWith("/?tab=vault");

    expect(navigate).toHaveBeenCalledTimes(2);
  });
});
