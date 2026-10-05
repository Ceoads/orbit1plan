import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CompanionHandle, CompanionState } from "@/components/ai/OrbitCompanion";

interface Alignment { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] }

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

type SR = any;

/**
 * OrbitCompanionController: drives the mascot from real audio state.
 * - speak(): ElevenLabs audio + character alignment; mouth follows audio.currentTime (playback position is the source of truth),
 *   gated by live AnalyserNode energy so the mouth never moves in silence.
 * - listen: browser speech recognition (fr-FR) with barge-in that stops Orbit instantly.
 */
export function useOrbitVoice(companion: RefObject<CompanionHandle>, onUserUtterance: (text: string) => void) {
  const [state, setStateRaw] = useState<CompanionState>("idle");
  const [voiceMode, setVoiceMode] = useState(false);
  const [interim, setInterim] = useState("");
  const stateRef = useRef<CompanionState>("idle");
  const voiceModeRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef(0);
  const spokenRef = useRef("");
  const recRef = useRef<SR>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micRafRef = useRef(0);
  const utterRef = useRef(onUserUtterance);
  utterRef.current = onUserUtterance;
  const abortRef = useRef(0);

  const setState = useCallback((s: CompanionState) => { stateRef.current = s; setStateRaw(s); }, []);
  const restState = () => (voiceModeRef.current ? "listening" : "idle") as CompanionState;

  const resetMouth = () => { cancelAnimationFrame(rafRef.current); companion.current?.setMouth(0); };

  const stopAudio = useCallback(() => {
    abortRef.current++;
    const a = audioRef.current;
    if (a) { a.onended = null; a.onpause = null; a.pause(); a.src = ""; audioRef.current = null; }
    spokenRef.current = "";
    resetMouth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const interrupt = useCallback(() => {
    if (stateRef.current !== "speaking" && stateRef.current !== "thinking") return;
    stopAudio();
    setState("interrupted");
    setTimeout(() => { if (stateRef.current === "interrupted") setState(restState()); }, 250);
  }, [stopAudio, setState]);

  const ensureCtx = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };

  const speak = useCallback(async (text: string, opts?: { success?: boolean }) => {
    const clean = stripForSpeech(text);
    if (!clean) return;
    stopAudio();
    const myRun = abortRef.current;
    setState("thinking");
    try {
      const { data, error } = await supabase.functions.invoke("orbit-voice", { body: { text: clean } });
      if (myRun !== abortRef.current) return;
      if (error || !data?.audio) throw new Error("voice");
      const al: Alignment | null = data.alignment;
      const a = new Audio(`data:audio/mpeg;base64,${data.audio}`);
      audioRef.current = a;
      spokenRef.current = norm(clean);
      const ctx = ensureCtx();
      const src = ctx.createMediaElementSource(a);
      const an = ctx.createAnalyser(); an.fftSize = 512; an.smoothingTimeConstant = 0.5;
      src.connect(an); an.connect(ctx.destination);
      analyserRef.current = an;
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
        } else {
          open = energy < 0.015 ? 0 : Math.min(1, energy * 6);
        }
        companion.current?.setMouth(open, round);
        rafRef.current = requestAnimationFrame(loop);
      };
      a.onplay = () => { setState("speaking"); idx = 0; cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(loop); };
      a.onpause = () => resetMouth();
      a.onended = () => {
        resetMouth(); audioRef.current = null; spokenRef.current = "";
        if (opts?.success) { setState("success"); setTimeout(() => stateRef.current === "success" && setState(restState()), 700); }
        else setState(restState());
      };
      a.onerror = () => { resetMouth(); setState("error"); setTimeout(() => setState(restState()), 1200); };
      await a.play();
    } catch {
      if (myRun !== abortRef.current) return;
      resetMouth(); setState("error");
      setTimeout(() => stateRef.current === "error" && setState(restState()), 1200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAudio, setState]);

  const stopListening = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* noop */ }
    recRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    cancelAnimationFrame(micRafRef.current);
    companion.current?.setLevel(0);
    setInterim("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(async () => {
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
      // Ignore Orbit hearing itself; otherwise the user is barging in.
      const echo = heard.length > 0 && spokenRef.current.includes(heard);
      if (!heard || echo) return;
      if (stateRef.current === "speaking" || stateRef.current === "thinking") interrupt();
      setInterim(inter);
      if (fin.trim()) { setInterim(""); utterRef.current(fin.trim()); }
    };
    rec.onend = () => { if (voiceModeRef.current && recRef.current === rec) { try { rec.start(); } catch { /* noop */ } } };
    rec.onerror = (e: any) => { if (e.error === "not-allowed") { voiceModeRef.current = false; setVoiceMode(false); stopListening(); setState("idle"); } };
    recRef.current = rec;
    rec.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interrupt, stopListening, setState]);

  const toggleVoice = useCallback(async () => {
    if (voiceModeRef.current) {
      voiceModeRef.current = false; setVoiceMode(false);
      stopListening(); stopAudio(); setState("idle");
      return;
    }
    voiceModeRef.current = true; setVoiceMode(true);
    try { await startListening(); setState("listening"); }
    catch (e) { voiceModeRef.current = false; setVoiceMode(false); stopListening(); setState("idle"); throw e; }
  }, [startListening, stopListening, stopAudio, setState]);

  useEffect(() => () => { stopListening(); stopAudio(); ctxRef.current?.close(); }, [stopListening, stopAudio]);

  return { state, setState, voiceMode, interim, toggleVoice, speak, interrupt, stopAudio };
}
