"use client";

import { preload } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { AddressBox } from "@/components/AddressBox";

export type IntroRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Every beat of the intro is a multiple of one shutter interval, so the word
 * stagger, the crop and the gallop all land on the same lo-fi cadence.
 */
export const BEAT_MS = 84;

const HOLD_MS = 2000;
const CROP_STEPS = 6;
const CROP_MS = BEAT_MS * CROP_STEPS;
const GALLOP_FRAMES = 9;
const GALLOP_MS = BEAT_MS * GALLOP_FRAMES;
const FLIP_MS = BEAT_MS * 7;
/** The flat card travels from the middle of the page up to the module slot. */
const RISE_STEPS = 5;
const RISE_MS = BEAT_MS * RISE_STEPS;

const GALLOP_SRCS = Array.from(
  { length: GALLOP_FRAMES },
  (_, i) => `/horse/frame-${i + 1}.png`,
);
/** Square cell matching the Figma plates, sized to sit inside the address module. */
const HORSE = 108;

type Phase = "line" | "gallop" | "flip" | "rise";

type IntroSequenceProps = {
  /** Viewport rect of the first module; the card rises to it once it is flat. */
  rect: IntroRect;
  line: string;
  /** The card is flat and starting its rise; the rest of the stack can drop in. */
  onTurn: () => void;
  /** The card has reached the module slot and the real module can take over. */
  onLand: () => void;
};

export function IntroSequence({ rect, line, onTurn, onLand }: IntroSequenceProps) {
  // Plates are not shown for ~3s, but they must be decoded before the cut.
  for (const src of GALLOP_SRCS) preload(src, { as: "image" });

  const words = line.split(" ");
  const [phase, setPhase] = useState<Phase>("line");
  const [wordsIn, setWordsIn] = useState(0);
  const [frame, setFrame] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerHeight,
  );

  const wordCount = words.length;
  const onTurnRef = useRef(onTurn);
  const onLandRef = useRef(onLand);

  // Keep the hand-off pointed at the latest callbacks without restarting the
  // timeline, which a dependency on them would do on every parent render.
  useEffect(() => {
    onTurnRef.current = onTurn;
    onLandRef.current = onLand;
  });

  useEffect(() => {
    const measure = () => setViewportHeight(window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const timers: number[] = [];
    const at = (ms: number, run: () => void) => {
      timers.push(window.setTimeout(run, ms));
    };

    for (let i = 1; i <= wordCount; i += 1) at(BEAT_MS * i, () => setWordsIn(i));

    // The crop and the gallop start on the same beat: the line cuts straight to
    // the horse, and the frame keeps running as the card closes around it.
    const lineEnd = BEAT_MS * wordCount + HOLD_MS;
    at(lineEnd, () => {
      setFrame(0);
      setPhase("gallop");
    });
    for (let f = 1; f < GALLOP_FRAMES; f += 1) {
      at(lineEnd + BEAT_MS * f, () => setFrame(f));
    }

    const flipAt = lineEnd + GALLOP_MS;
    at(flipAt, () => setPhase("flip"));
    at(flipAt + FLIP_MS, () => {
      setPhase("rise");
      onTurnRef.current();
    });
    at(flipAt + FLIP_MS + RISE_MS, () => onLandRef.current());

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [wordCount]);

  const full = phase === "line";
  const risen = phase === "rise";

  // The module column is already centered horizontally, so the measured rect
  // doubles as the card's resting x. Only the y has to be brought to the middle.
  const centeredTop = Math.round((viewportHeight - rect.height) / 2);
  const top = full ? 0 : risen ? rect.top : centeredTop;

  const geometry =
    phase === "gallop"
      ? `left ${CROP_MS}ms steps(${CROP_STEPS}, jump-start), top ${CROP_MS}ms steps(${CROP_STEPS}, jump-start), width ${CROP_MS}ms steps(${CROP_STEPS}, jump-start), height ${CROP_MS}ms steps(${CROP_STEPS}, jump-start)`
      : risen
        ? `top ${RISE_MS}ms steps(${RISE_STEPS}, jump-start)`
        : undefined;

  const face =
    "absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[80]"
      style={{
        perspective: "1400px",
        perspectiveOrigin: `${rect.left + rect.width / 2}px ${
          centeredTop + rect.height / 2
        }px`,
      }}
      aria-hidden
    >
      <div
        className="absolute [transform-style:preserve-3d]"
        style={{
          left: full ? 0 : rect.left,
          top,
          width: full ? "100vw" : rect.width,
          height: full ? "100vh" : rect.height,
          // A stepped crop reads as a shutter closing rather than a soft zoom.
          transition: geometry,
          animation:
            phase === "flip" || risen
              ? `card-flip ${FLIP_MS}ms cubic-bezier(0.5, 0, 0.2, 1) both`
              : undefined,
          willChange: "transform, width, height",
        }}
      >
        <div
          className={`${face} overflow-hidden border-[0.75px] border-ink bg-cream`}
        >
          {full ? (
            <p className="absolute inset-0 m-0 flex flex-wrap content-center items-center justify-center gap-x-[0.3em] gap-y-[0.15em] px-[8vw] text-center text-[12px] leading-normal tracking-[0.02em] text-black">
              {words.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  style={{ visibility: i < wordsIn ? "visible" : "hidden" }}
                >
                  {word}
                </span>
              ))}
            </p>
          ) : (
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                width: HORSE,
                height: HORSE,
                marginLeft: -HORSE / 2,
                marginTop: -HORSE / 2,
              }}
            >
              {GALLOP_SRCS.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  width={HORSE}
                  height={HORSE}
                  draggable={false}
                  className="absolute inset-0 size-full"
                  style={{ visibility: i === frame ? "visible" : "hidden" }}
                />
              ))}
            </div>
          )}
        </div>

        <div className={face} style={{ transform: "rotateY(180deg)" }}>
          <AddressBox showLogo opaque />
        </div>
      </div>
    </div>
  );
}
