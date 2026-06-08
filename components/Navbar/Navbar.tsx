'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCurrency, CURRENCIES, CurrencyOption } from '@/app/context/CurrencyContext';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { useCart } from '@/app/context/CartContext';

const TOP_LEFT_LINKS  = [
  { label: 'Collections',   href: '/collections'   },
  { label: 'Our Story',     href: '/our-story'     },
  { label: 'Customer Care', href: '/customer-care' },
];
const TOP_RIGHT_LINKS = [
  { label: 'Find a Retailer', href: '/retailers'   },
  { label: 'Gifts',     href: '/gifts' },
];
const COLLECTIONS = [
  { key:'classic',    label:'CLASSIC',    items:[
    { label:'Classic Collection',  href:'/collections/classic'             },
    { label:'Classic Chronograph', href:'/collections/classic-chronograph' },
    { label:'Classic Moonphase',   href:'/collections/classic-moonphase'   },
    { label:'Classic GMT',         href:'/collections/classic-gmt'         },
  ]},
  { key:'sport',      label:'SPORT',      items:[
    { label:'Sport Pro',       href:'/collections/sport-pro'       },
    { label:'Sport Diver',     href:'/collections/sport-diver'     },
    { label:'Sport GMT',       href:'/collections/sport-gmt'       },
    { label:'Sport Automatic', href:'/collections/sport-automatic' },
  ]},
  { key:'heritage',   label:'HERITAGE',   items:[
    { label:'Heritage 1987',     href:'/collections/heritage-1987'     },
    { label:'Heritage Pilot',    href:'/collections/heritage-pilot'    },
    { label:'Heritage Conquest', href:'/collections/heritage-conquest' },
  ]},
  { key:'tourbillon', label:'TOURBILLON', items:[
    { label:'Grand Tourbillon',     href:'/collections/grand-tourbillon'    },
    { label:'Skeleton Tourbillon',  href:'/collections/skeleton-tourbillon' },
    { label:'Tourbillon Moonphase', href:'/collections/tourbillon-moonphase'},
  ]},
  { key:'limited',    label:'LIMITED',    items:[
    { label:'Anniversary Edition', href:'/collections/anniversary' },
    { label:"Founder's Reserve",   href:'/collections/founders'   },
    { label:"Collector's Piece",   href:'/collections/collectors' },
  ]},
];

// Icon Components
const SearchIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const UserIcon   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BagIcon    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const GlobeIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const ChevronDn  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>;
const MenuIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const CloseIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

function CurrencyPanel({ onClose }: { onClose: () => void }) {
  const { selected, detectedCode, setCurrency, lastUpdated, loading } = useCurrency();
  return (
    <div style={{ padding:'22px 40px', borderBottom:'1px solid rgba(26,18,9,0.07)', background:'rgba(250,247,240,0.98)' }}>
      <div style={{ maxWidth:'1400px', margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
            <GlobeIcon />
            <span style={{ fontFamily:"'Jost',sans-serif", fontSize:'10px', letterSpacing:'0.22em', color:'#8B6914', fontWeight:500 }}>DISPLAY CURRENCY</span>
          </div>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:'10px', color:'rgba(26,18,9,0.3)' }}>
            {loading ? 'updating rates…' : lastUpdated ? `rates as of ${lastUpdated.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}` : ''}
          </span>
        </div>
        {detectedCode !== 'LKR' && (
          <p style={{ fontFamily:"'Jost',sans-serif", fontSize:'11px', color:'rgba(26,18,9,0.45)', marginBottom:'14px' }}>
            Your location uses <strong style={{ color:'#1a1209' }}>{detectedCode}</strong>. Select a currency to view converted prices — checkout is always in LKR.
          </p>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(9,1fr)', gap:'5px' }}>
          {CURRENCIES.map((c: CurrencyOption) => {
            const isSel = selected.code === c.code;
            const isDet = c.code === detectedCode;
            return (
              <button key={c.code} onClick={() => { setCurrency(c.code); onClose(); }}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'8px 4px', border: isSel?'1px solid #8B6914':'1px solid rgba(26,18,9,0.07)', borderRadius:'5px', background: isSel?'rgba(139,105,20,0.06)':'transparent', cursor:'pointer', transition:'all 0.18s ease', position:'relative' }}>
                {isDet && !isSel && <span style={{ position:'absolute', top:'-5px', right:'-4px', background:'#8B6914', color:'#fff', fontSize:'7px', padding:'1px 4px', borderRadius:'3px', fontFamily:"'Jost',sans-serif" }}>AUTO</span>}
                <span style={{ fontSize:'17px', lineHeight:1 }}>{c.flag}</span>
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize:'10px', fontWeight:500, color: isSel?'#8B6914':'#1a1209', letterSpacing:'0.05em' }}>{c.code}</span>
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize:'9px', color:'rgba(26,18,9,0.38)' }}>{c.symbol}</span>
              </button>
            );
          })}
        </div>
        <p style={{ fontFamily:"'Jost',sans-serif", fontSize:'10px', color:'rgba(26,18,9,0.32)', marginTop:'12px' }}>
          Converted prices are indicative only. Final checkout price is in Sri Lankan Rupees (LKR).
        </p>
      </div>
    </div>
  );
}

function MegaMenu({ visible, activeKey, showCurrency, onClose }: { visible:boolean; activeKey:string|null; showCurrency:boolean; onClose:()=>void }) {
  const group = COLLECTIONS.find(c => c.key === activeKey);
  const show  = visible && (!!group || showCurrency);
  return (
    <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'rgba(250,247,240,0.98)', backdropFilter:'blur(16px)', borderTop:'1px solid rgba(26,18,9,0.07)', borderBottom:'1px solid rgba(26,18,9,0.07)', boxShadow:'0 16px 48px rgba(26,18,9,0.07)', opacity:show?1:0, transform:show?'translateY(0)':'translateY(-8px)', pointerEvents:show?'auto':'none', transition:'opacity 0.25s ease, transform 0.25s ease', zIndex:10 }}>
      {showCurrency && <CurrencyPanel onClose={onClose} />}
      {group && (
        <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'36px 40px' }}>
          <div style={{ display:'flex', gap:'56px' }}>
            <div style={{ minWidth:'150px' }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'28px', fontWeight:600, color:'#1a1209', letterSpacing:'0.05em', marginBottom:'8px' }}>{group.label}</p>
              <div style={{ width:'24px', height:'1px', background:'#8B6914' }}/>
            </div>
            <div style={{ display:'flex', flexDirection:'column' }}>
              {group.items.map(item => (
                <Link key={item.href} href={item.href}
                  style={{ fontFamily:"'Jost',sans-serif", fontSize:'12px', letterSpacing:'0.12em', color:'rgba(26,18,9,0.68)', padding:'9px 0', borderBottom:'1px solid rgba(26,18,9,0.04)', display:'block', textDecoration:'none', transition:'color 0.18s ease' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#8B6914')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(26,18,9,0.68)')}>
                  {item.label}
                </Link>
              ))}
              <Link href={`/collections/${group.key}`} style={{ fontFamily:"'Jost',sans-serif", fontSize:'10px', letterSpacing:'0.2em', color:'#8B6914', marginTop:'14px', textDecoration:'none' }}>
                VIEW ALL {group.label} →
              </Link>
            </div>
            <div style={{ marginLeft:'auto', minWidth:'180px' }}>
              <p style={{ fontFamily:"'Jost',sans-serif", fontSize:'9px', letterSpacing:'0.25em', color:'rgba(26,18,9,0.38)', marginBottom:'14px' }}>EXPLORE</p>
              {[{label:'New Arrivals',href:'/new'},{label:'Best Sellers',href:'/bestsellers'},{label:'Gift Ideas',href:'/gifts'},{label:"Men's Watches",href:'/mens'},{label:'Ladies Watches',href:'/ladies'}].map(l => (
                <Link key={l.href} href={l.href}
                  style={{ display:'block', fontFamily:"'Jost',sans-serif", fontSize:'11px', letterSpacing:'0.08em', color:'rgba(26,18,9,0.52)', padding:'7px 0', borderBottom:'1px solid rgba(26,18,9,0.04)', textDecoration:'none', transition:'color 0.18s ease' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#1a1209')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(26,18,9,0.52)')}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { selected, setCurrency } = useCurrency();
  const { isSignedIn } = useUser();
  const { totalItemsCount } = useCart();
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  const [isTransparent,      setIsTransparent]      = useState(true);
  const [isVisible,          setIsVisible]          = useState(true);
  const [mobileOpen,         setMobileOpen]         = useState(false);
  const [searchOpen,         setSearchOpen]         = useState(false);
  const [searchQuery,        setSearchQuery]        = useState('');
  const [activeKey,          setActiveKey]          = useState<string | null>(null);
  const [showCurrency,       setShowCurrency]       = useState(false);
  const [megaVisible,        setMegaVisible]        = useState(false);
  const [mobileCurrencyOpen, setMobileCurrencyOpen] = useState(false);

  const lastScrollY = useRef(0);
  const heroHeight  = useRef(0);
  const closeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isHomepage) {
      setIsTransparent(false);
    } else {
      const hero = document.getElementById('hero');
      heroHeight.current = hero ? hero.offsetHeight : window.innerHeight;
      setIsTransparent(window.scrollY < heroHeight.current - 80);
    }
  }, [isHomepage]);

  useEffect(() => {
    const onScroll = () => {
      const cur = window.scrollY;
      if (isHomepage) {
        setIsTransparent(cur < heroHeight.current - 80);
      } else {
        setIsTransparent(false);
      }
      if (cur > lastScrollY.current && cur > 120) { setIsVisible(false); setMegaVisible(false); }
      else setIsVisible(true);
      lastScrollY.current = cur;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomepage]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const openCollection = useCallback((key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveKey(key); setShowCurrency(false); setMegaVisible(true);
  }, []);

  const openCurrency = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveKey(null); setShowCurrency(true); setMegaVisible(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setMegaVisible(false);
      setTimeout(() => { setActiveKey(null); setShowCurrency(false); }, 280);
    }, 110);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const isWhite = isTransparent && !megaVisible;
  const tc  = isWhite ? '#ffffff' : '#1a1209';
  const tca = isWhite ? 'rgba(255,255,255,0.7)' : 'rgba(26,18,9,0.55)';
  const div = isWhite ? 'rgba(255,255,255,0.2)' : 'rgba(26,18,9,0.1)';
  const ibS: React.CSSProperties = { background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', justifyContent:'center', transition:'opacity 0.2s ease', color: tc };

  // ✅ Logo paths (place in /public folder)
  const LOGO_TRANSPARENT = '/white.webp';
  const LOGO_SOLID = '/yellow.webp';

  // ✅ Logo styles
  const desktopLogoStyle: React.CSSProperties = {
    objectFit: 'contain',
    transition: 'opacity 0.35s ease',
    height: 'auto',
    maxWidth: '180px',
    width: '100%',
  };

  const mobileTopLogoStyle: React.CSSProperties = {
    objectFit: 'contain',
    height: 'auto',
    maxWidth: '130px',
    width: '100%',
  };

  const mobileDrawerLogoStyle: React.CSSProperties = {
    objectFit: 'contain',
    height: 'auto',
    maxWidth: '170px',
    width: '100%',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Jost:wght@300;400;500&display=swap');
        .wn-a{text-decoration:none;transition:color 0.2s ease;}
        .wn-a:hover{color:#8B6914!important;}
        .wn-ib:hover{opacity:0.55;}
        
        /* Desktop only */
        @media(min-width:1025px){
          .wn-mob-only{display:none!important;}
          .wn-desk-only{display:flex!important;}
        }
        
        /* Mobile only */
        @media(max-width:1024px){
          .wn-desk-only{display:none!important;}
          .wn-mob-only{display:flex!important;}
          .wn-top-row{padding:0 16px!important;}
          .wn-actions-gap{gap:14px!important;}
        }
        
        .wn-logo-link{display:flex;align-items:center;justify-content:center;}
      `}</style>

      <header 
        onMouseLeave={scheduleClose} 
        style={{ 
          position:'fixed', 
          top:0, 
          left:0, 
          right:0, 
          zIndex:50, 
          transform: isVisible?'translateY(0)':'translateY(-100%)', 
          transition:'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94), background 0.35s ease, border-color 0.35s ease', 
          background: isWhite?'transparent':'rgba(250,247,240,0.97)', 
          backdropFilter: isWhite?'none':'blur(14px)', 
          WebkitBackdropFilter: isWhite?'none':'blur(14px)', 
          borderBottom:`1px solid ${isWhite?'rgba(255,255,255,0.1)':'rgba(26,18,9,0.07)'}` 
        }}
      >
        {/* TOP ROW */}
        <div style={{ borderBottom:`1px solid ${div}`, transition:'border-color 0.35s ease' }}>
          <div className="wn-top-row" style={{ maxWidth:'1400px', margin:'0 auto', padding:'0 40px', height:'44px', display:'flex', alignItems:'center' }}>
            
            {/* ✅ LEFT: Mobile Logo (always visible on mobile) */}
            <div className="wn-mob-only" style={{ display:'flex', alignItems:'center', minWidth:'130px' }}>
              <Link href="/" className="wn-logo-link">
                <Image 
                  src={isWhite ? LOGO_TRANSPARENT : LOGO_SOLID}
                  alt="Winsor"
                  width={130}
                  height={44}
                  style={mobileTopLogoStyle}
                  priority
                />
              </Link>
            </div>

            {/* LEFT: Desktop Navigation */}
            <nav className="wn-desk-only" style={{ display:'flex', alignItems:'center', gap:'28px', flex:1 }}>
              {TOP_LEFT_LINKS.map(l => (
                <Link key={l.href} href={l.href} className="wn-a" style={{ fontFamily:"'Jost',sans-serif", fontSize:'11px', letterSpacing:'0.1em', color: tca }}>
                  {l.label}
                </Link>
              ))}
            </nav>
            
            {/* ✅ CENTER: Desktop Logo */}
            <div className="wn-desk-only" style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
              <Link href="/" className="wn-logo-link">
                <Image 
                  src={isWhite ? LOGO_TRANSPARENT : LOGO_SOLID}
                  alt="Winsor Logo"
                  width={180}
                  height={60}
                  style={desktopLogoStyle}
                  priority
                />
              </Link>
            </div>

            {/* RIGHT: Actions */}
            <div className="wn-actions-gap" style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'18px', flex:1, justifyContent:'flex-end' }}>
              {/* Currency - Desktop */}
              <button className="wn-desk-only wn-a" onMouseEnter={() => { cancelClose(); openCurrency(); }}
                style={{ display:'flex', alignItems:'center', gap:'5px', color: tca, fontFamily:"'Jost',sans-serif", fontSize:'11px', letterSpacing:'0.08em', background:'none', border:'none', cursor:'pointer', transition:'color 0.2s ease' }}>
                <GlobeIcon /><span>{selected.flag} {selected.code}</span><ChevronDn />
              </button>
              <div className="wn-desk-only" style={{ width:'1px', height:'14px', background: div, transition:'background 0.35s ease' }}/>
              
              {/* Right Links - Desktop */}
              {TOP_RIGHT_LINKS.map(l => (
                <Link key={l.href} href={l.href} className="wn-a wn-desk-only" style={{ fontFamily:"'Jost',sans-serif", fontSize:'11px', letterSpacing:'0.1em', color: tca }}>
                  {l.label}
                </Link>
              ))}
              <div className="wn-desk-only" style={{ width:'1px', height:'14px', background: div }}/>
              
              {/* Search Toggle */}
              <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                {searchOpen && (
                  <input 
                    autoFocus 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="Search watches…" 
                    onKeyDown={e => e.key==='Escape' && setSearchOpen(false)} 
                    style={{ 
                      background:'transparent', 
                      border:'none', 
                      borderBottom:`1px solid ${isWhite?'rgba(255,255,255,0.4)':'rgba(26,18,9,0.3)'}`, 
                      outline:'none', 
                      width:'140px', 
                      fontFamily:"'Jost',sans-serif", 
                      fontSize:'12px', 
                      color: tc, 
                      paddingBottom:'2px' 
                    }}
                  />
                )}
                <button className="wn-ib" style={ibS} onClick={() => setSearchOpen(v => !v)}>
                  <SearchIcon />
                </button>
              </div>
              
              {/* Account & Cart */}
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button style={{ ...ibS, padding:'4px' }} className="wn-ib" aria-label="Sign In">
                    <UserIcon />
                  </button>
                </SignInButton>
              ) : (
                <div style={{ display:'flex', alignItems:'center', padding:'4px' }}>
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: {
                          width: '20px',
                          height: '20px',
                          border: '1px solid rgba(139,105,20,0.3)',
                        }
                      }
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="My Profile"
                        labelIcon={<UserIcon />}
                        href="/profile"
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              )}
              <Link href="/cart" style={{ position:'relative', color: tc, display:'flex' }} className="wn-ib">
                <BagIcon />
                <span style={{ position:'absolute', top:'-3px', right:'-5px', width:'14px', height:'14px', borderRadius:'50%', background:'#8B6914', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontFamily:"'Jost',sans-serif" }}>
                  {totalItemsCount > 9 ? '9+' : totalItemsCount}
                </span>
              </Link>
              
              {/* Mobile Menu Toggle */}
              <button className="wn-mob-only wn-ib" style={{...ibS, padding:'6px'}} onClick={() => setMobileOpen(v => !v)}>
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW - Desktop Collections */}
        <div className="wn-desk-only" onMouseLeave={scheduleClose}>
          <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'0 40px', height:'42px', display:'flex', alignItems:'center', justifyContent:'center', gap:'48px' }}>
            {COLLECTIONS.map(col => (
              <button 
                key={col.key} 
                onMouseEnter={() => { cancelClose(); openCollection(col.key); }}
                style={{ 
                  background:'none', 
                  border:'none', 
                  cursor:'pointer', 
                  padding:'0 0 4px', 
                  fontFamily:"'Jost',sans-serif", 
                  fontSize:'11.5px', 
                  fontWeight:500, 
                  letterSpacing:'0.2em', 
                  color: activeKey===col.key && megaVisible ? '#8B6914' : tc, 
                  transition:'color 0.22s ease', 
                  position:'relative' 
                }}
                className="wn-a"
              >
                {col.label}
                <span 
                  style={{ 
                    position:'absolute', 
                    bottom:0, 
                    left:'50%', 
                    transform:'translateX(-50%)', 
                    width: activeKey===col.key && megaVisible ? '100%':'0', 
                    height:'1px', 
                    background:'#8B6914', 
                    transition:'width 0.3s ease', 
                    display:'block' 
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* MEGA MENU */}
        <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
          <MegaMenu visible={megaVisible} activeKey={activeKey} showCurrency={showCurrency} onClose={() => setMegaVisible(false)} />
        </div>
      </header>

      {/* MOBILE OVERLAY */}
      <div 
        onClick={() => setMobileOpen(false)} 
        style={{ 
          position:'fixed', 
          inset:0, 
          zIndex:40, 
          background:'rgba(26,18,9,0.5)', 
          opacity: mobileOpen?1:0, 
          pointerEvents: mobileOpen?'auto':'none', 
          transition:'opacity 0.35s ease' 
        }}
      />

      {/* MOBILE DRAWER */}
      <div 
        style={{ 
          position:'fixed', 
          top:0, 
          right:0, 
          bottom:0, 
          width:'320px', 
          zIndex:50, 
          background:'#faf7f0', 
          transform: mobileOpen?'translateX(0)':'translateX(100%)', 
          transition:'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)', 
          display:'flex', 
          flexDirection:'column', 
          overflowY:'auto',
          boxShadow: '-4px 0 24px rgba(26,18,9,0.12)'
        }}
      >
        {/* Mobile Header with Larger Logo */}
        <div style={{ 
          display:'flex', 
          alignItems:'center', 
          justifyContent:'space-between', 
          padding:'18px 24px', 
          borderBottom:'1px solid rgba(26,18,9,0.08)',
          background: '#faf7f0',
          position: 'sticky',
          top: 0,
          zIndex: 55
        }}>
          {/* Drawer Logo - Larger version for menu header */}
          <Link href="/" className="wn-logo-link" style={{ flex:1, justifyContent:'center' }}>
            <Image 
              src={LOGO_SOLID}
              alt="Winsor Logo"
              width={170}
              height={58}
              style={mobileDrawerLogoStyle}
              priority
            />
          </Link>
          <button 
            style={{ 
              ...ibS, 
              color:'#1a1209', 
              padding:'8px',
              borderRadius:'50%',
              background:'rgba(26,18,9,0.04)'
            }} 
            onClick={() => setMobileOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Mobile Currency Selector */}
        <div style={{ padding:'14px 24px', borderBottom:'1px solid rgba(26,18,9,0.06)' }}>
          <button 
            onClick={() => setMobileCurrencyOpen(v => !v)} 
            style={{ 
              display:'flex', 
              alignItems:'center', 
              gap:'10px', 
              width:'100%', 
              background:'none', 
              border:'1px solid rgba(26,18,9,0.1)', 
              borderRadius:'6px', 
              padding:'10px 14px', 
              cursor:'pointer', 
              justifyContent:'space-between',
              transition:'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,105,20,0.04)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <GlobeIcon />
              <span style={{ fontFamily:"'Jost',sans-serif", fontSize:'12px', color:'#1a1209' }}>
                {selected.flag} {selected.code} — {selected.label}
              </span>
            </div>
            <ChevronDn />
          </button>
          
          {mobileCurrencyOpen && (
            <div style={{ 
              marginTop:'10px', 
              maxHeight:'280px', 
              overflowY:'auto',
              padding:'8px 0',
              border:'1px solid rgba(26,18,9,0.06)',
              borderRadius:'6px'
            }}>
              {CURRENCIES.map((c: CurrencyOption) => (
                <button 
                  key={c.code} 
                  onClick={() => { setCurrency(c.code); setMobileCurrencyOpen(false); }}
                  style={{ 
                    display:'flex', 
                    alignItems:'center', 
                    gap:'12px', 
                    width:'100%', 
                    padding:'10px 14px', 
                    background:'none', 
                    border:'none', 
                    borderBottom:'1px solid rgba(26,18,9,0.04)', 
                    cursor:'pointer', 
                    color: selected.code===c.code?'#8B6914':'rgba(26,18,9,0.7)',
                    transition:'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,105,20,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize:'16px', lineHeight:1 }}>{c.flag}</span>
                  <span style={{ fontFamily:"'Jost',sans-serif", fontSize:'13px', fontWeight: selected.code===c.code?600:400 }}>
                    {c.code}
                  </span>
                  <span style={{ fontFamily:"'Jost',sans-serif", fontSize:'12px', color:'rgba(26,18,9,0.4)', marginLeft:'auto' }}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Navigation Links */}
        <nav style={{ flex:1, padding:'18px 24px', display:'flex', flexDirection:'column', gap:'4px' }}>
          <p style={{ fontFamily:"'Jost',sans-serif", fontSize:'9px', letterSpacing:'0.28em', color:'#8B6914', marginBottom:'10px', fontWeight:600 }}>
            COLLECTIONS
          </p>
          {COLLECTIONS.map(col => (
            <Link 
              key={col.key} 
              href={`/collections/${col.key}`} 
              onClick={() => setMobileOpen(false)}
              style={{ 
                fontFamily:"'Jost',sans-serif", 
                fontSize:'13.5px', 
                letterSpacing:'0.14em', 
                color:'#1a1209', 
                padding:'12px 0', 
                borderBottom:'1px solid rgba(26,18,9,0.05)', 
                display:'flex', 
                justifyContent:'space-between', 
                alignItems:'center', 
                textDecoration:'none',
                transition:'color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#8B6914'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#1a1209'}
            >
              {col.label} 
              <span style={{ color:'#8B6914', fontSize:'14px' }}>→</span>
            </Link>
          ))}
          
          <p style={{ fontFamily:"'Jost',sans-serif", fontSize:'9px', letterSpacing:'0.28em', color:'#8B6914', marginTop:'24px', marginBottom:'10px', fontWeight:600 }}>
            EXPLORE
          </p>
          {isSignedIn && (
            <Link 
              href="/profile" 
              onClick={() => setMobileOpen(false)}
              style={{ 
                fontFamily:"'Jost',sans-serif", 
                fontSize:'12.5px', 
                letterSpacing:'0.09em', 
                color:'#8B6914',
                padding:'10px 0', 
                borderBottom:'1px solid rgba(26,18,9,0.04)', 
                textDecoration:'none',
                fontWeight: 500,
                display: 'block'
              }}
            >
              My Profile Details
            </Link>
          )}
          {[...TOP_LEFT_LINKS,...TOP_RIGHT_LINKS].map(l => (
            <Link 
              key={l.href} 
              href={l.href} 
              onClick={() => setMobileOpen(false)}
              style={{ 
                fontFamily:"'Jost',sans-serif", 
                fontSize:'12.5px', 
                letterSpacing:'0.09em', 
                color:'rgba(26,18,9,0.65)', 
                padding:'10px 0', 
                borderBottom:'1px solid rgba(26,18,9,0.04)', 
                textDecoration:'none',
                transition:'color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1a1209'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(26,18,9,0.65)'}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Footer Actions */}
        <div style={{ 
          padding:'18px 24px', 
          borderTop:'1px solid rgba(26,18,9,0.08)', 
          display:'flex', 
          gap:'24px', 
          alignItems:'center',
          background: '#faf7f0'
        }}>
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button style={{ background:'none', border:'none', padding:0, cursor:'pointer', color:'#1a1209', display:'flex', alignItems:'center', gap:'8px' }}>
                <UserIcon />
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize:'12px', color:'#1a1209' }}>Account</span>
              </button>
            </SignInButton>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: {
                      width: '20px',
                      height: '20px',
                      border: '1px solid rgba(139,105,20,0.3)',
                    }
                  }
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="My Profile"
                    labelIcon={<UserIcon />}
                    href="/profile"
                  />
                </UserButton.MenuItems>
              </UserButton>
              <span style={{ fontFamily:"'Jost',sans-serif", fontSize:'12px', color:'#1a1209' }}>Account</span>
            </div>
          )}
          <Link href="/cart" style={{ color:'#1a1209', position:'relative', display:'flex', alignItems:'center', gap:'8px' }}>
            <BagIcon />
            <span style={{ fontFamily:"'Jost',sans-serif", fontSize:'12px', color:'#1a1209' }}>Cart</span>
            <span style={{ position:'absolute', top:'-4px', right:'-8px', width:'16px', height:'16px', borderRadius:'50%', background:'#8B6914', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontFamily:"'Jost',sans-serif", fontWeight:500 }}>
              {totalItemsCount > 9 ? '9+' : totalItemsCount}
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}