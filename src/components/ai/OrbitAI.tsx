import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { confirmAction } from "@/components/ConfirmHost";
import { cn } from "@/lib/utils";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = ["Qu'est-ce que j'ai demain ?", "Aide-moi à réviser mon prochain examen", "Découpe mes tâches en petites étapes", "Comment remonter ma moyenne ?"];

/** Friendly blob mascot, Orbit peach palette. */
const Mascot = ({ size = 72 }: { size?: number }) => (
  <div className="relative animate-[float_4s_ease-in-out_infinite]" style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_25px_hsl(var(--primary)/0.25)]">
      <defs>
        <radialGradient id="orbitBlob" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="hsl(var(--background))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </radialGradient>
      </defs>
      <path fill="url(#orbitBlob)" d="M50 6c8 0 11 7 18 9s15-1 19 6-1 13 1 20 9 11 6 18-11 8-15 14-4 14-12 17-12-4-17-4-11 7-18 4-6-11-12-17-14-6-16-14 5-12 4-19-8-12-3-19 13-3 19-6S42 6 50 6z" />
      <ellipse cx="41" cy="50" rx="3.5" ry="5" fill="hsl(var(--foreground))" />
      <ellipse cx="59" cy="50" rx="3.5" ry="5" fill="hsl(var(--foreground))" />
    </svg>
  </div>
);

export function OrbitAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("ai_chat_messages").select("role,content").eq("user_id", user.id).order("created_at").limit(200)
      .then(({ data }) => setMessages((data as Msg[]) ?? []));
    inputRef.current?.focus();
  }, [user]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setInput(""); setBusy(true);
    setMessages((m) => [...m, { role: "user", content: text }]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orbit-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Orbit AI est indisponible pour le moment.");
      }
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader(); const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMessages((m) => { const n = [...m]; n[n.length - 1] = { role: "assistant", content: n[n.length - 1].content + chunk }; return n; });
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const reset = async () => {
    if (!user || !(await confirmAction({ title: "Effacer la conversation ?", description: "Orbit AI repartira de zéro." }))) return;
    await supabase.from("ai_chat_messages").delete().eq("user_id", user.id);
    setMessages([]); inputRef.current?.focus();
  };

  const composer = (
    <form onSubmit={(e) => { e.preventDefault(); send(); }}
      className="w-full flex items-end gap-3 bg-card rounded-[2rem] pl-7 pr-2 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.05)] focus-within:shadow-[0_8px_30px_hsl(var(--primary)/0.15)] transition-shadow">
      <textarea ref={inputRef} value={input} rows={1} maxLength={4000}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        placeholder="Qu'est-ce que tu veux apprendre ?"
        className="flex-1 resize-none bg-transparent outline-none text-base py-3 max-h-40 placeholder:text-muted-foreground" />
      <button type="submit" disabled={busy || !input.trim()} aria-label="Envoyer"
        className="shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
      </button>
    </form>
  );

  if (messages.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-10 max-w-3xl mx-auto text-center">
        <Mascot />
        <div className="space-y-3">
          <h1 className="text-5xl font-display font-bold tracking-tight">Je serai ton prof perso, toute l'année</h1>
          <p className="text-muted-foreground">Orbit AI connaît tes cours, tes tâches et tes notes.</p>
        </div>
        {composer}
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="h-10 px-4 rounded-full bg-card/70 text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors">{s}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-[85vh]">
      <div className="flex items-center gap-3 pb-6">
        <Mascot size={40} />
        <p className="text-xl font-bold tracking-tight flex-1">Orbit AI</p>
        <button onClick={reset} className="h-10 px-4 rounded-full text-sm text-muted-foreground hover:bg-card flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Nouvelle conversation</button>
      </div>
      <div className="flex-1 space-y-6 pb-8">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "user"
              ? <div className="max-w-[80%] bg-foreground text-background rounded-3xl rounded-br-lg px-5 py-3 whitespace-pre-wrap">{m.content}</div>
              : <div className="max-w-full prose prose-sm prose-neutral dark:prose-invert text-foreground leading-relaxed">
                  {m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <span className="inline-flex gap-1 py-2"><span className="w-2 h-2 rounded-full bg-primary animate-bounce" /><span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" /><span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" /></span>}
                </div>}
          </div>
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <span className="inline-flex gap-1 py-2"><span className="w-2 h-2 rounded-full bg-primary animate-bounce" /><span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" /><span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" /></span>
        )}
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-6">{composer}</div>
    </div>
  );
}
