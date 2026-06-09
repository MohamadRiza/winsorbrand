import CollectionsSection from "@/components/CollectionsSection/CollectionsSection";
import GiftSection from "@/components/GiftSection/GiftSection";
import Ourdetails from "@/components/OurDetails/Ourdetails";
import WatchbyGender from "@/components/WatchbyGender/WatchbyGender";
import WatchShowcase from "@/components/WatchShowcase/WatchShowcase";

// app/page.tsx
export default function Home() {
  return (
    <main>
      {/* Hero section with video background */}
      <section
        id="hero"
        className="relative h-screen w-full flex items-center justify-center overflow-hidden"
      >
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=2080&auto=format&fit=crop"
        >
          {/* Replace with your actual video file */}
          <source src="/longines.webm" type="video/webm" />
          {/* Fallback image if video doesn't load */}
          <img 
            src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=2080&auto=format&fit=crop" 
            alt="Winsor Luxury Watch" 
            className="w-full h-full object-cover"
          />
        </video>

        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

        {/* Content */}
        <div className="relative z-10 text-center px-4">
          {/* Collection Name */}
          <p
            className="text-white/70 tracking-[0.45em] text-[10px] md:text-xs mb-6 uppercase"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400 }}
          >
            THE MASTER COLLECTION
          </p>

          {/* Brand Name */}
          <h1
            className="text-white text-5xl md:text-7xl lg:text-6xl mb-6"
            style={{
              fontFamily:    "'Cormorant Garamond', serif",
              fontWeight:    300,
              letterSpacing: '0.15em',
              lineHeight:    1.1,
            }}
          >
            WINSOR
          </h1>

          {/* Tagline */}
          <p
            className="text-white/80 tracking-[0.25em] text-xs md:text-sm mb-12 max-w-md mx-auto"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300 }}
          >
            WHERE PRECISION MEETS ELEGANCE
          </p>

          {/* Underlined Links - Longines Style */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <a
              href="#collections"
              className="group relative inline-block"
            >
              <span
                className="text-white/90 tracking-[0.25em] text-[10px] md:text-xs uppercase transition-all duration-300 group-hover:text-white"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
              >
                DISCOVER MORE
              </span>
              <span
                className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-500 group-hover:w-full"
              />
            </a>

            <a
              href="#shop"
              className="group relative inline-block"
            >
              <span
                className="text-white/90 tracking-[0.25em] text-[10px] md:text-xs uppercase transition-all duration-300 group-hover:text-white"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
              >
                SHOP THE COLLECTION
              </span>
              <span
                className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-500 group-hover:w-full"
              />
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
          <p
            className="text-white/50 text-[9px] tracking-[0.35em] uppercase"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            Scroll
          </p>
          <div className="w-px h-16 bg-white/20 relative overflow-hidden rounded-full">
            <div
              className="absolute top-0 left-0 w-full bg-white/70"
              style={{
                height:    '35%',
                animation: 'scrollDrop 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        <style>{`
          @keyframes scrollDrop {
            0%   { transform: translateY(-150%); opacity: 0; }
            20%  { opacity: 1; }
            100% { transform: translateY(350%); opacity: 0; }
          }
        `}</style>
      </section>

      {/* Collections Section */}
      <CollectionsSection />

      {/* Gender Section */}
      <WatchbyGender />

      {/* Shop CTA Section */}
      <GiftSection/>

      {/* Additional sections can be added here */}
      <WatchShowcase />

      <Ourdetails />
      
    </main>
  );
}