import { vi } from "vitest";

/** REQ-212: a stubbed `SpeechRecognition` — the browser's own API, never TheJudge's
 * backend — so a question box's dictation wiring can be exercised without a real
 * microphone or a real recognition engine. Shared by every composer's test file
 * (`ComposerPill`, `FollowUpComposer`, `EnrichmentStep`) so the stub shape is defined
 * once. Built as a plain function that returns its instance (rather than a class
 * aliasing `this` to an outer variable) to stay clear of `@typescript-eslint/no-this-
 * alias` — `new StubSpeechRecognitionCtor()` still works: a constructor function that
 * explicitly returns an object makes `new` use that object instead of a fresh `this`. */
export interface StubSpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

let lastInstance: StubSpeechRecognitionInstance | null = null;

export function resetLastDictationInstance(): void {
  lastInstance = null;
}

export function getLastDictationInstance(): StubSpeechRecognitionInstance {
  if (!lastInstance) {
    throw new Error("No StubSpeechRecognition instance has been constructed yet in this test.");
  }
  return lastInstance;
}

export function StubSpeechRecognitionCtor(): StubSpeechRecognitionInstance {
  const instance: StubSpeechRecognitionInstance = {
    lang: "",
    continuous: false,
    interimResults: false,
    onresult: null,
    onerror: null,
    onend: null,
    start: vi.fn(),
    stop: vi.fn()
  };
  lastInstance = instance;
  return instance;
}

/** Installs the stub as `window.SpeechRecognition` for one test's `beforeEach`, and
 * returns the matching `afterEach` cleanup. */
export function installStubSpeechRecognition(): () => void {
  resetLastDictationInstance();
  window.SpeechRecognition = StubSpeechRecognitionCtor as unknown as typeof window.SpeechRecognition;
  return () => {
    delete (window as { SpeechRecognition?: unknown }).SpeechRecognition;
  };
}

export function makeDictationResultsEvent(transcripts: string[]): { results: unknown } {
  const results: Record<number, unknown> & { length: number } = { length: transcripts.length };
  transcripts.forEach((transcript, index) => {
    results[index] = { length: 1, 0: { transcript } };
  });
  return { results };
}
