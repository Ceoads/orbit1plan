import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, RotateCcw, Loader2, History, X, Mic, MicOff, Volume2, Square } from "lucide-react";
import { OrbitCompanion, type CompanionHandle } from "./OrbitCompanion";
import { useOrbitVoice, takeSentences } from "@/hooks/useOrbitVoice";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { confirmAction } from "@/components/ConfirmHost";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Qu'est-ce que j'ai demain ?",
  "Aide-moi à réviser mon prochain examen",
  "Découpe mes tâches en petites étapes",
  "Comment remonter ma moyenne ?",
];

export function OrbitAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const [convId, setConvId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [past, setPast] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [memories, setMemories] = useState<{ id: string; content: string }[]>([]);
  const companionRef = useRef<CompanionHandle>(null);
  const sendRef = useRef<(t: string) => void>(() => {});
  const voice = useOrbitVoice(companionRef, (t) => sendRef.current(t));

  const callFn = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("orbit-ai", { body });
    if (error) throw new Error("Orbit AI est indisponible pour le moment.");
    return data;
  };
  const loadConversation = async (id: string) => {
    setConvId(id);
    const { data } = await supabase
      .from("ai_chat_messages")
      .select("role,content")
      .eq("conversation_id", id)
      .order("created_at")
      .limit(200);
    setMessages((data as Msg[]) ?? []);
  };
  useEffect(() => {
    if (!user) return;
    callFn({ action: "active" })
      .then((d) => loadConversation(d.conversationId))
      .catch((e) => toast.error(e.message));
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const openDrawer = async () => {
    setDrawer(true);
    if (!user) return;
    const [c, m] = await Promise.all([
      supabase
        .from("ai_conversations")
        .select("id,title,updated_at")
        .eq("user_id", user.id)
        .eq("archived", true)
        .order("updated_at", { ascending: false })
        .limit(50),
      supabase
        .from("ai_memories")
        .select("id,content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setPast(c.data ?? []);
    setMemories(m.data ?? []);
  };
  const resume = async (id: string) => {
    try {
      const d = await callFn({ action: "resume", conversationId: id });
      await loadConversation(d.conversationId);
      setDrawer(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const forget = async (id: string) => {
    if (!(await confirmAction({ title: "Oublier ce souvenir ?", description: "Orbit AI ne s'en servira plus." })))
      return;
    await supabase.from("ai_memories").delete().eq("id", id);
    setMemories((m) => m.filter((x) => x.id !== id));
  };
  const removePast = async (id: string) => {
    if (
      !(await confirmAction({
        title: "Supprimer cette conversation ?",
        description: "Ses souvenirs restent en mémoire.",
      }))
    )
      return;
    await supabase.from("ai_conversations").delete().eq("id", id);
    setPast((p) => p.filter((x) => x.id !== id));
  };
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    const speaking = voice.voiceMode;
    if (speaking) voice.beginReply();
    else voice.stopAudio();
    voice.setState("thinking");
    let full = "";
    let pend = "";
    setMessages((m) => [...m, { role: "user", content: text }]);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orbit-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Orbit AI est indisponible pour le moment.");
      }
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        full += chunk;
        if (speaking) {
          const [parts, rest] = takeSentences(pend + chunk);
          pend = rest;
          parts.forEach(voice.say);
        }
        setMessages((m) => {
          const n = [...m];
          n[n.length - 1] = { role: "assistant", content: n[n.length - 1].content + chunk };
          return n;
        });
      }
      if (speaking) {
        takeSentences(pend, true)[0].forEach(voice.say);
        voice.endReply({ success: /c['’]est fait|c['’]est ajouté|j['’]ai ajouté/i.test(full) });
      } else voice.setState("idle");
    } catch (e) {
      toast.error((e as Error).message);
      voice.setState("error");
      if (speaking) setTimeout(() => voice.endReply(), 1200);
      else setTimeout(() => voice.setState("idle"), 1200);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };
  sendRef.current = (t) => {
    send(t);
  };
  const toggleVoice = () =>
    voice.toggleVoice().catch((e) => toast.error((e as Error).message || "Micro indisponible."));
  const companion = (size: number) => <OrbitCompanion ref={companionRef} state={voice.state} size={size} />;
  const handsFreePill = (
    <button
      type="button"
      onClick={() => voice.setHandsFree(!voice.handsFree)}
      aria-pressed={voice.handsFree}
      className={cn(
        "mx-auto flex items-center gap-2 h-9 px-4 rounded-full text-xs font-medium transition-colors",
        voice.handsFree ? "bg-primary/15 text-primary" : "bg-card/70 text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn("w-2 h-2 rounded-full", voice.handsFree ? "bg-primary animate-pulse" : "bg-muted-foreground/40")}
      />
      Mains libres {voice.handsFree ? "activé" : "désactivé"}
    </button>
  );
  const voiceHint = voice.voiceMode && (
    <p className="text-sm text-muted-foreground min-h-5 text-center">
      {voice.interim ||
        (voice.state === "listening"
          ? "Je t'écoute…"
          : voice.state === "thinking"
            ? "Je réfléchis…"
            : voice.state === "speaking"
              ? "Parle pour m'interrompre"
              : "")}
    </p>
  );

  const reset = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const d = await callFn({ action: "new" });
      setMessages([]);
      setConvId(d.conversationId);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const historyButton = (
    <button
      onClick={openDrawer}
      aria-label="Anciennes conversations"
      className="w-10 h-10 rounded-full text-muted-foreground hover:bg-card flex items-center justify-center"
    >
      <History className="w-4 h-4" />
    </button>
  );
  const drawerEl = (
    <Sheet open={drawer} onOpenChange={setDrawer}>
      <SheetContent className="w-full sm:w-[400px] sm:max-w-[400px] p-6 sm:p-8 flex flex-col gap-8 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Historique</SheetTitle>
          <SheetDescription>Tes anciennes conversations et ce qu'Orbit AI a retenu de toi.</SheetDescription>
        </SheetHeader>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Conversations</p>
          {past.length === 0 && <p className="text-sm text-muted-foreground py-4">Aucune ancienne conversation.</p>}
          {past.map((c) => (
            <div key={c.id} className="group flex items-center gap-2 rounded-2xl hover:bg-muted/50">
              <button onClick={() => resume(c.id)} className="flex-1 text-left px-4 py-3 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                </p>
              </button>
              <button
                onClick={() => removePast(c.id)}
                aria-label="Supprimer"
                className="w-9 h-9 mr-2 rounded-full flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Mémoire</p>
          {memories.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              Orbit AI retiendra l'essentiel quand tu commenceras une nouvelle conversation.
            </p>
          )}
          {memories.map((m) => (
            <div key={m.id} className="group flex items-start gap-2 bg-muted/40 rounded-2xl px-4 py-3">
              <p className="flex-1 text-sm whitespace-pre-wrap">{m.content}</p>
              <button
                onClick={() => forget(m.id)}
                aria-label="Oublier"
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="w-full flex items-end gap-3 bg-card rounded-[2rem] pl-7 pr-2 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.05)] focus-within:shadow-[0_8px_30px_hsl(var(--primary)/0.15)] transition-shadow"
    >
      <textarea
        ref={inputRef}
        value={input}
        rows={1}
        maxLength={4000}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder="Qu'est-ce que tu veux apprendre ?"
        className="flex-1 resize-none bg-transparent outline-none text-base py-3 max-h-40 placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={toggleVoice}
        aria-label={voice.voiceMode ? "Couper la voix" : "Parler à Orbit"}
        aria-pressed={voice.voiceMode}
        className={cn(
          "shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors",
          voice.voiceMode ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted",
        )}
      >
        {voice.voiceMode ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      <button
        type="submit"
        disabled={busy || !input.trim()}
        aria-label="Envoyer"
        className="shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
      </button>
    </form>
  );

  if (messages.length === 0) {
    return (
      <div className="relative min-h-[70dvh] flex flex-col items-center justify-center gap-8 sm:gap-10 max-w-3xl mx-auto text-center">
        <div className="absolute top-0 right-0">{historyButton}</div>
        {drawerEl}
        {companion(112)}
        {voiceHint}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight">
            Je serai ton copilote perso, toute l'année
          </h1>
          <p className="text-muted-foreground">Orbit AI connaît tes cours, tes tâches et tes notes.</p>
        </div>
        {composer}
        {handsFreePill}
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="h-10 px-4 rounded-full bg-card/70 text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-[75dvh]">
      <div className="flex items-center gap-3 pb-6">
        {companion(voice.voiceMode ? 64 : 44)}
        <p className="text-lg sm:text-xl font-bold tracking-tight flex-1">Orbit AI</p>
        {historyButton}
        {drawerEl}
        <button
          onClick={reset}
          disabled={busy}
          aria-label="Nouvelle conversation"
          className="h-10 px-3 sm:px-4 rounded-full text-sm text-muted-foreground hover:bg-card flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle conversation</span>
        </button>
      </div>
      <div className="flex-1 space-y-6 pb-8">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "user" ? (
              <div className="max-w-[80%] bg-foreground text-background rounded-3xl rounded-br-lg px-5 py-3 whitespace-pre-wrap">
                {m.content}
              </div>
            ) : (
              <div className="max-w-full text-foreground leading-relaxed space-y-3 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-1 [&_strong]:font-semibold [&_h1]:text-xl [&_h2]:text-lg [&_h3]:font-semibold [&_h1]:font-bold [&_h2]:font-bold [&_code]:bg-muted [&_code]:px-1.5 [&_code]:rounded-md">
                {m.content && !busy && (
                  <button
                    onClick={() => (voice.state === "speaking" ? voice.interrupt() : voice.speak(m.content))}
                    aria-label="Écouter"
                    className="float-right ml-2 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-card"
                  >
                    {voice.state === "speaking" ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
                {m.content ? (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                ) : (
                  <span className="inline-flex gap-1 py-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <span className="inline-flex gap-1 py-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </span>
        )}
        <div ref={endRef} />
      </div>
      <div
        className="sticky bottom-4 sm:bottom-6 space-y-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0px)" }}
      >
        {voiceHint}
        {composer}
        {handsFreePill}
      </div>
    </div>
  );
}
