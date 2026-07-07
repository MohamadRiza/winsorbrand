'use client';

export default function BenefitsBanner() {
  const benefits = [
    {
      title: 'Free Worldwide Shipping',
      subtext: 'On all orders over $150',
      icon: (
        <svg 
          className="w-6 h-6 text-[#dfb15b] transition-transform duration-300 group-hover:scale-110" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM19.5 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18h1.5a2.25 2.25 0 0 0 2.25-2.25V9a2.25 2.25 0 0 1 2.25-2.25h6.75A2.25 2.25 0 0 1 17.25 9v6.75a2.25 2.25 0 0 0 2.25 2.25h1.5M17.25 12.75h4.5v3a2.25 2.25 0 0 1-2.25 2.25h-2.25V12.75ZM12 9.75v3m-3-3v3m6-3v3" />
        </svg>
      ),
    },
    {
      title: '2 Years Warranty',
      subtext: 'International warranty',
      icon: (
        <svg 
          className="w-6 h-6 text-[#dfb15b] transition-transform duration-300 group-hover:scale-110" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
    {
      title: 'Easy Returns',
      subtext: '30-day return policy',
      icon: (
        <svg 
          className="w-6 h-6 text-[#dfb15b] transition-transform duration-300 group-hover:scale-110" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2M12 20v2M2 12h2M20 12h2" />
        </svg>
      ),
    },
    {
      title: 'Secure Payments',
      subtext: '100% secure checkout',
      icon: (
        <svg 
          className="w-6 h-6 text-[#dfb15b] transition-transform duration-300 group-hover:scale-110" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-[#FAF4E8] border-y border-[#8B6914]/20 py-4 md:py-5 select-none">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-0">
          {benefits.map((benefit, idx) => (
            <div 
              key={idx} 
              className={`group flex items-center gap-3 px-3 lg:px-6 
                ${idx < 3 ? 'lg:border-r border-[#8B6914]/15' : ''} 
                ${idx % 2 === 0 ? 'sm:border-r sm:border-[#8B6914]/15 lg:border-r-0 lg:border-r border-[#8B6914]/15' : ''} 
                ${idx === 1 ? 'sm:border-r-0 lg:border-r border-[#8B6914]/15' : ''}
              `}
            >
              {/* Icon Container */}
              <div className="flex-shrink-0 flex items-center justify-center p-1.5 rounded-lg bg-white border border-[#8B6914]/20 transition-colors duration-300 group-hover:bg-white group-hover:border-[#8B6914]/40">
                {benefit.icon}
              </div>

              {/* Text Content */}
              <div className="flex flex-col">
                <h3 
                  className="text-[#1a1209] text-[10.5px] md:text-[11px] lg:text-[11.5px] font-medium tracking-[0.12em] uppercase transition-colors duration-300 group-hover:text-[#8B6914]"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                >
                  {benefit.title}
                </h3>
                <p 
                  className="text-[#666666] text-[9px] md:text-[10px] font-light tracking-[0.05em] mt-0.5"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                >
                  {benefit.subtext}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
