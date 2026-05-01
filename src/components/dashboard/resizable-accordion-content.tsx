"use client";

import { useState, useRef } from "react";
import { Resizable } from "re-resizable";
import { useSound } from "@/hooks/use-sound";
import { cloth1Sound } from "@/lib/cloth-1";
import { clickSoftSound } from "@/lib/click-soft";
import { getSectionHeight, setSectionHeight } from "@/lib/utils/section-heights";
import {
  clampHeight,
  expandedHeight,
  MIN_SECTION_HEIGHT,
  DEFAULT_SECTION_HEIGHT,
} from "@/lib/utils/height-utils";

const MAX_HEIGHT = 1200;

function DragHandle({
  color,
  onDoubleClick,
}: {
  color: string;
  onDoubleClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex w-full items-center justify-center h-5 cursor-row-resize select-none"
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex gap-1.5 transition-opacity duration-150"
        style={{ opacity: hovered ? 1 : 0.4 }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

interface Props {
  id: string;
  color: string;
  soundsEnabled: boolean;
  children: React.ReactNode;
}

export function ResizableAccordionContent({
  id,
  color,
  soundsEnabled,
  children,
}: Props) {
  const [height, setHeight] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SECTION_HEIGHT;
    return getSectionHeight(localStorage, id, DEFAULT_SECTION_HEIGHT);
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const startHeightRef = useRef(height);
  const containerRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canPlay = soundsEnabled && !prefersReducedMotion;

  const [playDragGrab] = useSound(clickSoftSound, {
    volume: 0.3,
    interrupt: true,
    soundEnabled: canPlay,
  });
  const [playFullExpand] = useSound(cloth1Sound, {
    volume: 0.4,
    interrupt: true,
    soundEnabled: canPlay,
  });

  const handleExpand = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newHeight = expandedHeight(window.innerHeight, rect.top);
    setIsTransitioning(true);
    setHeight(newHeight);
    setSectionHeight(localStorage, id, newHeight);
    playFullExpand();
    setTimeout(() => setIsTransitioning(false), 220);
  };

  return (
    <div ref={containerRef}>
      <Resizable
        size={{ width: "100%", height }}
        style={
          isTransitioning ? { transition: "height 200ms ease" } : undefined
        }
        onResizeStart={() => {
          startHeightRef.current = height;
          playDragGrab();
        }}
        onResizeStop={(_, __, ___, d) => {
          const newHeight = clampHeight(
            startHeightRef.current + d.height,
            MIN_SECTION_HEIGHT,
            MAX_HEIGHT,
          );
          setHeight(newHeight);
          setSectionHeight(localStorage, id, newHeight);
        }}
        enable={{
          top: false,
          right: false,
          bottom: true,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
        minHeight={MIN_SECTION_HEIGHT}
        maxHeight={MAX_HEIGHT}
        handleComponent={{
          bottom: <DragHandle color={color} onDoubleClick={handleExpand} />,
        }}
        handleStyles={{
          bottom: { height: 20, bottom: 0, cursor: "row-resize" },
        }}
      >
        <div className="overflow-y-auto pr-2" style={{ height: "100%" }}>
          {children}
        </div>
      </Resizable>
    </div>
  );
}
