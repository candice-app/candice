export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "fr-FR";
    utt.rate = 0.95;
    utt.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const french = voices.find(
      (v) => v.lang.startsWith("fr") && v.name.toLowerCase().includes("female")
    ) ?? voices.find((v) => v.lang.startsWith("fr"));
    if (french) utt.voice = french;

    utt.onend = () => resolve();
    utt.onerror = () => resolve();
    window.speechSynthesis.speak(utt);
  });
}
