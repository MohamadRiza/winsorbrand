'use client';

import { useState, useRef } from 'react';

const items = [
  {
    title: "FIND A STORE",
    description: "Locate our exclusive boutiques globally and explore our collections in person.",
    image: "/KCC.webp",
    alt: "Find a store",
    href: "/retailers",
  },
  {
    title: "CUSTOMER SERVICE",
    description: "Access direct care, repair services, and specialist advice for your timepiece.",
    image: "/customer_service.webp",
    alt: "Customer service",
    href: "/customer-care",
  },
  {
    title: "OUR RETAIL PARTNERS",
    description: "Connect with authorized Winsor retailers to discover authentic horology.",
    image: "/r_partners.webp",
    alt: "Our retail partners",
    href: "/retailers",
  },
];

const Card = ({ item }: { item: (typeof items)[number] }) => (
  <a
    href={item.href}
    className="group relative block w-full aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden shadow-lg transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 border border-black/10 hover:border-[#8B6914]/50"
    style={{ textDecoration: 'none' }}
  >
    {/* Full Cover Background Image */}
    <img
      src={item.image}
      alt={item.alt}
      loading="lazy"
      width={1024}
      height={1280}
      className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.07]"
    />

    {/* Luxury Dark Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0805]/95 via-[#0a0805]/50 to-transparent opacity-90 transition-opacity duration-700 group-hover:opacity-95" />

    {/* Top Right Luxury Brand Badge */}
    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full pointer-events-none transition-all duration-500 group-hover:border-[#8B6914]/60 group-hover:bg-[#8B6914]/20">
      <span className="text-[9px] tracking-[0.2em] text-white/90 font-medium uppercase font-['Jost']">WINSOR</span>
    </div>

    {/* On-Image Text Overlay Content */}
    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 flex flex-col justify-end text-left z-10 transition-transform duration-500 group-hover:translate-y-[-4px]">
      {/* Title */}
      <h3 
        className="font-serif text-lg sm:text-xl md:text-2xl font-medium uppercase tracking-[0.12em] text-white transition-colors duration-300 group-hover:text-[#dfb15b]"
        style={{ margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        {item.title}
      </h3>

      {/* Gold Divider Line */}
      <div className="my-3 w-8 h-[1.5px] bg-[#8B6914] transition-all duration-500 group-hover:w-16 group-hover:bg-[#dfb15b]" />

      {/* Description */}
      <p className="text-white/80 text-xs sm:text-sm font-light tracking-wide leading-relaxed font-['Jost'] max-w-[95%] mb-5">
        {item.description}
      </p>

      {/* Action Link CTA */}
      <div className="inline-flex items-center gap-2 text-xs tracking-[0.22em] uppercase font-semibold text-[#dfb15b] transition-all duration-300 group-hover:text-white font-['Jost']">
        <span>DISCOVER</span>
        <span className="transition-transform duration-300 group-hover:translate-x-2">→</span>
      </div>
    </div>
  </a>
);

const Ourdetaills = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRaf = useRef<number | null>(null);

  const handleScroll = () => {
    if (scrollRaf.current) return;
    scrollRaf.current = window.requestAnimationFrame(() => {
      scrollRaf.current = null;
      if (!scrollRef.current) return;
      const width = scrollRef.current.clientWidth;
      const scrollLeft = scrollRef.current.scrollLeft;
      const index = Math.min(items.length - 1, Math.max(0, Math.round(scrollLeft / width)));
      setActiveIndex(prev => (prev !== index ? index : prev));
    });
  };

  return (
    <section className="py-16 sm:py-20 lg:py-28" style={{ background: '#faf7f0', color: '#1a1209' }}>
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
            <div key={item.title} className="w-[85%] flex-shrink-0 snap-center">
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

