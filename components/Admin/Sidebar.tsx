'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

// Type alias for cleaner JSX usage throughout this file
type IconComponent = (props: { active: boolean }) => React.JSX.Element;

// ── Icon Components (SVG - no external deps) ───────────────────────────────
const DashboardIcon: IconComponent = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#8B6914' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ProductsIcon: IconComponent = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#8B6914' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const OrdersIcon: IconComponent = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#8B6914' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const CustomersIcon: IconComponent = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#8B6914' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MessagesIcon: IconComponent = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#8B6914' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const JobsIcon: IconComponent = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#8B6914' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const StockIcon: IconComponent = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#8B6914' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const SettingsIcon: IconComponent = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#8B6914' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const RetailerIcon: IconComponent = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#8B6914' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const LogoutIcon = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }): React.JSX.Element => (
  <svg 
    width="12" 
    height="12" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round"
    style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Navigation Items ───────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: IconComponent;
  badge?: number;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: DashboardIcon },
  { 
    label: 'Products', 
    href: '/admin/products', 
    icon: ProductsIcon,
    children: [
      { label: 'All Products', href: '/admin/products', icon: () => <></> },
      { label: 'Add New', href: '/admin/products/new', icon: () => <></> },
      { label: 'Categories', href: '/admin/products/categories', icon: () => <></> },
    ]
  },
  { 
    label: 'Orders', 
    href: '/admin/orders', 
    icon: OrdersIcon,
    badge: 0
  },
  { 
    label: 'Customers', 
    href: '/admin/customers', 
    icon: CustomersIcon 
  },
  { 
    label: 'Messages', 
    href: '/admin/messages', 
    icon: MessagesIcon,
    badge: 0
  },
  { 
    label: 'Careers', 
    href: '/admin/careers', 
    icon: JobsIcon,
    children: [
      { label: 'Applications', href: '/admin/careers/applications', icon: () => <></> },
      { label: 'Vacancies', href: '/admin/careers/vacancies', icon: () => <></> },
    ]
  },
  { 
    label: 'Inventory', 
    href: '/admin/inventory', 
    icon: StockIcon,
    badge: 0
  },
  { 
    label: 'Retailers', 
    href: '/admin/retailers', 
    icon: RetailerIcon 
  },
  { 
    label: 'Staff Management', 
    href: '/admin/staff', 
    icon: CustomersIcon 
  },
  { label: 'Settings', href: '/admin/settings', icon: SettingsIcon },
];

// ── Sidebar Component ──────────────────────────────────────────────────────
interface SidebarProps {
  adminName?: string;
  adminRole?: 'admin' | 'staff';
  permissions?: string[];
  stats?: {
    pendingOrders?: number;
    newMessages?: number;
    lowStockItems?: number;
    jobApplications?: number;
  };
}

export default function Sidebar({ adminName = 'Admin', adminRole = 'admin', permissions = [], stats = {} }: SidebarProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
      toast.success('Logged out successfully');
      router.push('/admin/login');
      router.refresh();
    } catch {
      toast.error('Logout failed');
    }
  };

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  // Permission filtering logic
  const hasAccess = (itemLabel: string): boolean => {
    if (adminRole === 'admin') return true;
    const userPermissions = permissions || [];
    
    switch (itemLabel) {
      case 'Dashboard':
        return false; // Staff never gets access to dashboard
      case 'Staff Management':
        return false; // Staff never gets access to staff management page
      case 'Products':
        return userPermissions.some(p => ['products_read', 'products_create', 'categories_manage'].includes(p));
      case 'All Products':
        return userPermissions.includes('products_read');
      case 'Add New':
        return userPermissions.includes('products_create');
      case 'Categories':
        return userPermissions.includes('categories_manage');
      case 'Orders':
        return userPermissions.includes('orders_manage');
      case 'Customers':
        return userPermissions.includes('customers_read');
      case 'Messages':
        return userPermissions.includes('messages_manage');
      case 'Careers':
        return userPermissions.some(p => ['careers_applications', 'careers_vacancies'].includes(p));
      case 'Applications':
        return userPermissions.includes('careers_applications');
      case 'Vacancies':
        return userPermissions.includes('careers_vacancies');
      case 'Inventory':
        return userPermissions.includes('inventory_manage');
      case 'Retailers':
        return userPermissions.includes('retailers_manage');
      case 'Settings':
        return true; // Always visible for self credentials management
      default:
        return false;
    }
  };

  const visibleNavItems = NAV_ITEMS.map(item => {
    if (item.children) {
      const filteredChildren = item.children.filter(child => hasAccess(child.label));
      return { ...item, children: filteredChildren };
    }
    return item;
  }).filter(item => {
    if (item.children && item.children.length === 0) {
      return false; // Hide parent if all children are hidden
    }
    return hasAccess(item.label);
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap');
        .sb-link { transition: all 0.2s ease; }
        .sb-link:hover { background: rgba(139,105,20,0.08); }
        .sb-link-active { background: rgba(139,105,20,0.12); border-left: 3px solid #8B6914; }
        .sb-scrollbar::-webkit-scrollbar { width: 4px; }
        .sb-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sb-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,105,20,0.3); border-radius: 2px; }
        .sb-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139,105,20,0.5); }
      `}</style>

      <aside 
        style={{
          width: isCollapsed ? '72px' : '260px',
          minWidth: isCollapsed ? '72px' : '260px',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          background: '#1a1209',
          borderRight: '1px solid rgba(139,105,20,0.2)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 40,
          fontFamily: "'Jost', sans-serif",
        }}
        className="sb-scrollbar"
      >
        {/* Header */}
        <div style={{ 
          padding: isCollapsed ? '16px 12px' : '20px 24px', 
          borderBottom: '1px solid rgba(139,105,20,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          minHeight: '72px'
        }}>
          {!isCollapsed && (
            <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Image src="/yellow.webp" alt="Winsor" width={32} height={32} style={{ objectFit: 'contain' }} priority />
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 600, color: '#f3e3b8', letterSpacing: '0.05em' }}>
                WINSOR
              </span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'rgba(139,105,20,0.15)',
              border: 'none',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#c9a14a',
              fontSize: '14px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,105,20,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139,105,20,0.15)'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Admin Profile */}
        {!isCollapsed && (
          <div style={{ 
            padding: '16px 24px', 
            borderBottom: '1px solid rgba(139,105,20,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B6914, #c9a14a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1a1209',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: "'Jost', sans-serif"
            }}>
              {adminName?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                color: '#f3e3b8', 
                fontSize: '13px', 
                fontWeight: 500, 
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {adminName}
              </p>
              <p style={{ 
                color: 'rgba(243,227,184,0.6)', 
                fontSize: '11px', 
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                {adminRole}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }} className="sb-scrollbar">
          {visibleNavItems.map((item) => {
            const active = isActive(item.href);
            const hasChildren = item.children?.length;
            const submenuOpen = openSubmenu === item.label;
            const badge = item.badge !== undefined ? (stats as any)[item.label.toLowerCase().replace(' ', '') + 's'] ?? item.badge : undefined;

            return (
              <div key={item.href}>
                <Link
                  href={hasChildren ? '#' : item.href}
                  onClick={(e) => {
                    if (hasChildren) {
                      e.preventDefault();
                      toggleSubmenu(item.label);
                    }
                  }}
                  className={`sb-link ${active && !hasChildren ? 'sb-link-active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: isCollapsed ? '12px' : '12px 16px',
                    color: active ? '#8B6914' : 'rgba(243,227,184,0.85)',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: active ? 600 : 400,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    borderRadius: '0 4px 4px 0',
                    borderLeft: active && !hasChildren ? '3px solid #8B6914' : '3px solid transparent',
                    position: 'relative',
                    whiteSpace: isCollapsed ? 'nowrap' : 'normal',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = 'rgba(139,105,20,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = '';
                  }}
                >
                  <item.icon active={active} />
                  {!isCollapsed && (
                    <>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {badge !== undefined && badge > 0 && (
                        <span style={{
                          background: badge > 9 ? '#c9a14a' : '#8B6914',
                          color: '#1a1209',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '10px',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                      {hasChildren && <ChevronIcon open={submenuOpen} />}
                    </>
                  )}
                </Link>

                {/* Submenu */}
                {!isCollapsed && hasChildren && submenuOpen && (
                  <div style={{ 
                    marginLeft: '34px', 
                    marginTop: '4px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2px',
                    borderLeft: '1px dashed rgba(139,105,20,0.2)',
                    paddingLeft: '12px'
                  }}>
                    {item.children?.map((child) => {
                      const childActive = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`sb-link ${childActive ? 'sb-link-active' : ''}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            color: childActive ? '#8B6914' : 'rgba(243,227,184,0.7)',
                            textDecoration: 'none',
                            fontSize: '11px',
                            fontWeight: childActive ? 500 : 400,
                            letterSpacing: '0.05em',
                            borderRadius: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: childActive ? '#8B6914' : 'rgba(139,105,20,0.4)' }} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div style={{ 
          padding: isCollapsed ? '12px' : '16px 24px', 
          borderTop: '1px solid rgba(139,105,20,0.15)',
          background: 'rgba(26,18,9,0.5)'
        }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isCollapsed ? 0 : '12px',
              width: '100%',
              padding: isCollapsed ? '12px' : '12px 16px',
              background: 'transparent',
              border: '1px solid rgba(139,105,20,0.3)',
              borderRadius: '6px',
              color: 'rgba(243,227,184,0.7)',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              justifyContent: isCollapsed ? 'center' : 'flex-start'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220,50,50,0.15)';
              e.currentTarget.style.borderColor = '#dc3232';
              e.currentTarget.style.color = '#dc3232';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(139,105,20,0.3)';
              e.currentTarget.style.color = 'rgba(243,227,184,0.7)';
            }}
          >
            <LogoutIcon />
            {!isCollapsed && <span>Logout</span>}
          </button>
          
          {!isCollapsed && (
            <p style={{ 
              textAlign: 'center', 
              fontSize: '10px', 
              color: 'rgba(243,227,184,0.3)', 
              marginTop: '12px',
              letterSpacing: '0.05em'
            }}>
              © 2026 Winsor Admin
            </p>
          )}
        </div>
      </aside>
    </>
  );
}