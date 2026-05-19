type SRWindow = Window & {
  SpeechRecognition?: new () => ISpeechRec;
  webkitSpeechRecognition?: new () => ISpeechRec;
};

interface ISpeechRec extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: { transcript: string };
}

export function listenOnce(lang = "fr-FR"): Promise<string> {
  return new Promise((resolve, reject) => {
    const SR =
      (window as SRWindow).SpeechRecognition ??
      (window as SRWindow).webkitSpeechRecognition;
    if (!SR) { reject(new Error("SpeechRecognition not supported")); return; }

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => resolve(e.results[0][0].transcript);
    rec.onerror = (e) => reject(new Error(e.error));
    rec.onend = () => {}; // resolved via onresult or onerror
    rec.start();
  });
}
