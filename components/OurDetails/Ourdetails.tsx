const items = [
  {
    title: "FIND A STORE",
    image: "/discover-store.jpg",
    alt: "Find a store",
    href: "#",
  },
  {
    title: "CUSTOMER SERVICE",
    image: "/discover-service.jpg",
    alt: "Customer service",
    href: "#",
  },
  {
    title: "OUR RETAIL PARTNERS",
    image: "/discover-partners.jpg",
    alt: "Our retail partners",
    href: "#",
  },
];

const Card = ({ item }: { item: (typeof items)[number] }) => (
  <a 
    href={item.href} 
    className="group flex flex-col bg-white rounded-2xl border border-[rgba(26,18,9,0.06)] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_16px_36px_rgba(26,18,9,0.06)] hover:border-[#8B6914]/40 hover:-translate-y-1.5"
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
        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
      />
      {/* Soft overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1209]/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
    </div>

    {/* Text Details Section */}
    <div className="p-6 flex flex-col items-center text-center bg-white">
      <h3 className="font-serif text-sm sm:text-base tracking-[0.15em] uppercase transition-colors duration-300 group-hover:text-[#8B6914] font-medium" style={{ color: '#1a1209', margin: 0 }}>
        {item.title}
      </h3>
      <div className="mt-3 w-6 h-px bg-[#8B6914]/25 transition-all duration-500 group-hover:w-16 group-hover:bg-[#8B6914]" />
      <span className="mt-4 inline-flex items-center gap-1 text-[11px] tracking-[0.2em] uppercase font-medium text-[#1a1209]/60 transition-all duration-300 group-hover:text-[#8B6914]">
        Discover <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </span>
    </div>
  </a>
);

const Ourdetaills = () => {
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
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-6 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <div key={item.title} className="w-[80%] flex-shrink-0 snap-center">
              <Card item={item} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          {items.map((item, idx) => (
            <span
              key={item.title}
              className="h-[2px] w-8"
              style={{ background: idx === 0 ? '#8B6914' : 'rgba(26, 18, 9, 0.15)' }}
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
