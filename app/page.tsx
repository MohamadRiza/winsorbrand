// app/page.tsx
export default function Home() {
  return (
    <main>
      {/* Hero section — navbar reads this id to know when to be transparent */}
      <section
        id="hero"
        className="relative h-screen w-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a1209 0%, #2d1f0a 50%, #1a1209 100%)' }}
      >
        <div className="text-center">
          <p
            className="text-white/50 tracking-[0.4em] text-xs mb-4"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            LUXURY TIMEPIECES
          </p>
          <h1
            className="text-white text-6xl md:text-8xl"
            style={{
              fontFamily:    "'Cormorant Garamond', serif",
              fontWeight:    300,
              letterSpacing: '0.1em',
            }}
          >
            WINSOR
          </h1>
          <p
            className="text-white/40 tracking-[0.3em] text-xs mt-4"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            SINCE 1987
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <p className="text-white/40 text-[10px] tracking-[0.3em]" style={{ fontFamily: "'Jost', sans-serif" }}>
            SCROLL
          </p>
          <div className="w-px h-12 bg-white/20 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-full bg-white/60"
              style={{
                height:    '40%',
                animation: 'scrollDrop 1.8s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        <style>{`
          @keyframes scrollDrop {
            0%   { transform: translateY(-100%); opacity: 0; }
            30%  { opacity: 1; }
            100% { transform: translateY(300%); opacity: 0; }
          }
        `}</style>
      </section>

      {/* Content below hero — so you can scroll and test navbar behaviour */}
      <section className="min-h-screen bg-[#faf7f0] flex items-center justify-center">
        <p
          className="text-[#1a1209]/30 tracking-[0.3em] text-sm"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          COLLECTIONS COMING SOON
        </p>
      </section>
    </main>
  );
}