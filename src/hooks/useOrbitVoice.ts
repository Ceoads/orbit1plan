import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CompanionHandle, CompanionState } from "@/components/ai/OrbitCompanion";

interface Alignment { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] }
interface Clip { audio: string; alignment: Alignment | null }
type ListenMode = "off" | "once" | "handsfree";

/** Stylised viseme per character → [open 0..1, roundness 0..1]. */
const viseme = (ch: string): [number, number] => {
  const c = ch.toLowerCase();
  if ("aàâ".includes(c)) return [1, 0];
  if ("eéèêë".includes(c)) return [0.65, 0];
  if ("iîïy".includes(c)) return [0.45, 0];
  if ("oôœ".includes(c)) return [0.8, 1];
  if ("uùûw".includes(c)) return [0.5, 1];
  if ("mbp".includes(c)) return [0, 0];
  if ("fv".includes(c)) return [0.2, 0];
  if ("l".includes(c)) return [0.4, 0];
  if (/[a-zç]/.test(c)) return [0.3, 0];
  return [0, 0];
};

export const stripForSpeech = (md: string) =>
  md.replace(/```[\s\S]*?```/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_#`>|~]+/g, "").replace(/\$[^$]*\$/g, " ").replace(/\n{2,}/g, ". ").replace(/\s+/g, " ").trim();

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();

/** Splits streamed text into speakable sentences; returns [complete sentences, remainder]. */
export function takeSentences(buf: string, force = false): [string[], string] {
  const out: string[] = [];
  const re = /[^.!?…\n]+[.!?…]+["»)]?\s+|[^\n]+\n+/g;
  let m: RegExpExecArray | null; let last = 0; let pending = "";
  while ((m = re.exec(buf))) {
    pending += m[0]; last = re.lastIndex;
    if (pending.trim().length >= 25) { out.push(pending.trim()); pending = ""; }
  }
  let rest = pending + buf.slice(last);
  if (force && rest.trim()) { out.push(rest.trim()); rest = ""; }
  return [out, rest];
}

type SR = any;
const HF_KEY = "orbit-handsfree";

/**
 * OrbitCompanionController: drives the mascot from real audio state.
 * - Sentence-level streaming: each sentence is synthesised as soon as it arrives (prefetched in parallel)
 *   and played in order, so Orbit starts talking after the first sentence.
 * - Mouth follows audio.currentTime + alignment, gated by live AnalyserNode energy.
 * - Listening modes: "once" (tap the mic, one question) or "handsfree" (listens after every reply until turned off).
 */
export function useOrbitVoice(companion: RefObject<CompanionHandle>, onUserUtterance: (text: string) => void) {
  const [state, setStateRaw] = useState<CompanionState>("idle");
  const [mode, setModeRaw] = useState<ListenMode>("off");
  const [handsFree, setHandsFreeRaw] = useState(() => localStorage.getItem(HF_KEY) === "1");
  const [interim, setInterim] = useState("");
  const stateRef = useRef<CompanionState>("idle");
  const modeRef = useRef<ListenMode>("off");
  const handsFreeRef = useRef(handsFree);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const spokenRef = useRef("");
  const recRef = useRef<SR>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micRafRef = useRef(0);
  const utterRef = useRef(onUserUtterance);
  utterRef.current = onUserUtterance;
  const runRef = useRef(0);
  const queueRef = useRef<Promise<Clip | null>[]>([]);
  const playingRef = useRef(false);
  const doneRef = useRef(true);
  const successRef = useRef(false);
  const prevTextRef = useRef("");

  const setState = useCallback((s: CompanionState) => { stateRef.current = s; setStateRaw(s); }, []);
  const setMode = (m: ListenMode) => { modeRef.current = m; setModeRaw(m); };
  const restState = () => (modeRef.current !== "off" && recRef.current ? "listening" : "idle") as CompanionState;
  const resetMouth = () => { cancelAnimationFrame(rafRef.current); companion.current?.setMouth(0); };

  const ensureCtx = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };

  const stopAudio = useCallback(() => {
    runRef.current++;
    queueRef.current = []; playingRef.current = false; doneRef.current = true; prevTextRef.current = "";
    const a = audioRef.current;
    if (a) { a.onended = null; a.onpause = null; a.onerror = null; a.pause(); a.src = ""; audioRef.current = null; }
    spokenRef.current = "";
    resetMouth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- listening ----------
  const stopListening = useCallback(() => {
    const rec = recRef.current; recRef.current = null;
    try { rec?.stop(); } catch { /* noop */ }
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    cancelAnimationFrame(micRafRef.current);
    companion.current?.setLevel(0);
    setInterim("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const interrupt = useCallback(() => {
    if (stateRef.current !== "speaking" && stateRef.current !== "thinking") return;
    stopAudio();
    setState("interrupted");
    setTimeout(() => { if (stateRef.current === "interrupted") setState(restState()); }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAudio, setState]);

  const startListening = useCallback(async () => {
    if (recRef.current) return;
    const Rec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Rec) throw new Error("La reconnaissance vocale n'est pas disponible sur ce navigateur.");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    micStreamRef.current = stream;
    const ctx = ensureCtx();
    const an = ctx.createAnalyser(); an.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    const meter = () => {
      an.getByteTimeDomainData(buf);
      let s = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v; }
      companion.current?.setLevel(Math.min(1, Math.sqrt(s / buf.length) * 6));
      micRafRef.current = requestAnimationFrame(meter);
    };
    meter();

    const rec: SR = new Rec();
    rec.lang = "fr-FR"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: any) => {
      let fin = "", inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]; if (r.isFinal) fin += r[0].transcript; else inter += r[0].transcript;
      }
      const heard = norm(fin || inter);
      const echo = heard.length > 0 && spokenRef.current.includes(heard); // Orbit hearing itself
      if (!heard || echo) return;
      if (stateRef.current === "speaking" || stateRef.current === "thinking") interrupt();
      setInterim(inter);
      if (fin.trim()) {
        setInterim("");
        // One-shot: stop the mic once the question is captured; replies are still spoken.
        if (modeRef.current === "once") stopListening();
        utterRef.current(fin.trim());
      }
    };
    rec.onend = () => { if (recRef.current === rec) { try { rec.start(); } catch { /* noop */ } } };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { setMode("off"); stopListening(); setState("idle"); }
    };
    recRef.current = rec;
    rec.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interrupt, stopListening, setState]);

  /** Called when Orbit finished speaking (or had nothing to say). */
  const afterReply = useCallback(() => {
    if (modeRef.current === "handsfree") {
      startListening().then(() => setState("listening")).catch(() => { setMode("off"); setState("idle"); });
    } else if (modeRef.current === "once") {
      setMode("off"); stopListening(); setState("idle");
    } else setState("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startListening, stopListening, setState]);

  // ---------- speaking ----------
  const fetchClip = (text: string, prev: string): Promise<Clip | null> =>
    supabase.functions.invoke("orbit-voice", { body: { text, previous_text: prev } })
      .then(({ data, error }) => (error || !data?.audio ? null : (data as Clip)))
      .catch(() => null);

  const finishIfDrained = () => {
    if (queueRef.current.length || playingRef.current || !doneRef.current) return false;
    resetMouth(); spokenRef.current = "";
    if (successRef.current) {
      successRef.current = false; setState("success");
      setTimeout(() => { if (stateRef.current === "success") afterReply(); }, 700);
    } else afterReply();
    return true;
  };

  const playNext = async () => {
    if (playingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) { finishIfDrained(); return; }
    playingRef.current = true;
    const run = runRef.current;
    const clip = await next;
    if (run !== runRef.current) return;
    if (!clip) { playingRef.current = false; if (stateRef.current !== "speaking") setState("error"); return playNext(); }
    const al = clip.alignment;
    const a = new Audio(`data:audio/mpeg;base64,${clip.audio}`);
    audioRef.current = a;
    const ctx = ensureCtx();
    const an = ctx.createAnalyser(); an.fftSize = 512; an.smoothingTimeConstant = 0.5;
    ctx.createMediaElementSource(a).connect(an); an.connect(ctx.destination);
    const buf = new Uint8Array(an.fftSize);
    let idx = 0;
    const loop = () => {
      const t = a.currentTime;
      an.getByteTimeDomainData(buf);
      let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
      const energy = Math.sqrt(sum / buf.length);
      let open = 0, round = 0;
      if (al) {
        while (idx < al.characters.length - 1 && al.character_end_times_seconds[idx] < t) idx++;
        if (t >= al.character_start_times_seconds[idx]) [open, round] = viseme(al.characters[idx]);
        open *= energy < 0.015 ? 0 : Math.min(1, 0.5 + energy * 5);
      } else open = energy < 0.015 ? 0 : Math.min(1, energy * 6);
      companion.current?.setMouth(open, round);
      rafRef.current = requestAnimationFrame(loop);
    };
    a.onplay = () => { setState("speaking"); cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(loop); };
    a.onpause = () => resetMouth();
    const end = () => {
      resetMouth(); audioRef.current = null; playingRef.current = false;
      if (run !== runRef.current) return;
      if (!queueRef.current.length && !doneRef.current) setState("thinking"); // waiting for the next sentence
      playNext();
    };
    a.onended = end; a.onerror = end;
    try { await a.play(); } catch { end(); }
  };

  /** Starts a new spoken reply; feed sentences with say(), close with endReply(). */
  const beginReply = useCallback(() => {
    stopAudio(); doneRef.current = false; successRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAudio]);

  const say = useCallback((sentence: string) => {
    const clean = stripForSpeech(sentence);
    if (!clean) return;
    spokenRef.current += " " + norm(clean);
    queueRef.current.push(fetchClip(clean, prevTextRef.current));
    prevTextRef.current = clean;
    playNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endReply = useCallback((opts?: { success?: boolean }) => {
    doneRef.current = true; successRef.current = !!opts?.success;
    finishIfDrained();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Speaks a whole text at once (e.g. the "listen" button on old messages). */
  const speak = useCallback((text: string) => {
    beginReply();
    const [parts] = takeSentences(stripForSpeech(text) + " ", true);
    parts.forEach(say);
    endReply();
  }, [beginReply, say, endReply]);

  // ---------- controls ----------
  /** Mic button: hands-free → continuous; otherwise one question. Tap again to stop. */
  const toggleVoice = useCallback(async () => {
    if (modeRef.current !== "off") { setMode("off"); stopListening(); stopAudio(); setState("idle"); return; }
    setMode(handsFreeRef.current ? "handsfree" : "once");
    try { await startListening(); setState("listening"); }
    catch (e) { setMode("off"); stopListening(); setState("idle"); throw e; }
  }, [startListening, stopListening, stopAudio, setState]);

  const setHandsFree = useCallback((on: boolean) => {
    handsFreeRef.current = on; setHandsFreeRaw(on);
    localStorage.setItem(HF_KEY, on ? "1" : "0");
    if (modeRef.current !== "off") setMode(on ? "handsfree" : "once");
  }, []);

  useEffect(() => () => { stopListening(); stopAudio(); ctxRef.current?.close(); }, [stopListening, stopAudio]);

  return {
    state, setState, voiceMode: mode !== "off", handsFree, setHandsFree, interim,
    toggleVoice, speak, beginReply, say, endReply, interrupt, stopAudio,
  };
}
