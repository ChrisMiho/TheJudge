import type { PileTier } from "../../lib/trade/pricing";

/** Pile materials — fixed art colours, the REQ-216 named exemption. Values are
 * the direction-1 `trade-balancer.html` palette. */
const COIN = "#e2b13c";
const RIM = "#c9962c";
const EDGE = "#7a4f12";
const MOUND = "#d9a63a";
const GEM = "#a855f7";
const GEM_LIGHT = "#d8b4fe";
const GEM_DARK = "#7e22ce";

/** A loose coin: a flat ellipse, bronze-edged. */
function Coin({ x, y, r = 10 }: { x: number; y: number; r?: number }): JSX.Element {
  return <ellipse cx={x} cy={y} rx={r} ry={r * 0.36} fill={COIN} stroke={EDGE} strokeWidth={1.2} />;
}

/** A stack of `n` coins: each is a rimmed cylinder (rim rect + top ellipse). */
function Stack({ x, base, n, r = 10 }: { x: number; base: number; n: number; r?: number }): JSX.Element {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const y = base - i * 4;
        return (
          <g key={i}>
            <rect x={x - r} y={y - 3.5} width={r * 2} height={3.5} fill={RIM} stroke={EDGE} strokeWidth={1} />
            <Coin x={x} y={y - 3.5} r={r} />
          </g>
        );
      })}
    </>
  );
}

/** A rounded gold mound (curved Bezier hill) with an inner highlight curve. */
function Mound({ x0, x1, peak }: { x0: number; x1: number; peak: number }): JSX.Element {
  return (
    <>
      <path d={`M${x0} 88 Q 90 ${peak} ${x1} 88 Z`} fill={MOUND} stroke={EDGE} strokeWidth={1.3} />
      <path
        d={`M${x0 + 14} 84 Q 90 ${peak + 18} ${x1 - 14} 84`}
        fill="none"
        stroke={EDGE}
        strokeWidth={0.9}
        opacity={0.5}
      />
    </>
  );
}

/** The one gem: a two-tone faceted cut (dark body, light crown facet). */
function Gem({ x, y }: { x: number; y: number }): JSX.Element {
  return (
    <>
      <polygon
        points={`${x},${y - 13} ${x + 9},${y - 4} ${x},${y + 8} ${x - 9},${y - 4}`}
        fill={GEM}
        stroke={GEM_DARK}
        strokeWidth={1.2}
      />
      <polygon
        points={`${x},${y - 13} ${x + 9},${y - 4} ${x - 9},${y - 4}`}
        fill={GEM_LIGHT}
        opacity={0.7}
      />
    </>
  );
}

/** Tier 5's goblet, set on the top mound. */
function Goblet({ x, y }: { x: number; y: number }): JSX.Element {
  return (
    <>
      <path
        d={`M${x - 11} ${y - 26} h22 q0 14 -11 16 q-11 -2 -11 -16 z`}
        fill={COIN}
        stroke={EDGE}
        strokeWidth={1.2}
      />
      <rect x={x - 2} y={y - 10} width={4} height={7} fill={RIM} stroke={EDGE} strokeWidth={1} />
      <path d={`M${x - 9} ${y} q9 -6 18 0 z`} fill={COIN} stroke={EDGE} strokeWidth={1.2} />
      <circle cx={x} cy={y - 19} r={2} fill={GEM} />
    </>
  );
}

/**
 * The pile drawing, after the direction-1 mockup: tiers build on each other, so
 * a pile at tier N draws every element whose tier is <= N. The mound for each
 * tier replaces the smaller one beneath it (largest drawn first), and tier 3's
 * peak stack steps aside once the goblet crowns tier 5.
 */
function PileArt({ tier }: { tier: PileTier }): JSX.Element {
  return (
    <>
      <line
        className="ground"
        x1={2}
        y1={88}
        x2={178}
        y2={88}
        stroke={EDGE}
        strokeOpacity={0.45}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {tier >= 5 && <Mound x0={22} x1={158} peak={26} />}
      {tier >= 4 && tier < 5 && <Mound x0={40} x1={140} peak={40} />}
      {tier >= 3 && tier < 4 && <Mound x0={55} x1={125} peak={52} />}
      {tier >= 1 && (
        <>
          <Coin x={40} y={88} />
          <Coin x={62} y={90} />
          <Coin x={128} y={89} />
          <Stack x={100} base={88} n={2} />
        </>
      )}
      {tier >= 2 && (
        <>
          <Stack x={46} base={88} n={5} />
          <Stack x={136} base={88} n={4} />
        </>
      )}
      {tier >= 3 && tier < 5 && <Stack x={90} base={70} n={3} />}
      {tier >= 4 && (
        <>
          <Gem x={60} y={70} />
          <Stack x={26} base={88} n={7} />
          <Stack x={154} base={88} n={6} />
        </>
      )}
      {tier >= 5 && (
        <>
          <Goblet x={90} y={58} />
          <Stack x={10} base={88} n={9} r={9} />
          <Stack x={170} base={88} n={8} r={9} />
          <Coin x={48} y={93} r={7} />
          <Coin x={132} y={94} r={7} />
        </>
      )}
    </>
  );
}

export type TradePileTransition = "up" | "down" | "none";

export type TradePileProps = {
  tier: PileTier;
  /** The richer side's pile glows; the lighter side's dims a step (REQ-215). */
  isRicher: boolean;
  /** "up" drops in with a slight overshoot, "down" lifts and fades, "none" on
   * first mount — nothing loops idle (REQ-215). Changes on every tier
   * transition, so the SVG remounts (the `key`) and the matching keyframe
   * (index.css `.trade-pile-tier-up` / `-down`) plays once, not idly. */
  transition: TradePileTransition;
  /** Remount key — bumped by the caller on every tier change so the
   * transition's animation restarts. */
  animationKey: number;
};

/**
 * One side's pile of gold (REQ-215): five flat-drawn tiers in gold/amber with a
 * bronze outline and one purple gem (tiers 4-5), relative to the other side's
 * total.
 */
export function TradePile({ tier, isRicher, transition, animationKey }: TradePileProps): JSX.Element {
  const transitionClass =
    transition === "up" ? "trade-pile-tier-up" : transition === "down" ? "trade-pile-tier-down" : "";

  return (
    <div
      role="img"
      aria-label={`Pile of gold, tier ${tier} of 5${isRicher ? ", the richer side" : ""}`}
      data-testid="trade-pile"
      data-tier={tier}
      // Box sized per `trade-balancer.html`'s `.pile` (132x73 phone, 196x109
      // desktop); the art inside follows that page's own 180x100 drawing.
      className={`trade-pile-surface pile relative mx-auto ${isRicher ? "trade-pile-richer" : "trade-pile-lighter"}`}
    >
      <svg
        key={animationKey}
        viewBox="0 0 180 100"
        className={`h-full w-full ${transitionClass}`}
        aria-hidden="true"
      >
        <PileArt tier={tier} />
      </svg>
    </div>
  );
}
