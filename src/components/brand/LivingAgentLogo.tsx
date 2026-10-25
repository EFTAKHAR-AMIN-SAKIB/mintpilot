"use client";

import React, { useState, useEffect, useRef } from "react";

export interface LivingAgentLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  isThinking?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  showAura?: boolean;
}

const SIZE_MAP = {
  xs: "w-5 h-5",
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-11 h-11",
  xl: "w-16 h-16",
  hero: "w-24 h-24 sm:w-28 sm:h-28",
};

export const LivingAgentLogo: React.FC<LivingAgentLogoProps> = ({
  size = "lg",
  isThinking = false,
  interactive = true,
  className = "",
  onClick,
  showAura = true,
}) => {
  // Gaze coordinates (range: -5 to +5)
  const [gaze, setGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isHappy, setIsHappy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------
  // 1. Natural Biological Blink Loop
  // -------------------------------------------------------------
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleBlink = () => {
      // Natural blink every 2.8 to 5.2 seconds
      const nextDelay = isThinking ? 1800 : Math.random() * 2400 + 2800;

      timeoutId = setTimeout(() => {
        setIsBlinking(true);

        // Blink duration: 130ms
        setTimeout(() => {
          setIsBlinking(false);

          // 25% chance of an authentic double-blink
          if (Math.random() < 0.25) {
            setTimeout(() => {
              setIsBlinking(true);
              setTimeout(() => setIsBlinking(false), 120);
            }, 140);
          }

          scheduleBlink();
        }, 130);
      }, nextDelay);
    };

    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, [isThinking]);

  // -------------------------------------------------------------
  // 2. Autonomous Living Saccades (Looking around like a living thing)
  // -------------------------------------------------------------
  useEffect(() => {
    if (isHovered && interactive) return; // Cursor tracking takes precedence

    let lookTimeoutId: NodeJS.Timeout;

    const gazeTargets = [
      { x: 0, y: 0 },       // Center forward
      { x: -3.5, y: -1 },   // Glancing top-left (curious)
      { x: 0, y: 0 },       // Center forward
      { x: 3.5, y: 1 },     // Glancing bottom-right (scanning)
      { x: -2, y: 2 },      // Glancing down-left
      { x: 0, y: 0 },       // Center forward
      { x: 0, y: -2.5 },    // Looking upward (contemplative)
      { x: 3, y: -1.5 },    // Glancing top-right
    ];

    let targetIdx = 0;

    const scheduleLook = () => {
      const delay = isThinking ? 600 : Math.random() * 2200 + 1600;

      lookTimeoutId = setTimeout(() => {
        if (isThinking) {
          // Rapid horizontal scanning when analyzing on-chain intent
          setGaze((prev) => ({
            x: prev.x <= 0 ? 4 : -4,
            y: 0,
          }));
        } else {
          targetIdx = (targetIdx + 1) % gazeTargets.length;
          setGaze(gazeTargets[targetIdx]);
        }
        scheduleLook();
      }, delay);
    };

    scheduleLook();
    return () => clearTimeout(lookTimeoutId);
  }, [isHovered, isThinking, interactive]);

  // -------------------------------------------------------------
  // 3. Mouse Tracking (Looks at user cursor when near)
  // -------------------------------------------------------------
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || isThinking) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    // Normalize to max +- 4.5px offset
    const maxOffset = 4.5;
    const distance = Math.hypot(dx, dy) || 1;
    const clampedDist = Math.min(distance, 120);
    const factor = (clampedDist / 120) * maxOffset;

    const targetX = (dx / distance) * factor;
    const targetY = (dy / distance) * factor;

    setGaze({ x: targetX, y: targetY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsHappy(true);
    setTimeout(() => setIsHappy(false), 900);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setGaze({ x: 0, y: 0 });
  };

  const sizeClass = SIZE_MAP[size] || size;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none shrink-0 group ${sizeClass} ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
      aria-label="MintPilot Living Agent"
    >
      {/* Ambient Breathing Aura */}
      {showAura && (
        <div
          className={`absolute -inset-1 rounded-2xl opacity-60 filter blur-md transition-all duration-700 pointer-events-none ${
            isThinking
              ? "bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 animate-pulse opacity-90 scale-110"
              : isHovered
              ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 opacity-80 scale-105"
              : "bg-gradient-to-r from-purple-600/40 to-indigo-600/40"
          }`}
        />
      )}

      {/* Main Living Agent SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10 drop-shadow-lg overflow-visible transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Helmet Exterior Gradient */}
          <linearGradient id="mpHelmetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e0c38" />
            <stop offset="50%" stopColor="#120524" />
            <stop offset="100%" stopColor="#080210" />
          </linearGradient>

          {/* Helmet Edge Lighting */}
          <linearGradient id="mpBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#7d33ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
          </linearGradient>

          {/* Visor Deep Screen Gradient */}
          <radialGradient id="mpVisorGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#16082e" />
            <stop offset="85%" stopColor="#06010d" />
            <stop offset="100%" stopColor="#020005" />
          </radialGradient>

          {/* Bioluminescent Eye Iris Glow */}
          <linearGradient id="mpEyeIris" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          {/* Active Scanner Laser Gradient */}
          <linearGradient id="mpScannerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>

          {/* Eye Glow Filter */}
          <filter id="mpEyeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Sleek Aerodynamic Cyber Helmet Base */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="26"
          ry="26"
          fill="url(#mpHelmetGrad)"
          stroke="url(#mpBorderGrad)"
          strokeWidth="2.5"
        />

        {/* Sub-surface circuit micro-lines on helmet */}
        <path
          d="M16 26 L26 16 M84 26 L74 16"
          stroke="#7d33ff"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* 2. Deep Obsidian Visor Faceplate */}
        <rect
          x="13"
          y="23"
          width="74"
          height="54"
          rx="18"
          ry="18"
          fill="url(#mpVisorGrad)"
          stroke="#7d33ff"
          strokeOpacity="0.3"
          strokeWidth="1.2"
        />

        {/* Curved Glass Reflection / Specular Highlight Sheen */}
        <path
          d="M18 28 Q50 38 82 28 Q50 32 18 28"
          fill="#ffffff"
          fillOpacity="0.12"
        />

        {/* Lateral Ear Nodes / Audio Sensor Status Pips */}
        <circle
          cx="9"
          cy="50"
          r="2.5"
          fill={isThinking ? "#38bdf8" : "#7d33ff"}
          className={isThinking ? "animate-ping" : ""}
        />
        <circle
          cx="91"
          cy="50"
          r="2.5"
          fill={isThinking ? "#38bdf8" : "#7d33ff"}
          className={isThinking ? "animate-ping" : ""}
        />

        {/* 3. Thinking / Intent Resolution Scanline */}
        {isThinking && (
          <g className="animate-pulse">
            <line
              x1="16"
              y1="50"
              x2="84"
              y2="50"
              stroke="url(#mpScannerGrad)"
              strokeWidth="2"
            />
          </g>
        )}

        {/* 4. Living Interactive Cyber Eyes */}
        <g
          filter="url(#mpEyeGlow)"
          style={{
            transform: `translate(${gaze.x}px, ${gaze.y}px)`,
            transition: isThinking
              ? "transform 0.18s ease-in-out"
              : isHovered
              ? "transform 0.08s ease-out"
              : "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {/* Left Eye */}
          <g
            style={{
              transformOrigin: "35px 50px",
              transform: isBlinking
                ? "scaleY(0.08)"
                : isHappy
                ? "scaleY(0.85) scaleX(1.15)"
                : "scaleY(1) scaleX(1)",
              transition: isBlinking
                ? "transform 0.06s ease-in"
                : "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {isHappy ? (
              // Cute Happy Arch Eye (^ shape)
              <path
                d="M27 52 Q35 42 43 52"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ) : (
              // Pill Eye with Specular Catchlights
              <>
                <rect
                  x="28"
                  y="41"
                  width="14"
                  height="18"
                  rx="7"
                  ry="7"
                  fill="url(#mpEyeIris)"
                />
                {/* Specular Catchlight Sparkles (Upper-Left Reflection) */}
                <circle cx="32" cy="45" r="2.8" fill="#ffffff" />
                <circle cx="37" cy="51" r="1.3" fill="#ffffff" fillOpacity="0.8" />
              </>
            )}
          </g>

          {/* Right Eye */}
          <g
            style={{
              transformOrigin: "65px 50px",
              transform: isBlinking
                ? "scaleY(0.08)"
                : isHappy
                ? "scaleY(0.85) scaleX(1.15)"
                : "scaleY(1) scaleX(1)",
              transition: isBlinking
                ? "transform 0.06s ease-in"
                : "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {isHappy ? (
              // Cute Happy Arch Eye (^ shape)
              <path
                d="M57 52 Q65 42 73 52"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ) : (
              // Pill Eye with Specular Catchlights
              <>
                <rect
                  x="58"
                  y="41"
                  width="14"
                  height="18"
                  rx="7"
                  ry="7"
                  fill="url(#mpEyeIris)"
                />
                {/* Specular Catchlight Sparkles (Upper-Left Reflection) */}
                <circle cx="62" cy="45" r="2.8" fill="#ffffff" />
                <circle cx="67" cy="51" r="1.3" fill="#ffffff" fillOpacity="0.8" />
              </>
            )}
          </g>
        </g>

        {/* 5. Sleek Mouth / Expression Bar */}
        <g
          style={{
            transform: `translate(${gaze.x * 0.4}px, ${gaze.y * 0.3}px)`,
            transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {isHappy ? (
            // Soft smile curve
            <path
              d="M44 65 Q50 69 56 65"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : isThinking ? (
            // Concentrating compact dot
            <rect
              x="47"
              y="65"
              width="6"
              height="2"
              rx="1"
              fill="#38bdf8"
              className="animate-pulse"
            />
          ) : (
            // Subtle neutral mouth slot
            <path
              d="M45 66 Q50 67 55 66"
              fill="none"
              stroke="#7d33ff"
              strokeOpacity="0.6"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* Forehead Pilot Crest Diamond (BNB Smart Chain Emblem Notch) */}
        <polygon
          points="50,11 54,16 50,21 46,16"
          fill={isThinking ? "#38bdf8" : "#f0b90b"}
          opacity={isThinking ? "1" : "0.85"}
          className="transition-colors duration-300"
        />
      </svg>
    </div>
  );
};
