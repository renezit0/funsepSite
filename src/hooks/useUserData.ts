import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserData {
  cadben: any;
  dependentes: any[];
}

export function useUserData() {
  const { session } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.matricula) {
      setIsLoading(false);
      return;
    }

    loadUserData();
  }, [session]);

  const loadUserData = async () => {
    if (!session?.user?.matricula) return;

    setIsLoading(true);
    try {
      // Buscar dados do cadben
      const { data: cadbenData, error: cadbenError } = await supabase
        .from("cadben")
        .select("*")
        .eq("matricula", session.user.matricula)
        .maybeSingle();

      if (cadbenError) throw cadbenError;

      // Buscar dependentes ativos
      const { data: dependentesData, error: depError } = await supabase
        .from("caddep")
        .select("*")
        .eq("matricula", session.user.matricula)
        .eq("situacao", 1);

      if (depError) throw depError;

      setUserData({
        cadben: cadbenData,
        dependentes: dependentesData || [],
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { userData, isLoading, refetch: loadUserData };
}
