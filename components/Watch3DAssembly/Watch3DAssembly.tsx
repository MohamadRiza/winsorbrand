'use client';

import { useState, useEffect, useRef } from 'react';

const IMAGES_COUNT = 300;

export default function Watch3DAssembly() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  
  const [loadedCount, setLoadedCount] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [activeCallout, setActiveCallout] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [assemblyPercent, setAssemblyPercent] = useState(0);
  
  const targetFrameRef = useRef(1);
  const currentFrameRef = useRef(1);

  // Preload all 300 WebP frames
  useEffect(() => {
    let loaded = 0;
    const imagesArray: HTMLImageElement[] = [];

    for (let i = 1; i <= IMAGES_COUNT; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/webp_frames/ezgif-frame-${frameNum}.webp`;
      
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === IMAGES_COUNT) {
          setImagesLoaded(true);
        }
      };
      
      img.onerror = () => {
        // Increment load count even on error to prevent blocking the interface
        loaded++;
        setLoadedCount(loaded);
        if (loaded === IMAGES_COUNT) {
          setImagesLoaded(true);
        }
      };
      
      imagesArray.push(img);
    }
    
    imagesRef.current = imagesArray;
  }, []);

  // Listen to scroll events to update target frame index
  useEffect(() => {
    if (!imagesLoaded) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = -rect.top;
      const scrollHeight = rect.height - window.innerHeight;
      
      let scrollPercent = scrollTop / scrollHeight;
      scrollPercent = Math.max(0, Math.min(1, scrollPercent));
      setProgress(scrollPercent);

      // Determine the target frame (1 to 300)
      const targetFrame = Math.floor(scrollPercent * (IMAGES_COUNT - 1)) + 1;
      targetFrameRef.current = targetFrame;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial run

    return () => window.removeEventListener('scroll', handleScroll);
  }, [imagesLoaded]);

  // Canvas drawing loop with frame LERP easing
  useEffect(() => {
    if (!imagesLoaded) return;

    let animationFrameId: number;
    let localFrame = 1;

    const drawCanvas = (frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imagesRef.current[frameIndex - 1];
      if (!img || !img.complete) return;

      // Get client size
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // High-DPI Retina scaling
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // Ambient background gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height) * 0.7
      );
      bgGrad.addColorStop(0, '#100a06'); // Warm deep chocolate core
      bgGrad.addColorStop(1, '#050302'); // Pure black edges
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw deconstructed components frame
      const iw = img.width;
      const ih = img.height;
      const r = Math.min(width / iw, height / ih);
      const nw = iw * r;
      const nh = ih * r;
      const cx = (width - nw) / 2;
      const cy = (height - nh) / 2;
      ctx.drawImage(img, cx, cy, nw, nh);
    };

    const updateFrame = () => {
      const target = targetFrameRef.current;
      // Easing LERP equation
      localFrame += (target - localFrame) * 0.12;

      if (Math.abs(target - localFrame) < 0.05) {
        localFrame = target;
      }

      currentFrameRef.current = localFrame;
      const roundedFrame = Math.round(localFrame);

      // Draw current frame
      drawCanvas(roundedFrame);

      // Update assembly progress percentage (assume watch fully assembled at frame 180)
      const percent = Math.min(100, Math.round((roundedFrame / 180) * 100));
      setAssemblyPercent(percent);

      // Dynamic callout trigger values based on active frame ranges
      if (roundedFrame >= 15 && roundedFrame <= 65) {
        setActiveCallout('glass');
      } else if (roundedFrame >= 66 && roundedFrame <= 110) {
        setActiveCallout('bezel');
      } else if (roundedFrame >= 111 && roundedFrame <= 155) {
        setActiveCallout('dial');
      } else if (roundedFrame >= 156 && roundedFrame <= 200) {
        setActiveCallout('movement');
      } else if (roundedFrame >= 201 && roundedFrame <= 260) {
        setActiveCallout('caseback');
      } else {
        setActiveCallout(null);
      }

      animationFrameId = requestAnimationFrame(updateFrame);
    };

    animationFrameId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [imagesLoaded]);

  // Loading Sequence Diagnostic Screen
  if (!imagesLoaded) {
    return (
      <div className="w-full h-screen bg-[#050302] flex flex-col items-center justify-center text-[#dfb15b] relative overflow-hidden select-none">
        {/* Pulsing glow background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,105,20,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* Tactical scanlines overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_95%,rgba(139,105,20,0.03)_95%)] bg-[length:100%_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
          {/* Animated Tech Diagnostics Ring */}
          <div className="mb-10 relative flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-[#8B6914]/20 flex items-center justify-center animate-[pulse_2s_infinite]">
              <svg className="w-8 h-8 text-[#dfb15b]/80" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            {/* Spinning technical rings */}
            <div className="absolute inset-0 w-24 h-24 rounded-full border-t-2 border-r border-[#dfb15b] animate-[spin_2.5s_linear_infinite]" />
            <div className="absolute inset-2 w-20 h-20 rounded-full border-b border-[#dfb15b]/30 animate-[spin_4s_linear_infinite_reverse]" />
          </div>

          <h2 className="text-xl tracking-[0.25em] font-light uppercase text-white mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Winsor 3D Engine
          </h2>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#dfb15b]/50 mb-8" style={{ fontFamily: "'Jost', sans-serif" }}>
            Calibrating Assembly Coordinates
          </p>

          {/* Luxury loading bar */}
          <div className="w-64 h-[2px] bg-[#8B6914]/10 border border-[#8B6914]/20 rounded-full overflow-hidden mb-3 relative">
            <div 
              className="h-full bg-gradient-to-r from-[#8B6914] to-[#dfb15b] transition-all duration-100 ease-out"
              style={{ width: `${Math.round((loadedCount / IMAGES_COUNT) * 100)}%` }}
            />
          </div>

          {/* System status details */}
          <div className="flex justify-between w-64 text-[8px] tracking-[0.15em] uppercase text-[#dfb15b]/70 font-mono">
            <span>RAM CHECK: 300 FRAME BUFFER</span>
            <span>{Math.round((loadedCount / IMAGES_COUNT) * 100)}%</span>
          </div>

          <div className="mt-8 pt-4 border-t border-[#8B6914]/10 w-full text-[8px] text-[#dfb15b]/30 tracking-widest uppercase font-mono">
            ASSEMBLY CALIBER: W-300 / SECURE ACCESS GRANTED
          </div>
        </div>
      </div>
    );
  }

  // Interactive 3D Scroll Assembly Container
  return (
    <div 
      ref={containerRef} 
      className="relative w-full bg-[#050302] border-b border-[#8B6914]/20" 
      style={{ height: '350vh' }}
    >
      {/* Sticky Canvas Box */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center bg-[#050302]">
        
        {/* Full-screen webp animation canvas */}
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-contain"
          style={{ maxHeight: '100vh', maxWidth: '100vw' }}
        />

        {/* Ambient shadow gradient */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_20%,rgba(5,3,2,0.9)_90%)]" />

        {/* FUTURISTIC SCIFI HUD OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 md:p-12 font-sans select-none">
          
          {/* Header Row: Technical Specs & Calibration status */}
          <div className="flex justify-between items-start w-full">
            
            {/* Left Box: Caliber Information */}
            <div className="flex flex-col gap-1 border-l border-[#8B6914] pl-3 text-[#dfb15b]/80">
              <span className="text-[9px] tracking-[0.25em] font-medium uppercase font-mono text-emerald-500">ENGINE STATE // RUNNING</span>
              <h3 className="text-sm font-light tracking-[0.1em] text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                WINSOR CHRONOGRAPH / EXPLODED CORE
              </h3>
              <span className="text-[8px] tracking-[0.15em] uppercase text-[#dfb15b]/45 font-mono">
                REF: W-300 / 37 JEWELS / 72H RESERVED
              </span>
            </div>

            {/* Right Box: Assembly progress readout */}
            <div className="flex flex-col items-end gap-1 text-right text-[#dfb15b]/80 font-mono text-[9px]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="tracking-[0.2em] uppercase">SYSTEM NOMINAL</span>
              </div>
              <span className="tracking-[0.15em] text-white">
                ASSEMBLY PROGRESS: {assemblyPercent}%
              </span>
              {/* Dynamic progress bar in HUD */}
              <div className="w-28 h-[2px] bg-[#8B6914]/15 border border-[#8B6914]/30 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-gradient-to-r from-[#8B6914] to-[#dfb15b] transition-all duration-300"
                  style={{ width: `${assemblyPercent}%` }}
                />
              </div>
            </div>

          </div>

          {/* Tactical HUD Interactive Callouts (Desktop-only responsive layout) */}
          <div className="absolute inset-0 hidden md:block w-full h-full pointer-events-none">
            {/* SVG Connector Lines */}
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
              {activeCallout === 'glass' && (
                <g>
                  {/* Connects glass on left */}
                  <path 
                    d="M 13 28 L 22 28 L 26 50" 
                    fill="none" 
                    stroke="#dfb15b" 
                    strokeWidth="0.1" 
                    className="hud-line"
                  />
                  <circle cx="26" cy="50" r="0.6" fill="#dfb15b" className="animate-ping" />
                  <circle cx="26" cy="50" r="0.3" fill="#dfb15b" />
                </g>
              )}
              {activeCallout === 'bezel' && (
                <g>
                  {/* Connects bezel on mid-left */}
                  <path 
                    d="M 23 72 L 31 72 L 33 50" 
                    fill="none" 
                    stroke="#dfb15b" 
                    strokeWidth="0.1" 
                    className="hud-line"
                  />
                  <circle cx="33" cy="50" r="0.6" fill="#dfb15b" className="animate-ping" />
                  <circle cx="33" cy="50" r="0.3" fill="#dfb15b" />
                </g>
              )}
              {activeCallout === 'dial' && (
                <g>
                  {/* Connects dial in center */}
                  <path 
                    d="M 48 22 L 48 40" 
                    fill="none" 
                    stroke="#dfb15b" 
                    strokeWidth="0.1" 
                    className="hud-line"
                  />
                  <circle cx="48" cy="40" r="0.6" fill="#dfb15b" className="animate-ping" />
                  <circle cx="48" cy="40" r="0.3" fill="#dfb15b" />
                </g>
              )}
              {activeCallout === 'movement' && (
                <g>
                  {/* Connects movement on mid-right */}
                  <path 
                    d="M 72 72 L 65 72 L 62 50" 
                    fill="none" 
                    stroke="#dfb15b" 
                    strokeWidth="0.1" 
                    className="hud-line"
                  />
                  <circle cx="62" cy="50" r="0.6" fill="#dfb15b" className="animate-ping" />
                  <circle cx="62" cy="50" r="0.3" fill="#dfb15b" />
                </g>
              )}
              {activeCallout === 'caseback' && (
                <g>
                  {/* Connects case back on right */}
                  <path 
                    d="M 83 28 L 78 28 L 76 50" 
                    fill="none" 
                    stroke="#dfb15b" 
                    strokeWidth="0.1" 
                    className="hud-line"
                  />
                  <circle cx="76" cy="50" r="0.6" fill="#dfb15b" className="animate-ping" />
                  <circle cx="76" cy="50" r="0.3" fill="#dfb15b" />
                </g>
              )}
            </svg>

            {/* Futuristic text boxes aligned to the SVG connector points */}
            {activeCallout === 'glass' && (
              <div className="absolute left-[7%] top-[20%] max-w-[210px] border border-[#dfb15b]/20 bg-black/75 backdrop-blur-md p-4 rounded animate-[fadeIn_0.35s_ease-out_forwards] text-left">
                <span className="text-[7px] text-[#dfb15b]/50 tracking-[0.25em] block uppercase font-mono mb-1">DECONSTRUCTED UNIT 01</span>
                <h4 className="text-[11px] tracking-[0.15em] font-medium text-white uppercase mb-1.5" style={{ fontFamily: "'Jost', sans-serif" }}>Sapphire Glass</h4>
                <p className="text-[9px] text-[#dfb15b]/70 font-light leading-relaxed">
                  Double anti-reflective coated curved sapphire crystal. Near diamond hardness.
                </p>
              </div>
            )}
            {activeCallout === 'bezel' && (
              <div className="absolute left-[14%] bottom-[20%] max-w-[210px] border border-[#dfb15b]/20 bg-black/75 backdrop-blur-md p-4 rounded animate-[fadeIn_0.35s_ease-out_forwards] text-left">
                <span className="text-[7px] text-[#dfb15b]/50 tracking-[0.25em] block uppercase font-mono mb-1">DECONSTRUCTED UNIT 02</span>
                <h4 className="text-[11px] tracking-[0.15em] font-medium text-white uppercase mb-1.5" style={{ fontFamily: "'Jost', sans-serif" }}>Ceramic Bezel</h4>
                <p className="text-[9px] text-[#dfb15b]/70 font-light leading-relaxed">
                  Unidirectional high-gloss ceramic outer ring with 60-minute time-lapse scale.
                </p>
              </div>
            )}
            {activeCallout === 'dial' && (
              <div className="absolute left-[38%] top-[12%] max-w-[210px] border border-[#dfb15b]/20 bg-black/75 backdrop-blur-md p-4 rounded animate-[fadeIn_0.35s_ease-out_forwards] text-center">
                <span className="text-[7px] text-[#dfb15b]/50 tracking-[0.25em] block uppercase font-mono mb-1">DECONSTRUCTED UNIT 03</span>
                <h4 className="text-[11px] tracking-[0.15em] font-medium text-white uppercase mb-1.5" style={{ fontFamily: "'Jost', sans-serif" }}>Chronograph Dial</h4>
                <p className="text-[9px] text-[#dfb15b]/70 font-light leading-relaxed">
                  Sunray blue dial plate displaying gold index markers and dual sub-registers.
                </p>
              </div>
            )}
            {activeCallout === 'movement' && (
              <div className="absolute right-[16%] bottom-[20%] max-w-[210px] border border-[#dfb15b]/20 bg-black/75 backdrop-blur-md p-4 rounded animate-[fadeIn_0.35s_ease-out_forwards] text-left">
                <span className="text-[7px] text-[#dfb15b]/50 tracking-[0.25em] block uppercase font-mono mb-1">DECONSTRUCTED UNIT 04</span>
                <h4 className="text-[11px] tracking-[0.15em] font-medium text-white uppercase mb-1.5" style={{ fontFamily: "'Jost', sans-serif" }}>Caliber Core</h4>
                <p className="text-[9px] text-[#dfb15b]/70 font-light leading-relaxed">
                  Winsor automatic caliber chronometer featuring high-frequency power reserve.
                </p>
              </div>
            )}
            {activeCallout === 'caseback' && (
              <div className="absolute right-[9%] top-[20%] max-w-[210px] border border-[#dfb15b]/20 bg-black/75 backdrop-blur-md p-4 rounded animate-[fadeIn_0.35s_ease-out_forwards] text-left">
                <span className="text-[7px] text-[#dfb15b]/50 tracking-[0.25em] block uppercase font-mono mb-1">DECONSTRUCTED UNIT 05</span>
                <h4 className="text-[11px] tracking-[0.15em] font-medium text-white uppercase mb-1.5" style={{ fontFamily: "'Jost', sans-serif" }}>Steel Case Back</h4>
                <p className="text-[9px] text-[#dfb15b]/70 font-light leading-relaxed">
                  316L solid surgical steel housing. Engraved crest and 300m waterproofing seals.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Row: HUD scrolling coordinate readouts and helpers */}
          <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mt-auto">
            
            {/* Scroll location tracker */}
            <div className="text-[8px] tracking-[0.18em] text-[#dfb15b]/40 font-mono text-center md:text-left leading-normal">
              MATRIX TRK: {(progress * 100).toFixed(2)}% / CACHE: FRAME_{String(Math.round(currentFrameRef.current)).padStart(3, '0')}
              <br />
              WINSOR MAISON ENGINE / DIGITAL DIAGNOSTIC HUD / VER 1.6
            </div>

            {/* Mobile-Friendly Callout Popup (renders at bottom center of viewport) */}
            {activeCallout && (
              <div className="md:hidden w-full max-w-xs border border-[#dfb15b]/25 bg-black/85 backdrop-blur-md p-3.5 rounded text-center animate-[fadeIn_0.3s_ease-out_forwards]">
                <h4 className="text-[11px] tracking-[0.2em] font-medium text-white uppercase mb-1">
                  {activeCallout === 'glass' && 'Sapphire Glass'}
                  {activeCallout === 'bezel' && 'Ceramic Bezel'}
                  {activeCallout === 'dial' && 'Chronograph Dial'}
                  {activeCallout === 'movement' && 'Caliber Core'}
                  {activeCallout === 'caseback' && 'Steel Case Back'}
                </h4>
                <p className="text-[9px] text-[#dfb15b]/85 font-light leading-relaxed">
                  {activeCallout === 'glass' && 'Anti-reflective curved sapphire glass. Near diamond hardness.'}
                  {activeCallout === 'bezel' && 'Unidirectional ceramic bezel with 60-minute time-lapse scale.'}
                  {activeCallout === 'dial' && 'Sunray blue dial plate displaying gold sub-registers.'}
                  {activeCallout === 'movement' && 'Winsor automatic caliber core featuring high-frequency gears.'}
                  {activeCallout === 'caseback' && '316L solid surgical steel casing. 300m water resistant.'}
                </p>
              </div>
            )}

            {/* Scroll navigation guide */}
            <div className="flex flex-col items-center md:items-end gap-1 font-mono text-[9px] text-[#dfb15b]/70">
              <span className="tracking-[0.15em] text-white font-sans uppercase">
                {currentFrameRef.current < 180 ? 'ASSEMBLING SYSTEM...' : 'NOMINAL ASSEMBLY / PREVIEW'}
              </span>
              <span className="text-[8px] tracking-[0.1em] text-[#dfb15b]/40 uppercase animate-pulse">
                Scroll down to rotate and zoom dial
              </span>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        @keyframes drawPath {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .hud-line {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawPath 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
}
