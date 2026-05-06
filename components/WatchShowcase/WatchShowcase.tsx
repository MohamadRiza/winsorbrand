const watchHero = "/watch-hero.jpg";
const watchCard = "/watch-card.jpg";
const watchConquest = "/watch-conquest.jpg";
const watchGmt = "/watch-gmt.jpg";

const WatchShowcase = () => {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-28">
      {/* Heading */}
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-serif text-[28px] font-normal leading-tight tracking-tight text-foreground sm:text-3xl md:text-[40px] md:leading-tight">
          HYDROCONQUEST Exclusive Edition
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-6 md:text-base">
          A captivating edition, available in 39-mm and 42-mm, offered in distinctive variants that stand apart from the core collection while maintaining the sporty elegance and technical excellence that define it.
        </p>
      </div>

      {/* Hero block: product card + large lifestyle image */}
      <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-6 px-4 sm:mt-14 sm:gap-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-10">
        {/* Product card */}
        <article className="flex flex-col">
          <div className="relative overflow-hidden bg-secondary">
            <span className="absolute left-4 top-4 z-10 bg-background px-3 py-1 text-xs tracking-wide text-foreground sm:left-5 sm:top-5">
              Exclusive
            </span>
            <img
              src={watchCard}
              alt="Hydroconquest Exclusive Edition watch"
              loading="lazy"
              width={768}
              height={896}
              className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
            <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold tracking-[0.08em] text-foreground">
              HYDROCONQUEST EXCLUSIVE EDITION
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              42 mm - Automatic watch - Stainless steel and ceramic bezel
            </p>
            {/* <p className="pt-2 text-sm text-foreground"></p> */}
          </div>
          </div>
        </article>

        {/* Large lifestyle image */}
        <div className="overflow-hidden">
          <img
            src={watchHero}
            alt="Hydroconquest watch on a rocky landscape"
            loading="lazy"
            width={1280}
            height={1024}
            className="aspect-[4/3] h-full max-h-[720px] w-full object-cover transition-transform duration-700 hover:scale-[1.02] sm:aspect-auto"
          />
        </div>
      </div>

      {/* Two collection tiles */}
      <div className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-1 px-4 sm:mt-10 sm:px-6 md:grid-cols-2">
        {/* Conquest */}
        <a href="#" className="group relative block aspect-[4/5] overflow-hidden">
          <img
            src={watchConquest}
            alt="Conquest collection"
            loading="lazy"
            width={1024}
            height={1280}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-8 text-center sm:pb-12">
            <h3 className="font-serif text-2xl tracking-wide text-foreground sm:text-3xl md:text-5xl">
              PREMIUM
            </h3>
            <span className="mt-3 border-b border-foreground pb-1 text-xs text-foreground transition-opacity group-hover:opacity-80 sm:mt-4 sm:text-sm">
              Discover
            </span>
          </div>
        </a>

        {/* Hydroconquest GMT */}
        <a href="#" className="group relative block aspect-[4/5] overflow-hidden bg-black">
          <img
            src={watchGmt}
            alt="Hydroconquest GMT collection"
            loading="lazy"
            width={1024}
            height={1280}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-8 text-center sm:pb-12">
            <h3 className="font-serif text-2xl tracking-wide text-white sm:text-3xl md:text-5xl">
              SPORTS
            </h3>
            <span className="mt-3 border-b border-white pb-1 text-xs text-white transition-opacity group-hover:opacity-80 sm:mt-4 sm:text-sm">
              Discover
            </span>
          </div>
        </a>
      </div>
    </section>
  );
};

export default WatchShowcase;
