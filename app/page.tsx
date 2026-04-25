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
      <section id="collections" className="min-h-screen bg-[#faf7f0] py-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <p
              className="text-[#8B6914] tracking-[0.35em] text-[10px] mb-4 uppercase"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
            >
              OUR COLLECTIONS
            </p>
            <h2
              className="text-[#1a1209] text-4xl md:text-5xl"
              style={{
                fontFamily:    "'Cormorant Garamond', serif",
                fontWeight:    400,
                letterSpacing: '0.08em',
              }}
            >
              TIMELESS ELEGANCE
            </h2>
            <div
              className="w-16 h-px bg-[#8B6914] mx-auto mt-6"
            />
          </div>

          {/* Collection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['Classic', 'Sport', 'Heritage'].map((collection, index) => (
              <div
                key={collection}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ebe0] mb-6">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(https://images.unsplash.com/photo-${
                        index === 0 ? '1524592081133-5e2b21c15676' :
                        index === 1 ? '1619161113016-85f94f90a3dc' :
                        '1612686549202-fe9504cbb644'
                      }?q=80&w=1000&auto=format&fit=crop)`,
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                </div>
                <h3
                  className="text-[#1a1209] text-xl tracking-[0.2em] text-center uppercase"
                  style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
                >
                  {collection}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Heritage Section */}
      <section className="py-32 bg-[#1a1209] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
            }}
          />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <p
            className="text-[#8B6914] tracking-[0.35em] text-[10px] mb-6 uppercase"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
          >
            EST. 1987
          </p>
          <h2
            className="text-white text-3xl md:text-5xl mb-8 leading-tight"
            style={{
              fontFamily:    "'Cormorant Garamond', serif",
              fontWeight:    300,
              letterSpacing: '0.05em',
              lineHeight:    1.3,
            }}
          >
            "Crafting exceptional timepieces for those who appreciate the finer moments in life"
          </h2>
          <div
            className="w-24 h-px bg-[#8B6914] mx-auto"
          />
        </div>
      </section>

      {/* Shop CTA Section */}
      <section id="shop" className="min-h-screen bg-[#faf7f0] flex items-center">
        <div className="max-w-7xl mx-auto px-4 py-24 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p
                className="text-[#8B6914] tracking-[0.35em] text-[10px] mb-4 uppercase"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
              >
                NEW ARRIVALS
              </p>
              <h2
                className="text-[#1a1209] text-4xl md:text-5xl mb-6"
                style={{
                  fontFamily:    "'Cormorant Garamond', serif",
                  fontWeight:    400,
                  letterSpacing: '0.05em',
                }}
              >
                DISCOVER EXCELLENCE
              </h2>
              <p
                className="text-[#1a1209]/60 tracking-wide text-sm leading-relaxed mb-10 max-w-md"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                Explore our latest collection of luxury timepieces, where Swiss precision meets 
                contemporary design. Each watch is a testament to centuries of horological expertise.
              </p>
              
              <a
                href="/collections"
                className="group inline-block relative"
              >
                <span
                  className="text-[#1a1209] tracking-[0.25em] text-xs uppercase transition-all duration-300 group-hover:text-[#8B6914]"
                  style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
                >
                  EXPLORE COLLECTIONS
                </span>
                <span
                  className="absolute -bottom-1 left-0 w-0 h-px bg-[#8B6914] transition-all duration-500 group-hover:w-full"
                />
              </a>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-[#f0ebe0] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1000&auto=format&fit=crop"
                  alt="Winsor Flagship Watch"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}