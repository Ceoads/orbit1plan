import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { needsSemesterSetup, SemesterDraft } from "@/lib/semesterSetup";

export function useSemesterSetup() {
  const { user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["semester-setup", user?.id], enabled: !!user, staleTime: 60000,
    queryFn: async () => {
      if (!user) throw new Error("Connexion requise");
      const { data, error } = await supabase.from("semesters").select("id,name,start_date,end_date")
        .eq("user_id", user.id).order("start_date").order("id").limit(20);
      if (error) throw error;
      return data as SemesterDraft[];
    },
  });
  const save = async (rows: SemesterDraft[]) => {
    if (!user) throw new Error("Connexion requise");
    const { error } = await supabase.rpc("save_semester_setup", { _semesters: rows.map((row) => ({ ...row })) });
    if (error) throw error;
    await Promise.all([
      client.invalidateQueries({ queryKey: ["semester-setup", user.id] }),
      client.invalidateQueries({ queryKey: ["vault-data", user.id] }),
    ]);
  };
  return { ...query, save, needsSetup: query.isSuccess && needsSemesterSetup(query.data) };
}