/* ─────────────────────────────────────────────────────────
 * TASK WIDGET — ANIMATION STORYBOARD
 *
 * INITIAL ENTRANCE:
 *    0ms   container springs in (opacity 0→1, y 16→0)
 *   80ms   header fades up
 *  200ms   card springs in
 *  280ms   task rows stagger in (+80ms each, spring)
 *
 * CALENDAR OPEN (click calendar icon):
 *    0ms   container layout-morphs height (spring stiffness:240 damping:22)
 *          closed view exits — fade + scale 0.97 (150ms ease-in)
 *  120ms   CalendarExpanded panels enter (staggered springs)
 *
 * GUESTS OPEN (click avatar stack):
 *    0ms   container layout-morphs height (same spring)
 *          closed view exits — fade + scale 0.97 (150ms ease-in)
 *   80ms   GuestsExpanded header fades up
 *  160ms   guest card springs in
 *
 * CLOSE (click ×):
 *    0ms   expanded panels exit (staggered)
 *  ~200ms  container collapses
 *          closed view re-enters self-contained
 * ───────────────────────────────────────────────────────── */

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import type React from "react";
import CalendarExpanded from "./CalendarExpanded";
import GuestsExpanded from "./GuestsExpanded";
import { CardRipple, computeRippleUV, type RippleTrigger } from "./CardRipple";

import avatar1 from "./assets/avatar1.png";
import avatar2 from "./assets/avatar2.png";
import avatar3 from "./assets/avatar3.png";
import avatar4 from "./assets/avatar4.png";
import calendarKeylines from "./assets/calendar-keylines.svg";
import calendarSubtract from "./assets/calendar-subtract.svg";

// ─── Spring configs ──────────────────────────────────────
const SPRING_ENTRY  = { type: "spring" as const, visualDuration: 0.45, bounce: 0.14 };
const SPRING_LAYOUT = { type: "spring" as const, stiffness: 240, damping: 22 };
const SPRING_CHECK  = { type: "spring" as const, visualDuration: 0.28, bounce: 0.3 };
const SPRING_PRESS  = { type: "spring" as const, stiffness: 500, damping: 28 };

// ─── View state ──────────────────────────────────────────
type View = "closed" | "calendar" | "guests";

// ─── Data ────────────────────────────────────────────────
const TASKS = [
  { id: 1, label: "Design landing page", time: "Today, 1:00PM" },
  { id: 2, label: "Create dashboard",    time: "Today, 2:00PM" },
  { id: 3, label: "Build AI skills",     time: "Today, 3:00PM" },
  { id: 4, label: "Review code",         time: "Today, 4:00PM" },
];

const AVATARS = [
  { src: avatar1, bg: "#ebebeb" },
  { src: avatar2, bg: "#ffecc0" },
  { src: avatar3, bg: "#c0d5ff" },
  { src: avatar4, bg: "#c0eaff" },
];

// ─── CalendarIcon ────────────────────────────────────────
function CalendarIcon() {
  return (
    <div className="relative pointer-events-none select-none" style={{ width: 20, height: 20 }}>
      <img src={calendarKeylines} alt="" aria-hidden="true"
        className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
      <div className="absolute" style={{ inset: "12.5%" }}>
        <img src={calendarSubtract} alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
      </div>
    </div>
  );
}

// ─── AvatarStack ─────────────────────────────────────────
function AvatarStack({ onClick, triggerRef }: {
  onClick: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      ref={triggerRef}
      onClick={onClick}
      aria-label="View guests"
      aria-haspopup="dialog"
      className="flex items-start select-none outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff] rounded-[6px]"
      style={{ paddingRight: 4 }}
      whileTap={reduced ? {} : { scale: 0.94 }}
      transition={SPRING_PRESS}
    >
      {AVATARS.map((av, i) => (
        <div key={i}
          className="relative rounded-full border-2 border-white shrink-0 overflow-hidden"
          style={{ width: 20, height: 20, background: av.bg,
            marginLeft: i === 0 ? 0 : -4, zIndex: AVATARS.length - i }}>
          <img src={av.src} alt="" aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover rounded-full" />
        </div>
      ))}
      <div className="relative rounded-full border-2 border-white shrink-0 flex items-center justify-center overflow-hidden"
        style={{ width: 20, height: 20, background: "#f7f7f7", marginLeft: -4, zIndex: 0 }}>
        <span aria-hidden="true" style={{ fontFamily: "Inter, sans-serif", fontSize: 9,
          fontWeight: 500, lineHeight: "12px", letterSpacing: "0.22px",
          color: "#5c5c5c", textTransform: "uppercase", fontVariantNumeric: "tabular-nums" }}>
          +9
        </span>
      </div>
    </motion.button>
  );
}

// ─── Checkbox ────────────────────────────────────────────
const GREEN        = "#22c55e";
const SPRING_FILL  = { type: "spring" as const, stiffness: 420, damping: 22, bounce: 0.35 };
const SPRING_MARK  = { type: "spring" as const, stiffness: 380, damping: 24 };
const RING_EASE    = [0.22, 1, 0.36, 1] as const;
const BURST_EASE   = [0.22, 1, 0.36, 1] as const;
const BURST_EMOJIS = ["✨", "⭐", "💫", "🌟", "🎉", "✨", "💥", "🌟"];
const N_PARTICLES  = 8;

function makeParticles() {
  return Array.from({ length: N_PARTICLES }, (_, i) => {
    const angle = (i / N_PARTICLES) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist  = 30 + Math.random() * 22;
    return {
      emoji:  BURST_EMOJIS[i % BURST_EMOJIS.length],
      x:      Math.cos(angle) * dist,
      y:      Math.sin(angle) * dist,
      size:   10 + Math.random() * 6,
      rotate: (Math.random() - 0.5) * 80,
      delay:  i * 0.018 + Math.random() * 0.025,
    };
  });
}

/* ─── CheckboxBurst ──────────────────────────────────── */
function CheckboxBurst({ burstId }: { burstId: number }) {
  const particles = useMemo(makeParticles, [burstId]);
  return (
    <>
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            fontSize:   p.size,
            lineHeight: 1,
            top:        "50%",
            left:       "50%",
            marginTop:  -(p.size / 2),
            marginLeft: -(p.size / 2),
            zIndex:     20,
          }}
          initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
          animate={{
            x:       p.x,
            y:       p.y,
            scale:   [0.2, 1.2, 0],
            opacity: [1,   1,   0],
            rotate:  p.rotate,
          }}
          transition={{
            x:       { duration: 0.58, ease: BURST_EASE, delay: p.delay },
            y:       { duration: 0.58, ease: BURST_EASE, delay: p.delay },
            rotate:  { duration: 0.58, ease: BURST_EASE, delay: p.delay },
            scale:   { duration: 0.58, ease: BURST_EASE, delay: p.delay, times: [0, 0.25, 1] },
            opacity: { duration: 0.58, ease: "easeIn",   delay: p.delay, times: [0, 0.5,  1] },
          }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </>
  );
}

function Checkbox({ checked, onToggle }: {
  checked:  boolean;
  onToggle: (e: React.MouseEvent) => void;
}) {
  const [hovered,    setHovered]    = useState(false);
  const [showRing,   setShowRing]   = useState(false);
  const [ringId,     setRingId]     = useState(0);
  const [showBurst,  setShowBurst]  = useState(false);
  const [burstId,    setBurstId]    = useState(0);
  const prevRef = useRef(false);
  const reduced = useReducedMotion();

  /* Fire ring + burst only on unchecked → checked transition */
  useEffect(() => {
    if (checked && !prevRef.current && !reduced) {
      setRingId((n) => n + 1);
      setShowRing(true);
      setBurstId((n) => n + 1);
      setShowBurst(true);
      const t = setTimeout(() => { setShowRing(false); setShowBurst(false); }, 750);
      return () => clearTimeout(t);
    }
    prevRef.current = checked;
  }, [checked, reduced]);

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onToggle}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
      className="relative shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff] rounded-[4px]"
      style={{ width: 20, height: 20 }}
      whileTap={reduced ? {} : { scale: 0.95 }}
      transition={SPRING_PRESS}
    >
      {/* Unchecked background — fades out as green fill arrives */}
      <div className="absolute rounded-[4px]"
        style={{ inset: "10%",
          background: checked ? "transparent" : hovered ? "#d5d5d5" : "#ebebeb",
          transition: "background 120ms ease" }}
      />

      {/* Green fill — springs in from scale 0, natural overshoot from bounce:0.35 */}
      <motion.div
        className="absolute rounded-[4px]"
        style={{ inset: "10%", background: GREEN, transformOrigin: "center" }}
        initial={false}
        animate={{ scale: checked ? 1 : 0 }}
        transition={reduced ? { duration: 0.08 } : SPRING_FILL}
      />

      {/* Expanding ring — mounts on check, plays once, unmounts */}
      <AnimatePresence>
        {showRing && (
          <motion.div
            key={ringId}
            className="absolute rounded-[4px] pointer-events-none"
            style={{ inset: "10%", border: `1.5px solid ${GREEN}`, transformOrigin: "center" }}
            initial={{ scale: 0.85, opacity: 0.5 }}
            animate={{ scale: 2.8,  opacity: 0  }}
            exit={{}}
            transition={{ duration: 0.62, ease: RING_EASE }}
          />
        )}
      </AnimatePresence>

      {/* Particle burst — fires on check, radiates outward, auto-unmounts */}
      <AnimatePresence>
        {showBurst && <CheckboxBurst key={burstId} burstId={burstId} />}
      </AnimatePresence>

      {/* Checkmark — path draw springs in, then bounces to scale 1 */}
      <motion.svg
        className="absolute pointer-events-none"
        style={{ inset: 0, width: "100%", height: "100%", overflow: "visible" }}
        viewBox="0 0 20 20" fill="none" initial={false}
      >
        <motion.path
          d="M5.5 10.5L8.5 13.5L14.5 7"
          stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={false}
          animate={
            checked
              ? { pathLength: 1, opacity: 1, scale: 1 }
              : { pathLength: 0, opacity: 0, scale: 0.6 }
          }
          transition={
            reduced
              ? { duration: 0.1 }
              : checked
              ? { pathLength: SPRING_MARK,
                  opacity:    { duration: 0.06 },
                  scale:      { type: "spring", stiffness: 360, damping: 20, delay: 0.05 } }
              : { duration: 0.1, ease: "easeIn" }
          }
        />
      </motion.svg>
    </motion.button>
  );
}

// ─── TaskRow ─────────────────────────────────────────────
function TaskRow({ label, time, delayS, onRipple }: {
  label:    string;
  time:     string;
  delayS:   number;
  onRipple: (e: React.MouseEvent) => void;
}) {
  const [checked, setChecked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="flex items-center justify-between w-full rounded-[8px] px-[2px]"
      style={{
        background: hovered ? "rgba(0,0,0,0.025)" : "transparent",
        transition: "background 120ms ease",
        minHeight: 28,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: delayS }}
    >
      <div className="flex items-center gap-2 min-h-px min-w-px" style={{ flex: "1 0 0" }}>
        <Checkbox
          checked={checked}
          onToggle={(e) => { setChecked((v) => !v); onRipple(e); }}
        />

        {/* Label + animated strikethrough line */}
        <div className="relative shrink-0">
          <motion.span
            className="block font-medium text-[14px] leading-[20px] tracking-[-0.084px] select-none"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0", whiteSpace: "nowrap" }}
            animate={{ color: checked ? "#a3a3a3" : "#171717" }}
            transition={reduced ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}>
            {label}
          </motion.span>
          {/* Spring-drawn strikethrough — scaleX 0→1 from left */}
          <motion.div
            className="absolute pointer-events-none"
            style={{ top: "50%", left: 0, right: 0, height: 1,
              background: "#a3a3a3", transformOrigin: "left center" }}
            initial={false}
            animate={{ scaleX: checked ? 1 : 0 }}
            transition={reduced ? { duration: 0 } : { type: "spring", visualDuration: 0.22, bounce: 0 }}
          />
        </div>
      </div>

      {/* Time badge */}
      <div className="flex items-center justify-center px-[6px] py-[2px] rounded-[8px] shrink-0 ml-2"
        style={{ background: "#f7f7f7" }}>
        <p className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] whitespace-nowrap"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0", fontVariantNumeric: "tabular-nums" }}>
          {time}
        </p>
      </div>
    </motion.div>
  );
}

// ─── TaskWidget ───────────────────────────────────────────
export default function TaskWidget() {
  const [view, setView] = useState<View>("closed");
  const reduced = useReducedMotion();

  // Ripple state for the task card
  const cardRef = useRef<HTMLDivElement>(null);
  const [ripple, setRipple] = useState<RippleTrigger>({ x: 0.5, y: 0.5, key: 0 });
  function fireRipple(e: React.MouseEvent) {
    const uv = computeRippleUV(e, cardRef.current);
    if (!uv) return;
    setRipple(prev => ({ ...uv, key: prev.key + 1 }));
  }

  // Focus refs — calendar and guests each have their own trigger + close button
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);
  const avatarTriggerRef   = useRef<HTMLButtonElement>(null);
  const calendarCloseRef   = useRef<HTMLButtonElement>(null) as React.MutableRefObject<HTMLButtonElement>;
  const guestsCloseRef     = useRef<HTMLButtonElement>(null) as React.MutableRefObject<HTMLButtonElement>;
  const prevViewRef        = useRef<View>("closed");

  useEffect(() => {
    if (view === "calendar") {
      prevViewRef.current = "calendar";
      const id = setTimeout(() => calendarCloseRef.current?.focus(), 50);
      return () => clearTimeout(id);
    } else if (view === "guests") {
      prevViewRef.current = "guests";
      const id = setTimeout(() => guestsCloseRef.current?.focus(), 50);
      return () => clearTimeout(id);
    } else {
      // Return focus to whichever trigger opened the panel
      if (prevViewRef.current === "guests") {
        avatarTriggerRef.current?.focus();
      } else {
        calendarTriggerRef.current?.focus();
      }
    }
  }, [view]);

  return (
    <motion.div
      layout
      className="flex flex-col overflow-hidden rounded-[24px] w-full"
      style={{
        background: "#f7f7f7",
        willChange: "transform",
        // Calendar uses tighter spacing; guests/closed use the standard 12px gap
        gap:          view === "calendar" ? 4  : 12,
        paddingTop:   view === "calendar" ? 4  : 12,
        paddingLeft:  4,
        paddingRight: 4,
        paddingBottom: 4,
      }}
      transition={SPRING_LAYOUT}
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {view === "closed" ? (
          /* ── CLOSED VIEW ────────────────────────── */
          <motion.div
            key="closed"
            className="flex flex-col w-full"
            style={{ gap: 12 }}
            exit={{ opacity: 0, scale: 0.97,
              transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
          >
            {/* Header */}
            <motion.div
              className="flex items-center justify-between shrink-0 w-full"
              style={{ paddingLeft: 10, paddingRight: 10 }}
              initial={{ opacity: 0, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: 0.08 }}
            >
              <p className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
                style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}>
                Today
              </p>
              <div className="flex items-center gap-2">
                <motion.button
                  ref={calendarTriggerRef}
                  onClick={() => setView("calendar")}
                  aria-label="Open calendar"
                  aria-expanded={false}
                  aria-haspopup="dialog"
                  className="flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff] rounded-[4px]"
                  whileHover={reduced ? {} : { scale: 1.1 }}
                  whileTap={reduced  ? {} : { scale: 0.88 }}
                  transition={SPRING_PRESS}
                >
                  <CalendarIcon />
                </motion.button>
                <AvatarStack
                  triggerRef={avatarTriggerRef}
                  onClick={() => setView("guests")}
                />
              </div>
            </motion.div>

            {/* Task card */}
            <motion.div
              ref={cardRef}
              className="relative flex flex-col gap-2 px-3 py-3 shrink-0 w-full overflow-hidden"
              style={{
                borderRadius: "16px 16px 20px 20px",
                background: "white",
                boxShadow:
                  "0px 4px 8px -2px rgba(51,51,51,0.06)," +
                  "0px 2px 4px 0px rgba(51,51,51,0.04)," +
                  "0px 1px 2px 0px rgba(51,51,51,0.04)," +
                  "0px 0px 0px 1px #f5f5f5",
              }}
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: 0.16 }}
            >
              {TASKS.map((task, i) => (
                <TaskRow key={task.id} label={task.label} time={task.time}
                  delayS={0.26 + i * 0.07} onRipple={fireRipple} />
              ))}
              {/* WebGL glow ripple — fires from checkbox click position */}
              <CardRipple trigger={ripple} />
              {/* inner bottom vignette */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ borderRadius: "inherit",
                  boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)" }} />
            </motion.div>
          </motion.div>

        ) : view === "calendar" ? (
          /* ── CALENDAR VIEW ──────────────────────── */
          <motion.div
            key="calendar"
            className="flex flex-col w-full"
            style={{ gap: 4 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
          >
            <CalendarExpanded
              onClose={() => setView("closed")}
              closeButtonRef={calendarCloseRef}
            />
          </motion.div>

        ) : (
          /* ── GUESTS VIEW ────────────────────────── */
          <motion.div
            key="guests"
            className="flex flex-col w-full"
            style={{ gap: 12 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
          >
            <GuestsExpanded
              onClose={() => setView("closed")}
              closeButtonRef={guestsCloseRef}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
