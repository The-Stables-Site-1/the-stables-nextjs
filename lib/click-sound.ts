/**
 * A short, simple click for any real click control. Synthesised rather than
 * sampled so it stays weightless and never sounds like a UI beep.
 */

type WindowWithLegacyAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  if (context) return context;
  const Ctor =
    window.AudioContext ?? (window as WindowWithLegacyAudio).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

function getNoise(ctx: AudioContext) {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  const length = Math.floor(ctx.sampleRate * 0.02);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    last = last * 0.42 + (Math.random() * 2 - 1) * 0.58;
    data[i] = last * (1 - i / length);
  }
  noise = buffer;
  return buffer;
}

export function playStampClick() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const now = ctx.currentTime;

  const mute = ctx.createBiquadFilter();
  mute.type = "lowpass";
  mute.frequency.value = 2400;
  mute.Q.value = 0.5;
  mute.connect(ctx.destination);

  const snap = ctx.createBufferSource();
  snap.buffer = getNoise(ctx);
  const grain = ctx.createBiquadFilter();
  grain.type = "bandpass";
  grain.frequency.value = 1600;
  grain.Q.value = 0.7;
  const snapGain = ctx.createGain();
  snapGain.gain.setValueAtTime(0.0001, now);
  snapGain.gain.exponentialRampToValueAtTime(0.055, now + 0.0012);
  snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
  snap.connect(grain).connect(snapGain).connect(mute);
  snap.start(now);
  snap.stop(now + 0.03);

  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(980, now);
  body.frequency.exponentialRampToValueAtTime(420, now + 0.028);
  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0.0001, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.028, now + 0.0015);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  body.connect(bodyGain).connect(mute);
  body.start(now);
  body.stop(now + 0.035);
}

const CONTROL =
  'a, button, [role="button"], input[type="submit"], input[type="button"]';

function eventElement(target: EventTarget | null) {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

function isStampClickTarget(event: Event) {
  const fromPath = event
    .composedPath()
    .find(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node.matches(CONTROL),
    );
  const fromTarget = eventElement(event.target)?.closest(CONTROL);
  const control = fromPath ?? fromTarget;
  if (!(control instanceof HTMLElement)) return false;
  if (control.closest("nextjs-portal")) return false;
  if (
    control.hasAttribute("disabled") ||
    control.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }
  return true;
}

/** Plays the click on every button and link, once per document. */
export function bindStampClicks() {
  const onClick = (event: MouseEvent) => {
    if (event.button !== 0 && event.button !== -1) return;
    if (!isStampClickTarget(event)) return;
    playStampClick();
  };

  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
