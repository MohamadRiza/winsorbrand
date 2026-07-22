'use client';

import { useState, useRef } from 'react';

const items = [
  {
    title: "FIND A STORE",
    description: "Locate our exclusive boutiques globally and explore our collections in person.",
    image: "/KCC.webp",
    alt: "Find a store",
    href: "#",
  },
  {
    title: "CUSTOMER SERVICE",
    description: "Access direct care, repair services, and specialist advice for your timepiece.",
    image: "/customer_service.webp",
    alt: "Customer service",
    href: "#",
  },
  {
    title: "OUR RETAIL PARTNERS",
    description: "Connect with authorized Winsor retailers to discover authentic horology.",
    image: "/r_partners.webp",
    alt: "Our retail partners",
    href: "#",
  },
];

const Card = ({ item }: { item: (typeof items)[number] }) => (
  <a
    href={item.href}
    className="group flex flex-col bg-white rounded-xl border border-[rgba(26,18,9,0.06)] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-700 hover:shadow-[0_20px_40px_rgba(139,105,20,0.08)] hover:border-[#8B6914]/30 hover:-translate-y-2"
    style={{ textDecoration: 'none' }}
  >
    {/* Image Container with Zoom effect */}
    <div className="w-full overflow-hidden relative aspect-[4/5]">
      <img
        src={item.image}
        alt={item.alt}
        loading="lazy"
        width={1024}
        height={1280}
        className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
      />
      {/* Premium warm gold overlay on hover */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,105,20,0.08)_0%,rgba(26,18,9,0.25)_100%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100 pointer-events-none" />

      {/* Tiny top-right category label */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md border border-[#8B6914]/20 px-3 py-1 rounded-full pointer-events-none opacity-0 transform translate-y-[-10px] transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
        <span className="text-[9px] tracking-[0.15em] text-[#8B6914] font-medium uppercase">Winsor</span>
      </div>
    </div>

    {/* Text Details Section */}
    <div className="p-7 flex flex-col items-center text-center bg-white flex-grow justify-between">
      <div className="flex flex-col items-center">
        <h3 className="font-serif text-base sm:text-lg tracking-[0.12em] uppercase transition-colors duration-300 group-hover:text-[#8B6914] font-medium" style={{ color: '#1a1209', margin: 0 }}>
          {item.title}
        </h3>
        <div className="mt-3.5 w-6 h-[1.5px] bg-[#8B6914]/20 transition-all duration-500 group-hover:w-16 group-hover:bg-[#8B6914]" />

        <p className="text-[#666666] text-xs font-light tracking-[0.03em] leading-relaxed mt-4 max-w-[260px] min-h-[40px]">
          {item.description}
        </p>
      </div>

      <span className="mt-5 inline-flex items-center gap-1.5 text-[10.5px] tracking-[0.2em] uppercase font-semibold text-[#8B6914] transition-all duration-300 group-hover:text-[#1a1209]">
        Discover <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
      </span>
    </div>
  </a>
);

const Ourdetaills = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth;
    const scrollLeft = scrollRef.current.scrollLeft;
    const index = Math.min(items.length - 1, Math.max(0, Math.round(scrollLeft / width)));
    setActiveIndex(index);
  };

  return (
    <section className="py-16 sm:py-20 lg:py-28 select-none" style={{ background: '#faf7f0', color: '#1a1209' }}>
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <span className="text-[9px] tracking-[0.35em] text-[#8B6914] uppercase font-semibold mb-3 block">
          THE WINSOR EXPERIENCE
        </span>
        <h2 className="font-serif text-[26px] font-normal leading-tight tracking-tight sm:text-3xl md:text-[40px] uppercase" style={{ color: '#1a1209', letterSpacing: '0.04em', margin: 0 }}>
          Discover the World of WINSOR
        </h2>
        <div className="mx-auto mt-4 w-12 h-[1px] bg-[#8B6914]/40" />
      </div>

      {/* Mobile: horizontal swipe carousel */}
      <div className="mt-10 md:hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-6 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <div key={item.title} className="w-[82%] flex-shrink-0 snap-center">
              <Card item={item} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          {items.map((item, idx) => (
            <span
              key={item.title}
              className="h-[2px] transition-all duration-300"
              style={{
                width: idx === activeIndex ? '32px' : '16px',
                background: idx === activeIndex ? '#8B6914' : 'rgba(26, 18, 9, 0.15)'
              }}
              aria-hidden
            />
          ))}
        </div>
      </div>

      {/* Desktop: 3-column grid */}
      <div className="mx-auto mt-14 hidden max-w-7xl px-4 sm:px-6 md:grid md:grid-cols-3 md:gap-6 lg:gap-8">
        {items.map((item) => (
          <Card key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
};

export default Ourdetaills;

