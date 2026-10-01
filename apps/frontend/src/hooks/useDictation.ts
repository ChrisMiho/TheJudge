import { useEffect, useRef, useState } from "react";

/** REQ-212: the browser's own speech recognition — never TheJudge's backend. Minimal
 * shape, not the full lib.dom.d.ts surface (which isn't universally available), so the
 * feature-detect and the handlers below type-check without a DOM lib dependency. Shared
 * by every question box's dictation wiring (`ComposerPill`, `FollowUpComposer`,
 * `EnrichmentStep`'s own pre-submit composer) so the listen/insert/error state machine
 * exists in exactly one place. */
export interface DictationResultAlternative {
  transcript: string;
}
export interface DictationResult {
  readonly length: number;
  [index: number]: DictationResultAlternative;
}
export interface DictationResultList {
  readonly length: number;
  [index: number]: DictationResult;
}
export interface DictationEvent {
  results: DictationResultList;
}
export interface DictationErrorEvent {
  error?: string;
}
export interface DictationRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: DictationEvent) => void) | null;
  onerror: ((event: DictationErrorEvent) => void) | null;
  onend: (() => void) | null;
}
export type DictationRecognitionCtor = new () => DictationRecognition;

declare global {
  interface Window {
    SpeechRecognition?: DictationRecognitionCtor;
    webkitSpeechRecognition?: DictationRecognitionCtor;
  }
}

export function getDictationCtor(): DictationRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export interface UseDictationOptions {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}

export interface UseDictationResult {
  /** True where the browser exposes `SpeechRecognition`/`webkitSpeechRecognition`. */
  isSupported: boolean;
  isListening: boolean;
  /** A denied-permission or recognition error's one-line message; typed text is never
   * touched when this is set. */
  error: string | null;
  /** Starts listening, or stops it if already listening (the mic's own tap handler). */
  toggle: () => void;
  /** Stops listening without toggling on — called before a submit mid-dictation. */
  stop: () => void;
}

/**
 * REQ-212: dictation for one question box. A tap on the mic starts listening;
 * recognised words are inserted as typed text (appended to whatever was already in the
 * box), clipped at `maxLength` exactly as typed text is (REQ-011). A second tap, a
 * caller-invoked `stop()` (e.g. on submit), or the browser's own silence timeout all end
 * a listening session. Nothing here ever reaches TheJudge's backend — the recognition
 * engine is the browser's own, exactly as a keyboard's dictation key is.
 */
export function useDictation({ value, onChange, maxLength }: UseDictationOptions): UseDictationResult {
  const DictationCtor = getDictationCtor();
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<DictationRecognition | null>(null);
  const baseValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function stop(): void {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }

  function toggle(): void {
    if (isListening) {
      stop();
      return;
    }
    if (!DictationCtor) return;

    setError(null);
    baseValueRef.current = value;
    const recognition = new DictationCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i]?.[0]?.transcript ?? "";
      }
      const base = baseValueRef.current;
      const joiner = base.length > 0 && transcript.length > 0 ? " " : "";
      onChangeRef.current(`${base}${joiner}${transcript}`.slice(0, maxLength));
    };
    recognition.onerror = (event) => {
      setError(
        event?.error === "not-allowed" || event?.error === "permission-denied"
          ? "Microphone access was denied."
          : "Couldn't hear you — try again."
      );
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setError("Couldn't hear you — try again.");
    }
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return { isSupported: Boolean(DictationCtor), isListening, error, toggle, stop };
}
