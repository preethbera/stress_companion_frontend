import { SimpleVAD } from "./vad";
import { floatTo16BitPCM } from "./audioUtils";

export async function startMic(ws) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const audioContext = new AudioContext({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(stream);

  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  source.connect(processor);
  processor.connect(audioContext.destination);

  const vad = new SimpleVAD({
    energyThreshold: 0.015,
    silenceDurationMs: 700,

    onSpeechStart: () => {
      ws.send(JSON.stringify({ type: "speech_start" }));
    },

    onSpeechEnd: () => {
      ws.send(JSON.stringify({ type: "speech_end" }));
    },

    onAudioFrame: (audioFrame) => {
      ws.send(floatTo16BitPCM(audioFrame));
    }
  });

  processor.onaudioprocess = (event) => {
    const audio = event.inputBuffer.getChannelData(0);
    vad.process(audio, performance.now());
  };
}
