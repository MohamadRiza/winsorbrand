"use client";

interface StoryHeroTypewriterProps {
  title?: string;
  subtitle?: string;
}

export default function StoryHeroTypewriter({
  title = "Ride Your Moment",
  subtitle = "Crafted with surgical-grade 316L stainless steel, sapphire crystal glass, and Japanese precision movements — designed for lasting wear across Sri Lanka and beyond.",
}: StoryHeroTypewriterProps) {
  return (
    <>
      <div className="relative mb-4">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal leading-[1.12] tracking-tight text-white text-center">
          {title}
        </h1>
      </div>

      <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#dfb15b] to-transparent mx-auto mb-4 sm:mb-5" />

      <div className="relative mb-7 sm:mb-8 max-w-xl mx-auto">
        <p className="font-sans text-sm sm:text-base font-light leading-relaxed text-white/85 text-center">
          {subtitle}
        </p>
      </div>
    </>
  );
}
