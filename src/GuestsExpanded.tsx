/* ─────────────────────────────────────────────────────────
 * GUESTS EXPANDED — ANIMATION STORYBOARD
 *
 * ENTER (after container grows):
 *   80ms   header fades up (opacity 0→1, y 6→0, spring)
 *  160ms   guest card springs in (opacity 0→1, y 10→0)
 *
 * EXIT (before container shrinks):
 *    0ms   guest card: opacity→0, y→6 (140ms ease-in)
 *  140ms   header: opacity→0, y→4 (100ms ease-in)
 * ───────────────────────────────────────────────────────── */

import { motion, useReducedMotion } from "framer-motion";
import { type RefObject } from "react";
import avatar1 from "./assets/avatar1.png";
import avatar2 from "./assets/avatar2.png";
import avatar3 from "./assets/avatar3.png";
import avatar4 from "./assets/avatar4.png";
import chevronDownSrc from "./assets/chevron-down.svg";
import closeSrc from "./assets/close.svg";

// ─── Spring configs ──────────────────────────────────────
const SPRING      = { type: "spring" as const, stiffness: 240, damping: 22 };
const SPRING_SOFT = { type: "spring" as const, stiffness: 200, damping: 24 };
const SPRING_PRESS = { type: "spring" as const, stiffness: 500, damping: 28 };

// ─── Guest data ──────────────────────────────────────────
const GUESTS = [
  { id: 1, name: "John tony",   role: "Can view", src: avatar2, bg: "#ffecc0" },
  { id: 2, name: "James imade", role: "Can view", src: avatar3, bg: "#c0d5ff" },
  { id: 3, name: "Johnson eve", role: "Can view", src: avatar4, bg: "#c0eaff" },
  { id: 4, name: "Tima sbdhs",  role: "Can edit", src: avatar1, bg: "#cac0ff" },
] as const;

// ─── PermissionChevron ───────────────────────────────────
// Same chevron-down pattern as "April 2026" dropdown, rotated to point down
function PermissionChevron() {
  return (
    <div className="relative shrink-0" style={{ width: 16, height: 16 }}>
      <div
        className="absolute flex items-center justify-center"
        style={{ top: "15.36%", left: "26.43%", right: "26.43%", bottom: "37.5%" }}
      >
        <div style={{ transform: "rotate(-135deg)", width: 8, height: 8, flexShrink: 0 }}>
          <div className="relative w-full h-full">
            <div className="absolute" style={{ inset: "-9.38%" }}>
              <img src={chevronDownSrc} alt="" aria-hidden="true" className="block w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GuestsExpanded ──────────────────────────────────────
interface GuestsExpandedProps {
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement>;
}

export default function GuestsExpanded({ onClose, closeButtonRef }: GuestsExpandedProps) {
  const reduced = useReducedMotion();

  return (
    <>
      {/* ── Header ─────────────────────────────────── */}
      <motion.div
        className="flex items-center justify-between shrink-0 w-full"
        style={{ paddingLeft: 10, paddingRight: 10 }}
        initial={{ opacity: 0, y: reduced ? 0 : 6 }}
        animate={{ opacity: 1, y: 0, transition: { ...SPRING, delay: 0.08 } }}
        exit={{ opacity: 0, y: reduced ? 0 : 4,
          transition: { duration: 0.1, ease: [0.4, 0, 1, 1], delay: 0.14 } }}
      >
        <p
          className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
        >
          Guests
        </p>

        <motion.button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close guests"
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
      </motion.div>

      {/* ── Guest card ─────────────────────────────── */}
      <motion.div
        className="relative flex flex-col gap-3 p-3 shrink-0 w-full overflow-hidden"
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
        animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.16 } }}
        exit={{ opacity: 0, y: reduced ? 0 : 6,
          transition: { duration: 0.14, ease: [0.4, 0, 1, 1], delay: 0 } }}
      >
        {/* Guest rows */}
        <div className="flex flex-col gap-3 w-full">
          {GUESTS.map((g) => (
            <div key={g.id} className="flex items-center justify-between w-full">
              {/* Left: avatar + name */}
              <div className="flex items-center gap-2 min-h-px min-w-px" style={{ flex: "1 0 0" }}>
                <div
                  className="relative rounded-full border-2 border-white shrink-0 overflow-hidden"
                  style={{ width: 20, height: 20, background: g.bg }}
                >
                  <img
                    src={g.src}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover rounded-full"
                  />
                </div>
                <p
                  className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#171717] whitespace-nowrap select-none"
                  style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                >
                  {g.name}
                </p>
              </div>

              {/* Right: permission label + chevron */}
              <div className="flex items-center gap-1 shrink-0">
                <p
                  className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#5c5c5c] whitespace-nowrap select-none"
                  style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                >
                  {g.role}
                </p>
                <PermissionChevron />
              </div>
            </div>
          ))}
        </div>

        {/* Share link button */}
        <motion.button
          className="relative flex w-full items-center justify-center overflow-hidden rounded-[8px] outline-none
            focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
          style={{
            padding: 6,
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
              "linear-gradient(90deg, #171717 0%, #171717 100%)",
            boxShadow:
              "0px 0px 0px 0.75px #171717," +
              "inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
          }}
          whileHover={reduced ? {} : { opacity: 0.88 }}
          whileTap={reduced  ? {} : { scale: 0.98 }}
          transition={SPRING_PRESS}
        >
          <p
            className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-white select-none"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
          >
            Share link
          </p>
        </motion.button>

        {/* Inner bottom vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: "inherit",
            boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)" }} />
      </motion.div>
    </>
  );
}
