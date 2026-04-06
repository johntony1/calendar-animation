/* ─────────────────────────────────────────────────────────
 * CALENDAR EXPANDED — ANIMATION STORYBOARD
 *
 * ENTER (after container grows):
 *   100ms  calendar card: y -10 → 0, opacity 0 → 1 (spring)
 *   180ms  tasks section: y 8 → 0, opacity 0 → 1
 *   260ms  segmented control: y 8 → 0, opacity 0 → 1
 *
 * EXIT (before container shrinks):
 *     0ms  segmented control: opacity → 0, y → 5
 *    55ms  tasks section: opacity → 0, y → 4
 *   100ms  calendar card: y → -6, opacity → 0
 *
 * Interactions:
 *   Day cell tap  → spring selection morph (layoutId)
 *   Nav arrow tap → spring press (whileTap scale 0.9)
 *   Close tap     → spring press + focus return
 * ───────────────────────────────────────────────────────── */

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRef, useState, type RefObject } from "react";
import type React from "react";
import { CardRipple, computeRippleUV, type RippleTrigger } from "./CardRipple";
import arrowLeftSrc   from "./assets/arrow-left.svg";
import arrowRightSrc  from "./assets/arrow-right.svg";
import chevronDownSrc from "./assets/chevron-down.svg";
import closeSrc       from "./assets/close.svg";

// ─── Spring configs ──────────────────────────────────────
const SPRING      = { type: "spring" as const, stiffness: 240, damping: 22 };
const SPRING_SOFT = { type: "spring" as const, stiffness: 200, damping: 24 };
const SPRING_PRESS = { type: "spring" as const, stiffness: 500, damping: 28 };
const SPRING_CHECK = { type: "spring" as const, visualDuration: 0.28, bounce: 0.3 };

// ─── Week generation ─────────────────────────────────────
// Base = Mar 31 2026 (first day shown in Figma at weekOffset 0)
const BASE_DATE  = new Date(2026, 2, 31);
const DAY_NAMES  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] as const;
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
] as const;

function getWeekDays(offset: number) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(BASE_DATE);
    d.setDate(BASE_DATE.getDate() + offset * 5 + i);
    return {
      key:   `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
      day:   DAY_NAMES[d.getDay()],
      date:  String(d.getDate()).padStart(2, "0"),
      month: d.getMonth(),
      year:  d.getFullYear(),
    };
  });
}

// Apr 2 2026 = "2026-3-2" (getMonth() is 0-indexed)
const TODAY_KEY = "2026-3-2";

const TABS = ["Home", "Work", "Family"] as const;
type Tab = (typeof TABS)[number];

type TaskItem = { id: number; label: string; time: string };

const TASK_POOL: Record<Tab, TaskItem[]> = {
  Home: [
    { id: 1, label: "Design landing page", time: "1:00 PM" },
    { id: 2, label: "Create dashboard",    time: "2:00 PM" },
    { id: 3, label: "Review prototype",    time: "4:00 PM" },
    { id: 4, label: "Update components",   time: "10:00 AM" },
    { id: 5, label: "Fix layout bugs",     time: "11:00 AM" },
    { id: 6, label: "Write blog post",     time: "3:00 PM" },
  ],
  Work: [
    { id: 1, label: "Team standup",        time: "9:00 AM" },
    { id: 2, label: "Review pull request", time: "11:00 AM" },
    { id: 3, label: "Deploy to staging",   time: "3:00 PM" },
    { id: 4, label: "Client check-in",     time: "1:00 PM" },
    { id: 5, label: "Sprint planning",     time: "10:00 AM" },
    { id: 6, label: "Write API docs",      time: "4:00 PM" },
  ],
  Family: [
    { id: 1, label: "Pick up groceries",   time: "5:00 PM" },
    { id: 2, label: "School pickup",       time: "3:30 PM" },
    { id: 3, label: "Movie night",         time: "7:00 PM" },
    { id: 4, label: "Cook dinner",         time: "6:00 PM" },
    { id: 5, label: "Morning walk",        time: "7:00 AM" },
    { id: 6, label: "Call parents",        time: "8:00 PM" },
  ],
};

// Deterministic task selection: hash dayKey → rotate pool
function hashDayKey(k: string): number {
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return h;
}
function getTasksForDay(tab: Tab, dayKey: string): TaskItem[] {
  const pool = TASK_POOL[tab];
  const start = hashDayKey(dayKey) % (pool.length - 2);
  return pool.slice(start, start + 3);
}

// Parse a "year-month-date" key (month is 0-indexed) to a timestamp for comparison
function parseKey(k: string): number {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m, d).getTime();
}

// ─── Tab slide variants ──────────────────────────────────
// dir: 1 = moving right (enter from right), -1 = moving left (enter from left)
const TASK_SLIDE = {
  enter: (dir: number) => ({ x: dir * 28, opacity: 0 }),
  center: { x: 0, opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
  exit: (dir: number) => ({ x: dir * -28, opacity: 0,
    transition: { duration: 0.13, ease: [0.4, 0, 1, 1] } }),
};

// ─── DayCell ─────────────────────────────────────────────
// Min 44px height, tabular-nums on date, spring selection via layoutId.
function DayCell({
  dayKey, day, date, selected, onSelect,
}: {
  dayKey: string; day: string; date: string; selected: boolean; onSelect: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      onClick={onSelect}
      aria-label={`Select ${day} ${date}`}
      aria-pressed={selected}
      className="relative flex flex-1 flex-col items-center overflow-hidden px-1 py-2 rounded-lg outline-none
        focus-visible:ring-2 focus-visible:ring-[#c0d5ff] focus-visible:ring-offset-1"
      style={{ background: "transparent" }}
      whileTap={reduced ? {} : { scale: 0.94 }}
      transition={SPRING_PRESS}
    >
      {/* Selected indicator — shared layout so it morphs between cells */}
      {selected && (
        <motion.div
          layoutId="day-selected"
          className="absolute inset-0 rounded-lg"
          style={{
            background:
              "linear-gradient(rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 100%), #171717",
            boxShadow:
              "0px 0px 0px 0.75px #171717, inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
          }}
          transition={reduced ? { duration: 0.15 } : SPRING}
        />
      )}
      {/* Unselected hover bg */}
      {!selected && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ background: "rgba(0,0,0,0.04)", opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.12, ease: "ease" }}
        />
      )}

      <span
        className="relative font-normal text-[12px] leading-[16px] w-full text-center pointer-events-none"
        style={{
          color: selected ? "white" : "#5c5c5c",
          fontFeatureSettings: "'ss11', 'calt' 0",
          transition: "color 150ms ease",
        }}
      >
        {day}
      </span>
      <span
        className="relative font-medium text-[16px] leading-[24px] tracking-[-0.176px] w-full text-center pointer-events-none"
        style={{
          color: selected ? "white" : "#171717",
          fontFeatureSettings: "'ss11', 'calt' 0",
          fontVariantNumeric: "tabular-nums",
          transition: "color 150ms ease",
        }}
      >
        {date}
      </span>
    </motion.button>
  );
}

// ─── NavArrow ────────────────────────────────────────────
function NavArrow({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      onClick={onClick}
      aria-label={alt}
      className="flex items-center justify-center overflow-hidden rounded-[6px] bg-white
        border border-[#ebebeb] outline-none
        focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
      style={{
        padding: 2,
        boxShadow: "0px 1px 2px 0px rgba(10,13,20,0.03)",
      }}
      whileHover={reduced ? {} : { backgroundColor: "#f7f7f7" }}
      whileTap={reduced  ? {} : { scale: 0.9 }}
      transition={SPRING_PRESS}
    >
      <div className="relative overflow-hidden pointer-events-none" style={{ width: 20, height: 20 }}>
        <div className="absolute" style={{ inset: "26.13% 35.42%" }}>
          <img src={src} alt="" aria-hidden="true"
            className="absolute inset-0 w-full h-full block" />
        </div>
      </div>
    </motion.button>
  );
}

// ─── CheckboxExpanded (uses #d1d1d1 outer bg) ───────────
function CheckboxExpanded({ onToggle }: { onToggle: (e: React.MouseEvent) => void }) {
  const [checked, setChecked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { setChecked((v) => !v); onToggle(e); }}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
      className="relative shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        focus-visible:ring-[#c0d5ff] rounded-[4px]"
      style={{ width: 20, height: 20 }}
      whileTap={reduced ? {} : { scale: 0.88 }}
      transition={SPRING_PRESS}
    >
      <div className="absolute rounded-[4px]"
        style={{ inset: "10%", background: checked ? "#171717" : hovered ? "#bdbdbd" : "#d1d1d1",
          transition: "background 120ms ease" }} />
      <motion.div className="absolute rounded-[2.5px]"
        style={{ inset: "17.5%", background: "white" }}
        animate={{ opacity: checked ? 0 : 1 }}
        transition={{ duration: 0.12 }} />
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

// ─── CalendarExpanded ────────────────────────────────────
interface CalendarExpandedProps {
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement>;
}

export default function CalendarExpanded({ onClose, closeButtonRef }: CalendarExpandedProps) {
  const [selectedDay, setSelectedDay] = useState(TODAY_KEY);
  const [weekOffset, setWeekOffset]   = useState(0);
  const [activeTab, setActiveTab]     = useState<Tab>("Home");
  const taskDirectionRef = useRef(1);
  const dayDirectionRef  = useRef(1);
  const reduced = useReducedMotion();

  // Ripple state for the task section card
  const taskSectionRef = useRef<HTMLDivElement>(null);
  const [ripple, setRipple] = useState<RippleTrigger>({ x: 0.5, y: 0.5, key: 0 });
  function fireRipple(e: React.MouseEvent) {
    const uv = computeRippleUV(e, taskSectionRef.current);
    if (!uv) return;
    setRipple(prev => ({ ...uv, key: prev.key + 1 }));
  }

  const weekDays   = getWeekDays(weekOffset);
  const middleDay  = weekDays[2];
  const monthLabel = `${MONTH_NAMES[middleDay.month]} ${middleDay.year}`;

  function switchTab(newTab: Tab) {
    const oldIdx = TABS.indexOf(activeTab);
    const newIdx = TABS.indexOf(newTab);
    taskDirectionRef.current = newIdx > oldIdx ? 1 : -1;
    setActiveTab(newTab);
  }

  function handleDaySelect(dayKey: string) {
    if (dayKey === selectedDay) return;
    const newIdx = weekDays.findIndex((d) => d.key === dayKey);
    const oldIdx = weekDays.findIndex((d) => d.key === selectedDay);
    if (newIdx !== -1 && oldIdx !== -1) {
      taskDirectionRef.current = newIdx > oldIdx ? 1 : -1;
    } else {
      taskDirectionRef.current = parseKey(dayKey) > parseKey(selectedDay) ? 1 : -1;
    }
    setSelectedDay(dayKey);
  }

  return (
    <>
      {/* ── Calendar card ──────────────────────────── */}
      <motion.div
        role="dialog"
        aria-label="Calendar"
        className="relative flex flex-col gap-2 p-3 shrink-0 w-full overflow-hidden"
        style={{
          borderRadius: "20px 20px 16px 16px",
          background: "white",
          boxShadow:
            "0px 4px 8px -2px rgba(51,51,51,0.06)," +
            "0px 2px 4px 0px rgba(51,51,51,0.04)," +
            "0px 1px 2px 0px rgba(51,51,51,0.04)," +
            "0px 0px 0px 1px #f5f5f5",
        }}
        initial={{ opacity: 0, y: reduced ? 0 : -10 }}
        animate={{ opacity: 1, y: 0, transition: { ...SPRING, delay: 0.08 } }}
        exit={{ opacity: 0, y: reduced ? 0 : -6,
          transition: { duration: 0.14, ease: [0.4, 0, 1, 1], delay: 0.1 } }}
      >
        {/* Month header */}
        <div className="flex items-center justify-between shrink-0 w-full">
          {/* Month label + chevron — derived from current week */}
          <div className="flex items-center gap-1 select-none">
            <p className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#5c5c5c]"
              style={{ fontFeatureSettings: "'ss11', 'calt' 0", fontVariantNumeric: "tabular-nums" }}>
              {monthLabel}
            </p>
            {/* arrow/down icon: 16px container, keylines bg + L-corner SVG rotated -135° */}
            <div className="relative shrink-0 pointer-events-none" style={{ width: 16, height: 16 }}>
              {/* keylines — transparent frame */}
              <img src={arrowLeftSrc} alt="" aria-hidden="true"
                className="absolute inset-0 w-full h-full opacity-0" />
              {/* L-corner piece at Figma insets: top 15.36%, sides 26.43%, bottom 37.5% */}
              <div className="absolute flex items-center justify-center"
                style={{ top: "15.36%", left: "26.43%", right: "26.43%", bottom: "37.5%" }}>
                <div style={{ transform: "rotate(-135deg)", width: 8, height: 8, flexShrink: 0 }}>
                  <div className="relative w-full h-full">
                    <div className="absolute" style={{ inset: "-9.38%" }}>
                      <img src={chevronDownSrc} alt="" aria-hidden="true"
                        className="block w-full h-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close */}
          <motion.button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close calendar"
            className="relative flex items-center justify-center overflow-hidden rounded-[4px] outline-none
              focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
            style={{ width: 20, height: 20 }}
            whileHover={reduced ? {} : { backgroundColor: "rgba(0,0,0,0.06)" }}
            whileTap={reduced  ? {} : { scale: 0.88 }}
            transition={SPRING_PRESS}
          >
            <div className="absolute" style={{ inset: "26.14% 26.13%" }}>
              <img src={closeSrc} alt="" aria-hidden="true"
                className="absolute inset-0 w-full h-full block" />
            </div>
          </motion.button>
        </div>

        {/* Day picker */}
        <div className="flex items-center gap-2 shrink-0 w-full">
          <NavArrow
            src={arrowLeftSrc}
            alt="Previous week"
            onClick={() => {
              dayDirectionRef.current = -1;
              setWeekOffset((w) => w - 1);
            }}
          />

          {/* Overflow-hidden clips the horizontal slide; position:relative anchors popLayout exit */}
          <div className="flex flex-1 overflow-hidden" style={{ position: "relative" }}>
            <AnimatePresence custom={dayDirectionRef.current} mode="popLayout" initial={false}>
              <motion.div
                key={weekOffset}
                custom={dayDirectionRef.current}
                variants={reduced ? undefined : TASK_SLIDE}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-1 items-center gap-1"
              >
                {weekDays.map((d) => (
                  <DayCell
                    key={d.key}
                    dayKey={d.key}
                    day={d.day}
                    date={d.date}
                    selected={selectedDay === d.key}
                    onSelect={() => handleDaySelect(d.key)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <NavArrow
            src={arrowRightSrc}
            alt="Next week"
            onClick={() => {
              dayDirectionRef.current = 1;
              setWeekOffset((w) => w + 1);
            }}
          />
        </div>

        {/* Inner bottom vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: "inherit",
            boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)" }} />
      </motion.div>

      {/* ── Tasks section ──────────────────────────── */}
      <motion.div
        ref={taskSectionRef}
        className="flex flex-col gap-2 shrink-0 w-full rounded-[16px] py-2"
        style={{ background: "#ebebeb", overflow: "hidden", position: "relative" }}
        initial={{ opacity: 0, y: reduced ? 0 : 8 }}
        animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.16 } }}
        exit={{ opacity: 0, y: reduced ? 0 : 4,
          transition: { duration: 0.1, ease: [0.4, 0, 1, 1], delay: 0.055 } }}
      >
        {/* "Tasks" — left-aligned with px-[12px] to match Figma */}
        <div className="flex items-center px-[12px]">
          <p className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}>
            Tasks
          </p>
        </div>

        {/* Directional slide on tab switch or day selection */}
        <AnimatePresence custom={taskDirectionRef.current} mode="popLayout" initial={false}>
          <motion.div
            key={`${activeTab}-${selectedDay}`}
            custom={taskDirectionRef.current}
            variants={reduced ? undefined : TASK_SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col gap-3 w-full"
          >
            {getTasksForDay(activeTab, selectedDay).map((task) => (
              <div key={task.id} className="flex items-center justify-between px-[8px] w-full">
                {/* Left: flex-[1_0_0] — grows, never shrinks */}
                <div className="flex items-center gap-[8px] min-h-px min-w-px" style={{ flex: "1 0 0" }}>
                  <CheckboxExpanded onToggle={fireRipple} />
                  <div className="flex items-center gap-[4px] min-h-px min-w-px" style={{ flex: "1 0 0" }}>
                    <p className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#171717] whitespace-nowrap shrink-0 select-none"
                      style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}>
                      {task.label}
                    </p>
                  </div>
                </div>
                {/* Right: shrink-0 time badge */}
                <div className="flex items-center justify-center px-[6px] py-[2px] rounded-[8px] shrink-0"
                  style={{ background: "#f7f7f7" }}>
                  <p className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] whitespace-nowrap"
                    style={{ fontFeatureSettings: "'ss11', 'calt' 0", fontVariantNumeric: "tabular-nums" }}>
                    {task.time}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
        {/* WebGL glow ripple — fires from checkbox click position */}
        <CardRipple trigger={ripple} glowColor="#2d9cff" />
      </motion.div>

      {/* ── Segmented control ──────────────────────── */}
      <motion.div
        className="flex shrink-0 w-full rounded-full p-1"
        style={{ background: "#ebebeb", minHeight: 44 }}
        initial={{ opacity: 0, y: reduced ? 0 : 8 }}
        animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.24 } }}
        exit={{ opacity: 0, y: reduced ? 0 : 5,
          transition: { duration: 0.08, ease: [0.4, 0, 1, 1], delay: 0 } }}
      >
        {TABS.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <motion.button
              key={tab}
              onClick={() => switchTab(tab)}
              aria-pressed={isActive}
              className="relative flex flex-1 items-center justify-center rounded-full outline-none
                focus-visible:ring-2 focus-visible:ring-[#c0d5ff] focus-visible:ring-offset-1"
              style={{  }}
              whileTap={reduced ? {} : { scale: 0.96 }}
              transition={SPRING_PRESS}
            >
              {/* Shared sliding pill indicator */}
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    layoutId="seg-pill"
                    className="absolute inset-0 rounded-full bg-white"
                    style={{
                      boxShadow:
                        "0px 6px 10px 0px rgba(14,18,27,0.06)," +
                        "0px 2px 4px 0px rgba(14,18,27,0.03)",
                    }}
                    transition={reduced ? { duration: 0.15 } : SPRING}
                  />
                )}
              </AnimatePresence>
              <span
                className="relative font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-center select-none"
                style={{
                  color: isActive ? "#171717" : "#a3a3a3",
                  transition: "color 180ms ease",
                  fontFeatureSettings: "'ss11', 'calt' 0",
                }}
              >
                {tab}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </>
  );
}
