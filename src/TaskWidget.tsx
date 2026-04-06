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
import { useRef, useState, useEffect } from "react";
import type React from "react";
import CalendarExpanded from "./CalendarExpanded";
import GuestsExpanded from "./GuestsExpanded";

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
function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onToggle}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
      className="relative shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff] rounded-[4px]"
      style={{ width: 20, height: 20 }}
      whileTap={reduced ? {} : { scale: 0.88 }}
      transition={SPRING_PRESS}
    >
      {/* outer bg */}
      <div className="absolute rounded-[4px]"
        style={{ inset: "10%", background: checked ? "#171717" : hovered ? "#d5d5d5" : "#ebebeb",
          transition: "background 120ms ease" }} />
      {/* inner white box */}
      <motion.div className="absolute rounded-[2.5px]"
        style={{ inset: "17.5%", background: "white" }}
        animate={{ opacity: checked ? 0 : 1,
          boxShadow: checked ? "0px 0px 0px 0px rgba(27,28,29,0)"
            : "0px 2px 2px 0px rgba(27,28,29,0.12)" }}
        transition={{ duration: 0.12 }} />
      {/* checkmark (path-draw spring) */}
      <motion.svg className="absolute pointer-events-none"
        style={{ inset: 0, width: "100%", height: "100%" }}
        viewBox="0 0 20 20" fill="none" initial={false} animate={checked ? "on" : "off"}>
        <motion.path d="M5.5 10.5L8.5 13.5L14.5 7"
          stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          variants={{
            off: { pathLength: 0, opacity: 0 },
            on:  { pathLength: 1, opacity: 1,
              transition: reduced ? { duration: 0.1 } : SPRING_CHECK },
          }} />
      </motion.svg>
    </motion.button>
  );
}

// ─── TaskRow ─────────────────────────────────────────────
function TaskRow({ label, time, delayS }: { label: string; time: string; delayS: number }) {
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
        <Checkbox checked={checked} onToggle={() => setChecked((v) => !v)} />

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
                  aria-expanded={view === "calendar"}
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
                  delayS={0.26 + i * 0.07} />
              ))}
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
