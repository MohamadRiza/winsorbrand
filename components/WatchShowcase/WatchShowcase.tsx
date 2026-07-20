const watchHero = "/Home1.webp";
const watchCard = "/watch-card.jpg";
const watchConquest = "/Winsor_Premium.webp";
const watchGmt = "/Sport_Watch.webp";

const WatchShowcase = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-28" style={{ background: '#ffffff', color: '#1a1209' }}>
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

      {/* Three collection tiles */}
      <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-6 px-4 sm:mt-12 sm:px-6 md:grid-cols-3 md:gap-8 mobile-stack-container">
        {/* Conquest */}
        <a href="#" className="group relative block aspect-[16/10] sm:aspect-[4/5] overflow-hidden rounded-2xl border border-[rgba(26,18,9,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.02)] mobile-stack-card mobile-stack-card-1">
          <img
            src={watchConquest}
            alt="Conquest collection"
            loading="lazy"
            width={1024}
            height={1280}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          {/* Black gradient overlay from below to up */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
              zIndex: 1,
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-8 text-center sm:pb-12" style={{ zIndex: 2 }}>
            <h3 className="font-serif text-2xl tracking-wide text-white sm:text-3xl lg:text-4xl transition-colors duration-300 group-hover:text-[#dfb15b]">
              PREMIUM
            </h3>
            <span className="mt-3 border-b border-white/50 pb-1 text-xs text-white transition-all duration-300 group-hover:text-[#dfb15b] group-hover:border-[#dfb15b] sm:mt-4 sm:text-sm">
              Discover
            </span>
          </div>
        </a>

        {/* Hydroconquest GMT */}
        <a href="#" className="group relative block aspect-[16/10] sm:aspect-[4/5] overflow-hidden rounded-2xl border border-[rgba(26,18,9,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-black mobile-stack-card mobile-stack-card-2">
          <img
            src={watchGmt}
            alt="Hydroconquest GMT collection"
            loading="lazy"
            width={1024}
            height={1280}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          {/* Black gradient overlay from below to up */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
              zIndex: 1,
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-8 text-center sm:pb-12" style={{ zIndex: 2 }}>
            <h3 className="font-serif text-2xl tracking-wide text-white sm:text-3xl lg:text-4xl transition-colors duration-300 group-hover:text-[#dfb15b]">
              SPORTS
            </h3>
            <span className="mt-3 border-b border-white/50 pb-1 text-xs text-white transition-all duration-300 group-hover:text-[#dfb15b] group-hover:border-[#dfb15b] sm:mt-4 sm:text-sm">
              Discover
            </span>
          </div>
        </a>

        {/* Limited Edition */}
        <a href="#" className="group relative block aspect-[16/10] sm:aspect-[4/5] overflow-hidden rounded-2xl border border-[rgba(26,18,9,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-black mobile-stack-card mobile-stack-card-3">
          <img
            src={watchHero}
            alt="Limited Edition collection"
            loading="lazy"
            width={1024}
            height={1280}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          {/* Black gradient overlay from below to up */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
              zIndex: 1,
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-8 text-center sm:pb-12" style={{ zIndex: 2 }}>
            <h3 className="font-serif text-2xl tracking-wide text-white sm:text-3xl lg:text-4xl transition-colors duration-300 group-hover:text-[#dfb15b]">
              LIMITED EDITION
            </h3>
            <span className="mt-3 border-b border-white/50 pb-1 text-xs text-white transition-all duration-300 group-hover:text-[#dfb15b] group-hover:border-[#dfb15b] sm:mt-4 sm:text-sm">
              Discover
            </span>
          </div>
        </a>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .mobile-stack-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 24px !important;
            padding-bottom: 40px;
          }
          .mobile-stack-card {
            position: sticky !important;
            top: 90px; /* Aligns neatly below mobile sticky header */
            box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
          }
          .mobile-stack-card-1 {
            z-index: 1;
          }
          .mobile-stack-card-2 {
            z-index: 2;
          }
          .mobile-stack-card-3 {
            z-index: 3;
          }
        }
      `}</style>
    </section>
  );
};

export default WatchShowcase;
