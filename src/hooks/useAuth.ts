import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    userId: null,
    email: null,
    isAdmin: false,
  });

  useEffect(() => {
    let unsub: (() => void) | null = null;

    async function loadRole(userId: string): Promise<boolean> {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    }

    async function hydrate() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        setState({ loading: false, userId: null, email: null, isAdmin: false });
      } else {
        const isAdmin = await loadRole(session.user.id);
        setState({
          loading: false,
          userId: session.user.id,
          email: session.user.email ?? null,
          isAdmin,
        });
      }
      const sub = supabase.auth.onAuthStateChange(async (_event, s) => {
        if (!s) {
          setState({ loading: false, userId: null, email: null, isAdmin: false });
        } else {
          const isAdmin = await loadRole(s.user.id);
          setState({
            loading: false,
            userId: s.user.id,
            email: s.user.email ?? null,
            isAdmin,
          });
        }
      });
      unsub = () => sub.data.subscription.unsubscribe();
    }
    hydrate();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  return state;
}
