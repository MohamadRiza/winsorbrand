'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

// ── Date Relative Formatter ────────────────────────────────────────────────
const formatRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 0) return 'Just now';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
};

// ── Stat Card Component ────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.JSX.Element;
  href?: string;
  color?: 'gold' | 'blue' | 'green' | 'red' | 'purple';
  isRevenue?: boolean;
}

const StatCard = ({ title, value, icon, href, color = 'gold', isRevenue = false }: StatCardProps): React.JSX.Element => {
  const [hovered, setHovered] = useState(false);
  
  if (isRevenue) {
    return (
      <div 
        style={{
          background: 'linear-gradient(135deg, #1f160c 0%, #050403 100%)',
          border: hovered ? '1px solid #c9a14a' : '1px solid rgba(201,161,74,0.3)',
          borderRadius: '14px',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '145px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered ? '0 12px 28px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(201, 161, 74, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c9a14a',
            flexShrink: 0,
            border: '1px solid rgba(201, 161, 74, 0.35)',
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              color: '#c9a14a',
              margin: 0,
              textTransform: 'uppercase',
            }}>
              {title}
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '30px',
              fontWeight: 600,
              color: '#ffffff',
              margin: '4px 0 0',
              lineHeight: 1.05,
            }}>
              {value}
            </p>
          </div>
        </div>
        
        <p style={{
          fontSize: '11px',
          color: '#2ecc71',
          margin: '8px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: "'Jost', sans-serif",
        }}>
          ↑ 12.5% vs last month
        </p>
      </div>
    );
  }

  // Normal White Card
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    gold: { bg: 'rgba(139,105,20,0.06)', border: 'rgba(139,105,20,0.12)', text: '#8B6914' },
    blue: { bg: 'rgba(52,152,219,0.06)', border: 'rgba(52,152,219,0.12)', text: '#3498db' },
    green: { bg: 'rgba(46,204,113,0.06)', border: 'rgba(46,204,113,0.12)', text: '#2ecc71' },
    red: { bg: 'rgba(231,76,60,0.06)', border: 'rgba(231,76,60,0.12)', text: '#e74c3c' },
    purple: { bg: 'rgba(155,89,182,0.06)', border: 'rgba(155,89,182,0.12)', text: '#9b59b6' },
  };
  const colors = colorMap[color] || colorMap.gold;

  return (
    <div 
      style={{
        background: '#fff',
        border: hovered ? `1px solid ${colors.text}` : `1px solid rgba(26,18,9,0.08)`,
        borderRadius: '14px',
        padding: '20px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '145px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        cursor: href ? 'pointer' : 'default',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 28px rgba(26,18,9,0.05)' : '0 2px 8px rgba(0,0,0,0.01)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => href && (window.location.href = href)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: colors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.text,
          flexShrink: 0,
          border: `1px solid ${colors.border}`,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: 'rgba(26,18,9,0.5)',
            margin: 0,
            textTransform: 'uppercase',
          }}>
            {title}
          </p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '32px',
            fontWeight: 600,
            color: '#1a1209',
            margin: '4px 0 0',
            lineHeight: 1.05,
          }}>
            {value}
          </p>
        </div>
      </div>
      
      {href && (
        <div style={{
          borderTop: '1px solid rgba(26,18,9,0.04)',
          paddingTop: '8px',
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: hovered ? colors.text : 'rgba(26,18,9,0.45)',
          fontFamily: "'Jost', sans-serif",
          transition: 'color 0.2s',
        }}>
          <span>{`View ${title.toLowerCase().split(' ')[1] || 'details'}`}</span>
          <span>→</span>
        </div>
      )}
    </div>
  );
};

// ── Activity Item Component ───────────────────────────────────────────────
interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'order' | 'product' | 'customer' | 'message';
}

const ActivityItem = ({ activity }: { activity: Activity }): React.JSX.Element => {
  const typeColors: Record<Activity['type'], { color: string; bg: string; badge: string }> = {
    order: { color: '#8B6914', bg: 'rgba(139,105,20,0.08)', badge: 'Order' },
    product: { color: '#3498db', bg: 'rgba(52,152,219,0.08)', badge: 'Catalog' },
    customer: { color: '#9b59b6', bg: 'rgba(155,89,182,0.08)', badge: 'Careers' },
    message: { color: '#e74c3c', bg: 'rgba(231,76,60,0.08)', badge: 'Inquiry' },
  };

  const currentType = typeColors[activity.type] || { color: '#8B6914', bg: 'rgba(139,105,20,0.08)', badge: 'Activity' };
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      style={{
        display: 'flex',
        gap: '16px',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(26,18,9,0.03)',
        alignItems: 'flex-start',
        position: 'relative',
        background: hovered ? 'rgba(139,105,20,0.02)' : 'transparent',
        transition: 'all 0.25s ease',
        borderRadius: '8px',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Timeline indicator node */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0,
        height: '100%',
        paddingTop: '5px',
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          border: `2px solid ${currentType.color}`,
          background: hovered ? currentType.color : '#fff',
          transition: 'all 0.25s ease',
          boxShadow: `0 0 8px ${currentType.color}30`,
          zIndex: 2,
        }} />
      </div>

      {/* Message contents */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '2px' }}>
          <span style={{
            fontSize: '9px',
            fontFamily: "'Jost', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '1px 6px',
            borderRadius: '4px',
            color: currentType.color,
            backgroundColor: currentType.bg,
            border: `1px solid ${currentType.color}15`
          }}>
            {currentType.badge}
          </span>
          <span style={{
            fontSize: '11px',
            color: 'rgba(26,18,9,0.4)',
            fontFamily: "'Jost', sans-serif",
          }}>
            {formatRelativeTime(activity.time)}
          </span>
        </div>

        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '13px',
          color: '#1a1209',
          margin: 0,
          lineHeight: 1.45,
        }}>
          <strong style={{ fontWeight: 600, color: '#1a1209' }}>{activity.user}</strong>{' '}
          <span style={{ color: 'rgba(26,18,9,0.7)' }}>{activity.action}</span>{' '}
          <strong style={{ fontWeight: 500, color: '#8B6914' }}>{activity.target}</strong>
        </p>
      </div>

      {hovered && (
        <span style={{
          fontSize: '14px',
          color: '#8B6914',
          alignSelf: 'center',
          animation: 'arrowSlide 0.2s ease both',
        }}>
          →
        </span>
      )}
    </div>
  );
};

// ── Main Dashboard Page ───────────────────────────────────────────────────
export default function AdminDashboard(): React.JSX.Element {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    openVacancies: 0,
    jobApplications: 0,
    newMessages: 0,
    lowStockItems: 0,
    onlineCustomers: 0,
    totalRevenue: 0,
    ordersDistribution: {
      total: 0,
      completed: 0,
      processing: 0,
      pending: 0,
    },
    salesOverview: [] as { date: string; amount: number }[],
    topProducts: [] as { title: string; thumbnail: string; sales: number }[],
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Resize listener for responsive layout adjustments
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/stats', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.data.stats);
          setActivities(data.data.activities || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        toast.error('Could not load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(139,105,20,0.2)',
          borderTopColor: '#8B6914',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Generate SVG path for Sales Line Chart
  const renderSalesChartPath = () => {
    const data = stats.salesOverview || [];
    if (data.length === 0) return { linePath: '', fillPath: '' };

    const maxAmt = Math.max(...data.map(d => d.amount), 0) || 1000;
    const width = 500;
    const height = 150;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = data.map((d, i) => {
      const x = paddingLeft + (i * (chartWidth / (data.length - 1)));
      const y = height - paddingBottom - ((d.amount / maxAmt) * chartHeight);
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    return { linePath, fillPath, maxAmt };
  };

  const chartData = renderSalesChartPath();

  // Donut segmented values
  const totalOrders = stats.ordersDistribution?.total || 0;
  const completedCount = stats.ordersDistribution?.completed || 0;
  const processingCount = stats.ordersDistribution?.processing || 0;
  const pendingCount = stats.ordersDistribution?.pending || 0;

  const completedPct = totalOrders ? Math.round((completedCount / totalOrders) * 100) : 0;
  const processingPct = totalOrders ? Math.round((processingCount / totalOrders) * 100) : 0;
  const pendingPct = totalOrders ? Math.round((pendingCount / totalOrders) * 100) : 0;

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", padding: '10px 0', color: '#1a1209' }}>
      
      {/* Executive Welcome Banner */}
      <div style={{
        background: 'radial-gradient(circle at right, #1f160c 0%, #050403 100%)',
        border: '1px solid rgba(201,161,74,0.3)',
        borderRadius: '16px',
        padding: isMobile ? '24px 20px' : '32px 40px',
        color: '#f3e3b8',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(26,18,9,0.2), inset 0 0 50px rgba(139,105,20,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        minHeight: '180px',
      }}>
        {/* Watch Image on the Right */}
        {!isMobile && (
          <div style={{
            position: 'absolute',
            right: '250px',
            top: '-20px',
            bottom: '-20px',
            width: '180px',
            opacity: 0.9,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img 
              src="/Sport_Watch.webp" 
              alt="Maison timepiece" 
              style={{
                height: '140%',
                objectFit: 'contain',
                transform: 'rotate(15deg) translateY(-5px)',
                filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.75))',
              }}
            />
          </div>
        )}

        <div>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#c9a14a',
            margin: '0 0 8px',
            textTransform: 'uppercase',
          }}>
            WINSOR MAISON EXECUTIVE SUITE
          </p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: 400,
            color: '#f3e3b8',
            margin: '0 0 8px',
            lineHeight: 1.2,
          }}>
            Welcome back, Administrator
          </h2>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '13.5px',
            color: 'rgba(243,227,184,0.75)',
            margin: 0,
            maxWidth: '520px',
            lineHeight: 1.5,
          }}>
            Monitor storefront operations, review applications, and manage inventory in real time.
          </p>
        </div>

        {/* Date Widget */}
        <div style={{
          background: 'rgba(26, 18, 9, 0.65)',
          border: '1px solid rgba(201, 161, 74, 0.3)',
          padding: '16px 20px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          width: '200px',
          flexShrink: 0,
          zIndex: 5,
          marginTop: isMobile ? '16px' : '0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a14a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p style={{
              margin: 0,
              fontSize: '10px',
              fontWeight: 600,
              color: '#c9a14a',
              textTransform: 'uppercase',
              letterSpacing: '0.12em'
            }}>
              Current Date
            </p>
          </div>
          <p style={{
            margin: 0,
            fontFamily: "'Jost', sans-serif",
            fontSize: '14px',
            color: '#ffffff',
            fontWeight: 500
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })},
          </p>
          <p style={{
            margin: '2px 0 0',
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '20px',
            color: '#f3e3b8',
            fontWeight: 600,
            letterSpacing: '0.02em'
          }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}
          href="/admin/products"
          color="gold"
        />
        <StatCard
          title="Registered Customers"
          value={stats.totalCustomers}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
          href="/admin/customers"
          color="blue"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
          href="/admin/orders"
          color="red"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg>}
          href="/admin/inventory"
          color="gold"
        />
        <StatCard
          title="Pending Careers"
          value={stats.jobApplications}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
          href="/admin/careers/applications"
          color="purple"
        />
        <StatCard
          title="Unread Messages"
          value={stats.newMessages}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
          href="/admin/messages"
          color="gold"
        />
        <StatCard
          title="New Users (24h)"
          value={stats.onlineCustomers}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /><path d="M9 21v-2a4 4 0 0 0-4-4H1a4 4 0 0 0-4 4v2" /></svg>}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue || 0).toLocaleString()}`}
          icon={<span style={{ fontSize: '18px', fontWeight: 600 }}>$</span>}
          isRevenue
        />
      </div>

      {/* Main Grid: Recent Activities (Left) + Sales/Actions (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2.1fr 1fr',
        gap: '28px',
        alignItems: 'start',
        marginBottom: '32px',
      }}>
        
        {/* Recent Activities */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(26,18,9,0.08)',
          borderRadius: '16px',
          padding: '28px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid rgba(26,18,9,0.05)' }}>
            <h3 style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              color: '#1a1209',
              margin: 0,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Live Recent Activities
            </h3>
            <span style={{ 
              fontSize: '9px', 
              fontWeight: 600,
              backgroundColor: 'rgba(139,105,20,0.08)',
              color: '#8B6914', 
              padding: '4px 10px',
              borderRadius: '20px',
              letterSpacing: '0.05em' 
            }}>
              DATABASE SYNCED
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
            {activities.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '20px',
                bottom: '20px',
                left: '25px',
                width: '1.5px',
                background: 'rgba(139,105,20,0.12)',
                zIndex: 1,
              }} />
            )}

            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(26,18,9,0.45)', fontSize: '13.5px' }}>
                No recent database activities logged
              </div>
            ) : (
              activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>
        </div>

        {/* Sales Overview + Quick Actions Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Sales Chart Card */}
          <div style={{
            background: '#fff',
            border: '1px solid rgba(26,18,9,0.08)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: '#1a1209',
                margin: 0,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                Sales Overview
              </h3>
              <select style={{
                background: 'transparent',
                border: '1px solid rgba(26,18,9,0.1)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#1a1209',
                fontFamily: "'Jost', sans-serif",
                outline: 'none',
              }}>
                <option>This Month</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 600, color: '#1a1209', fontFamily: "'Cormorant Garamond', serif" }}>
                ${(stats.totalRevenue || 0).toLocaleString()}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Total Revenue <span style={{ background: 'rgba(46,204,113,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>↑ 12.5%</span>
              </p>
            </div>

            {/* Custom SVG Line Chart */}
            <div style={{ width: '100%', height: '150px' }}>
              <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c9a14a" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#c9a14a" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Gridlines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(26,18,9,0.04)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="65" x2="480" y2="65" stroke="rgba(26,18,9,0.04)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="rgba(26,18,9,0.04)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="130" x2="480" y2="130" stroke="rgba(26,18,9,0.08)" strokeWidth="1.5" />

                {/* Fill area */}
                {chartData.fillPath && (
                  <path d={chartData.fillPath} fill="url(#salesGrad)" />
                )}

                {/* Core Line */}
                {chartData.linePath && (
                  <path 
                    d={chartData.linePath} 
                    fill="none" 
                    stroke="#c9a14a" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                )}

                {/* X labels (Dates) */}
                {stats.salesOverview && stats.salesOverview.map((d, i) => {
                  if (i % 4 !== 0 && i !== stats.salesOverview.length - 1) return null;
                  const x = 40 + (i * (440 / (stats.salesOverview.length - 1)));
                  return (
                    <text 
                      key={i} 
                      x={x} 
                      y="145" 
                      textAnchor="middle" 
                      fill="rgba(26,18,9,0.4)" 
                      fontSize="9px"
                      fontFamily="'Jost', sans-serif"
                    >
                      {d.date}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: '#fff',
            border: '1px solid rgba(26,18,9,0.08)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
          }}>
            <h3 style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              color: '#1a1209',
              margin: '0 0 20px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(26,18,9,0.05)'
            }}>
              Quick Actions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Add New Product', href: '/admin/products/new', color: '#8B6914', icon: '📦' },
                { label: 'Process Orders', href: '/admin/orders', color: '#3498db', icon: '💼' },
                { label: 'Review Applications', href: '/admin/careers/applications', color: '#9b59b6', icon: '📄' },
                { label: 'Manage Inventory', href: '/admin/inventory', color: '#2ecc71', icon: '🛡️' },
                { label: 'View Messages', href: '/admin/messages', color: '#e74c3c', icon: '💬' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="quick-action-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(26,18,9,0.02)',
                    border: `1px solid rgba(26,18,9,0.04)`,
                    borderLeft: `4px solid ${action.color}`,
                    borderRadius: '8px',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px' }}>{action.icon}</span>
                    <span style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: '13px',
                      color: '#1a1209',
                      fontWeight: 500,
                    }}>
                      {action.label}
                    </span>
                  </div>
                  <span style={{ color: action.color, fontSize: '13px' }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Rows (Donut, Top Products, System Status) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1.1fr',
        gap: '28px',
        alignItems: 'start',
      }}>
        
        {/* Orders Overview (Donut Chart) */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(26,18,9,0.08)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
          minHeight: '260px',
        }}>
          <h3 style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            color: '#1a1209',
            margin: '0 0 20px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(26,18,9,0.05)'
          }}>
            Orders Overview
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* SVG Donut */}
            <div style={{ width: '100px', height: '100px', position: 'relative', flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(26,18,9,0.03)" strokeWidth="3" />
                
                {/* Completed Arc */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.915" 
                  fill="none" 
                  stroke="#2ecc71" 
                  strokeWidth="3.2" 
                  strokeDasharray={`${completedPct} ${100 - completedPct}`} 
                  strokeDashoffset="25" 
                />
                
                {/* Processing Arc */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.915" 
                  fill="none" 
                  stroke="#e67e22" 
                  strokeWidth="3.2" 
                  strokeDasharray={`${processingPct} ${100 - processingPct}`} 
                  strokeDashoffset={25 - completedPct} 
                />

                {/* Pending Arc */}
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.915" 
                  fill="none" 
                  stroke="#c9a14a" 
                  strokeWidth="3.2" 
                  strokeDasharray={`${pendingPct} ${100 - pendingPct}`} 
                  strokeDashoffset={25 - completedPct - processingPct} 
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '18px', fontWeight: 600, fontFamily: "'Cormorant Garamond', serif" }}>
                  {totalOrders}
                </span>
                <span style={{ fontSize: '8px', color: 'rgba(26,18,9,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Orders
                </span>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71', flexShrink: 0 }} />
                <span style={{ color: 'rgba(26,18,9,0.6)' }}>Completed:</span>
                <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{completedCount} ({completedPct}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e67e22', flexShrink: 0 }} />
                <span style={{ color: 'rgba(26,18,9,0.6)' }}>Processing:</span>
                <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{processingCount} ({processingPct}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c9a14a', flexShrink: 0 }} />
                <span style={{ color: 'rgba(26,18,9,0.6)' }}>Pending:</span>
                <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{pendingCount} ({pendingPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(26,18,9,0.08)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
          minHeight: '260px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(26,18,9,0.05)' }}>
            <h3 style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              color: '#1a1209',
              margin: 0,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Top Products
            </h3>
            <select style={{
              background: 'transparent',
              border: 'none',
              fontSize: '11px',
              color: 'rgba(26,18,9,0.5)',
              fontFamily: "'Jost', sans-serif",
              outline: 'none',
              cursor: 'pointer',
            }}>
              <option>This Month</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
                    <img src={p.thumbnail} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: '#1a1209', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#8B6914', fontFamily: "'Cormorant Garamond', serif" }}>
                    ${p.sales.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', fontSize: '12px', color: 'rgba(26,18,9,0.45)' }}>
                No sales volume recorded yet
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(26,18,9,0.08)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
          minHeight: '260px',
        }}>
          <h3 style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            color: '#1a1209',
            margin: '0 0 20px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(26,18,9,0.05)'
          }}>
            System Status
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#2ecc71',
              boxShadow: '0 0 8px #2ecc7170'
            }} />
            <span style={{ fontSize: '13px', color: '#1a1209', fontWeight: 500 }}>All services online & synced</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(26,18,9,0.5)' }}>Database</span>
              <span style={{ color: '#2ecc71', fontWeight: 600 }}>Online</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(26,18,9,0.5)' }}>Server</span>
              <span style={{ color: '#2ecc71', fontWeight: 600 }}>Online</span>
            </div>
            
            {/* Storage Progress Bar */}
            <div style={{ marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'rgba(26,18,9,0.5)' }}>Storage</span>
                <span style={{ fontWeight: 600 }}>68%</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '68%', height: '100%', background: '#c9a14a' }} />
              </div>
            </div>

            <p style={{ fontSize: '10px', color: 'rgba(26,18,9,0.4)', margin: '14px 0 0', fontFamily: "'Jost', sans-serif" }}>
              Last sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

      </div>

      <style>{`
        .quick-action-link:hover {
          background: rgba(139,105,20,0.04) !important;
          border-color: rgba(139,105,20,0.2) !important;
          transform: translateX(4px);
        }
        @keyframes arrowSlide { 0% { opacity: 0; transform: translateX(-4px); } 100% { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}