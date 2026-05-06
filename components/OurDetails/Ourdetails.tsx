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
  <a href={item.href} className="group flex flex-col items-center text-center">
    <div className="w-full overflow-hidden">
      <img
        src={item.image}
        alt={item.alt}
        loading="lazy"
        width={1024}
        height={1280}
        className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
      />
    </div>
    <h3 className="mt-5 font-serif text-base tracking-[0.15em] text-foreground sm:mt-6 sm:text-lg">
      {item.title}
    </h3>
    <span className="mt-3 border-b border-foreground pb-1 text-xs text-foreground transition-opacity group-hover:opacity-70 sm:mt-4 sm:text-sm">
      Discover
    </span>
  </a>
);

const Ourdetaills = () => {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-serif text-[26px] font-normal leading-tight tracking-tight text-foreground sm:text-3xl md:text-[40px]">
          Discover the World of WINSOR
        </h2>
      </div>

      {/* Mobile: horizontal swipe carousel */}
      <div className="mt-8 md:hidden">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <div key={item.title} className="w-[80%] flex-shrink-0 snap-center">
              <Card item={item} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {items.map((item) => (
            <span
              key={item.title}
              className="h-1 w-6 rounded-full bg-foreground/20"
              aria-hidden
            />
          ))}
        </div>
      </div>

      {/* Desktop: 3-column grid */}
      <div className="mx-auto mt-12 hidden max-w-7xl px-4 sm:px-6 md:grid md:grid-cols-3 md:gap-6 lg:gap-8">
        {items.map((item) => (
          <Card key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
};

export default Ourdetaills;
