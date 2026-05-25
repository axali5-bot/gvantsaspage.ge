import { useRef, useEffect, useCallback, useState } from "react";

const MOUTH_PHASES = {
  0: (
    <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 20 Q 50 24 80 20" fill="none" stroke="#8B1A1A" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M 20 20 Q 35 16 50 17 Q 65 16 80 20" fill="#C0392B" stroke="#8B1A1A" strokeWidth="1.5"/>
    </svg>
  ),
  1: (
    <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 18 Q 35 13 50 14 Q 65 13 80 18" fill="#C0392B" stroke="#8B1A1A" strokeWidth="1.5"/>
      <ellipse cx="50" cy="24" rx="28" ry="6" fill="#4A0E0E"/>
      <path d="M 22 22 Q 50 32 78 22" fill="#C0392B" stroke="#8B1A1A" strokeWidth="1.5"/>
    </svg>
  ),
  2: (
    <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M 18 16 Q 35 9 50 10 Q 65 9 82 16" fill="#C0392B" stroke="#8B1A1A" strokeWidth="1.5"/>
      <ellipse cx="50" cy="24" rx="30" ry="11" fill="#2C0A0A"/>
      <rect x="24" y="16" width="52" height="7" rx="3" fill="#F5F0E8"/>
      <path d="M 20 28 Q 50 38 80 28" fill="#C0392B" stroke="#8B1A1A" strokeWidth="1.5"/>
    </svg>
  ),
  3: (
    <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M 16 14 Q 35 5 50 6 Q 65 5 84 14" fill="#C0392B" stroke="#8B1A1A" strokeWidth="2"/>
      <ellipse cx="50" cy="24" rx="32" ry="14" fill="#1A0505"/>
      <rect x="20" y="13" width="60" height="8" rx="3.5" fill="#F5F0E8"/>
      <path d="M 18 30 Q 50 40 82 30" fill="#C0392B" stroke="#8B1A1A" strokeWidth="2"/>
    </svg>
  ),
};

interface MouthConfig {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface LipSyncAvatarProps {
  imageSrc: string;
  speaking: boolean;
  audioElement?: HTMLAudioElement | null;
  className?: string;
  mouthConfig?: MouthConfig;
}

// Calibrated for /ai-consultant-new.png (323×512)
const DEFAULT_MOUTH: MouthConfig = { top: 43, left: 27, width: 46, height: 10 };

export function LipSyncAvatar({
  imageSrc,
  speaking,
  className,
  mouthConfig = DEFAULT_MOUTH,
}: LipSyncAvatarProps) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runSimulation = useCallback(() => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    simTimerRef.current = setInterval(() => {
      const r = Math.random();
      const p = r < 0.12 ? 0 : r < 0.30 ? 1 : r < 0.68 ? 2 : 3;
      setPhase(p as 0 | 1 | 2 | 3);
    }, 85);
  }, []);

  const stopSimulation = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setPhase(0);
  }, []);

  useEffect(() => {
    if (speaking) runSimulation();
    else stopSimulation();
    return () => stopSimulation();
  }, [speaking, runSimulation, stopSimulation]);

  const { top, left, width, height } = mouthConfig;

  return (
    <div className={`relative inline-block select-none ${className ?? ""}`}>
      <img
        src={imageSrc}
        alt="AI ასისტენტი"
        className="w-full h-auto block"
        draggable={false}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: `${top}%`,
          left: `${left}%`,
          width: `${width}%`,
          height: `${height}%`,
          pointerEvents: "none",
          transition: "all 0.05s ease",
        }}
      >
        {MOUTH_PHASES[phase]}
      </div>
    </div>
  );
}
