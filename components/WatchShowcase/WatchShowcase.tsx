import Link from 'next/link';

const watchHero = "/Home1.webp";
const watchCard = "/watch-card.jpg";
const watchConquest = "/Winsor_Premium.webp";
const watchGmt = "/Sport_Watch.webp";

const WatchShowcase = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-28" style={{ background: '#faf7f0', color: '#1a1209' }}>
      {/* Heading */}
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-serif text-[28px] font-normal leading-tight tracking-tight sm:text-3xl md:text-[40px] md:leading-tight" style={{ color: '#1a1209' }}>
          HYDROCONQUEST Exclusive Edition
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:mt-6 md:text-base" style={{ color: '#555555' }}>
          A captivating edition, available in 39-mm and 42-mm, offered in distinctive variants that stand apart from the core collection while maintaining the sporty elegance and technical excellence that define it.
        </p>
      </div>

      {/* Hero block: product card + large lifestyle image */}
      <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-6 px-4 sm:mt-14 sm:gap-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-10">
        {/* Product card */}
        <article className="group flex flex-col cursor-pointer">
          <div className="relative overflow-hidden bg-white p-4 sm:p-5 rounded-2xl border border-[rgba(26,18,9,0.06)] flex flex-col justify-between h-full shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(26,18,9,0.06)] hover:border-[#8B6914]/40">
            <span className="absolute left-6 top-6 z-10 bg-[#1a1209] text-white px-3 py-1 text-[10px] tracking-widest uppercase font-medium">
              Exclusive
            </span>
            <video
              autoPlay
              loop
              muted
              playsInline
              className="aspect-[4/5] w-full object-cover rounded-xl transition-transform duration-700 hover:scale-[1.03]"
              src="/watch360rotate.webm"
            />
            <div className="mt-5 space-y-1">
              <h3 className="text-sm font-medium tracking-[0.08em] uppercase transition-colors duration-300 group-hover:text-[#8B6914]" style={{ color: '#1a1209' }}>
                HYDROCONQUEST EXCLUSIVE EDITION
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#666666' }}>
                42 mm - Automatic watch - Stainless steel and ceramic bezel
              </p>
            </div>
          </div>
        </article>

        {/* Large lifestyle video */}
        <div className="overflow-hidden rounded-2xl border border-[rgba(26,18,9,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="aspect-[4/3] h-full max-h-[720px] w-full object-cover transition-transform duration-700 hover:scale-[1.02] sm:aspect-auto"
            src="/watch_space_vid.webm"
          />
        </div>
      </div>

      {/* Two Horizontal Banners (Slim, Ultra-Luxury Img 2 Match) */}
      <div className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6 space-y-5 sm:space-y-6">
        
        {/* Banner 1: ABOUT WINSOR */}
        <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white border border-[rgba(26,18,9,0.08)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] grid grid-cols-[1.3fr_1fr] md:grid-cols-2 items-center md:h-[220px] lg:h-[240px]">
          {/* Left Text Content */}
          <div className="p-4 sm:p-7 lg:p-10 flex flex-col justify-center items-start text-left z-10 space-y-1.5 sm:space-y-2.5">
            <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-semibold text-[#8B6914] tracking-[0.22em] uppercase">
              ABOUT WINSOR
            </span>
            <h3 className="font-serif text-base sm:text-2xl lg:text-[28px] font-normal leading-[1.2] text-[#1a1209]">
              Crafting timeless elegance since day one.
            </h3>
            <p className="text-[10.5px] sm:text-xs lg:text-sm text-[#666666] leading-relaxed max-w-md hidden xs:block sm:block">
              Winsor is more than a watch. It's a legacy of precision, craftsmanship and timeless style.
            </p>
            <div className="pt-1 sm:pt-3">
              <Link
                href="/our-story"
                className="inline-block border border-[#8B6914] text-[#8B6914] hover:bg-[#8B6914] hover:text-white px-3.5 sm:px-5 py-1.5 sm:py-2 text-[9px] sm:text-[10px] lg:text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-300 rounded-sm"
              >
                DISCOVER OUR STORY
              </Link>
            </div>
          </div>

          {/* Right Image Container */}
          <div className="relative h-full w-full overflow-hidden min-h-[160px] sm:min-h-[220px]">
            <img
              src="/hmebnr1.webp"
              alt="Crafting timeless elegance"
              className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Smooth Left-to-Right gradient fade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.85) 15%, transparent 50%)',
              }}
            />
          </div>
        </div>

        {/* Banner 2: LIMITED EDITION */}
        <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white border border-[rgba(26,18,9,0.08)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] grid grid-cols-[1fr_1.4fr] md:grid-cols-2 items-center md:h-[220px] lg:h-[240px]">
          {/* Left Image Container */}
          <div className="relative h-full w-full overflow-hidden min-h-[160px] sm:min-h-[220px] order-1">
            <img
              src="/hmebnr2.webp"
              alt="Exclusivity Redefined"
              className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Smooth Right-to-Left gradient fade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to left, #ffffff 0%, rgba(255,255,255,0.85) 15%, transparent 50%)',
              }}
            />
          </div>

          {/* Right Text Content & Badge */}
          <div className="p-4 sm:p-7 lg:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6 text-left z-10 order-2">
            <div className="space-y-1.5 sm:space-y-2.5 max-w-xs sm:max-w-sm">
              <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-semibold text-[#8B6914] tracking-[0.22em] uppercase">
                LIMITED EDITION
              </span>
              <h3 className="font-serif text-base sm:text-2xl lg:text-[28px] font-normal leading-[1.2] text-[#1a1209]">
                Exclusivity Redefined
              </h3>
              <p className="text-[10.5px] sm:text-xs lg:text-sm text-[#666666] leading-relaxed hidden xs:block sm:block">
                Only 100 pieces worldwide. Own a masterpiece.
              </p>
              <div className="pt-1 sm:pt-3">
                <Link
                  href="/collections"
                  className="inline-block border border-[#8B6914] text-[#8B6914] hover:bg-[#8B6914] hover:text-white px-3.5 sm:px-5 py-1.5 sm:py-2 text-[9px] sm:text-[10px] lg:text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-300 rounded-sm"
                >
                  RESERVE YOURS
                </Link>
              </div>
            </div>

            {/* Badge Box (100 PIECES ONLY) */}
            <div className="self-start sm:self-center border border-[#8B6914]/40 bg-[#faf7f0]/70 px-3 py-2 sm:px-4 sm:py-3.5 rounded-md sm:rounded-lg text-center min-w-[80px] sm:min-w-[110px] flex-shrink-0">
              <span className="block font-serif text-lg sm:text-2xl lg:text-3xl font-bold text-[#8B6914] leading-none">
                100
              </span>
              <span className="block text-[7.5px] sm:text-[8.5px] lg:text-[9px] font-semibold text-[#8B6914] tracking-[0.16em] uppercase mt-1">
                PIECES ONLY
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WatchShowcase;

