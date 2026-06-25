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
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Recently';
  }
};

// ── Stat Card Component ────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.JSX.Element;
  trend?: { value: number; positive: boolean };
  href?: string;
  color?: 'gold' | 'blue' | 'green' | 'red' | 'purple';
}

const StatCard = ({ title, value, icon, trend, href, color = 'gold' }: StatCardProps): React.JSX.Element => {
  const [hovered, setHovered] = useState(false);
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    gold: { bg: 'rgba(139,105,20,0.06)', border: 'rgba(139,105,20,0.12)', text: '#8B6914' },
    blue: { bg: 'rgba(52,152,219,0.06)', border: 'rgba(52,152,219,0.12)', text: '#3498db' },
    green: { bg: 'rgba(46,204,113,0.06)', border: 'rgba(46,204,113,0.12)', text: '#2ecc71' },
    red: { bg: 'rgba(231,76,60,0.06)', border: 'rgba(231,76,60,0.12)', text: '#e74c3c' },
    purple: { bg: 'rgba(155,89,182,0.06)', border: 'rgba(155,89,182,0.12)', text: '#9b59b6' },
  };
  const colors = colorMap[color];

  const Content = (
    <div 
      style={{
        background: '#fff',
        border: hovered ? `1px solid ${colors.text}` : `1px solid ${colors.border}`,
        borderRadius: '14px',
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        cursor: href ? 'pointer' : 'default',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 28px rgba(26,18,9,0.05)' : '0 2px 8px rgba(0,0,0,0.01)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Decorative Gold Accent Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: hovered ? colors.text : 'transparent',
        transition: 'background 0.3s ease',
      }} />

      <div style={{
        width: '46px',
        height: '46px',
        borderRadius: '12px',
        background: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.text,
        flexShrink: 0,
        border: `1.5px solid ${colors.border}`,
        transition: 'all 0.3s ease',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.15em',
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
          margin: '6px 0 0',
          lineHeight: 1.05,
          letterSpacing: '-0.01em',
        }}>
          {value}
        </p>
        {trend && (
          <p style={{
            fontSize: '11px',
            color: trend.positive ? '#27ae60' : '#e74c3c',
            margin: '8px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: "'Jost', sans-serif",
          }}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last week
          </p>
        )}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{Content}</Link>
  ) : Content;
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
        padding: '16px 20px',
        borderBottom: '1px solid rgba(26,18,9,0.04)',
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
          width: '12px',
          height: '12px',
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
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            fontSize: '9.5px',
            fontFamily: "'Jost', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '2px 8px',
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
          fontSize: '13.5px',
          color: '#1a1209',
          margin: 0,
          lineHeight: 1.45,
        }}>
          <strong style={{ fontWeight: 600, color: '#1a1209' }}>{activity.user}</strong>{' '}
          <span style={{ color: 'rgba(26,18,9,0.7)' }}>{activity.action}</span>{' '}
          <strong style={{ fontWeight: 500, color: '#8B6914' }}>{activity.target}</strong>
        </p>
      </div>

      {/* Slide Arrow indicator on hover */}
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

  // Current formatted date to display on welcome banner
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", padding: '10px 0' }}>
      
      {/* Executive Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1209 0%, #2c1d0e 100%)',
        border: '1px solid rgba(201,161,74,0.3)',
        borderRadius: '16px',
        padding: isMobile ? '24px 20px' : '32px 40px',
        color: '#f3e3b8',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(26,18,9,0.15), inset 0 0 40px rgba(139,105,20,0.05)',
      }}>
        {/* Decorative background watch silhouette logo */}
        <div style={{
          position: 'absolute',
          right: '-20px',
          bottom: '-20px',
          opacity: 0.04,
          pointerEvents: 'none',
          color: '#f3e3b8',
        }}>
          <svg width="240" height="240" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.2em',
              color: '#8B6914',
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
          <div style={{
            background: 'rgba(139, 105, 20, 0.12)',
            border: '1px solid rgba(201, 161, 74, 0.25)',
            padding: '10px 16px',
            borderRadius: '10px',
            backdropFilter: 'blur(4px)',
          }}>
            <p style={{
              margin: 0,
              fontSize: '11px',
              fontWeight: 500,
              color: '#8B6914',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Current Date
            </p>
            <p style={{
              margin: '4px 0 0',
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '16px',
              color: '#f3e3b8',
              fontWeight: 500
            }}>
              {todayFormatted}
            </p>
          </div>
        </div>
      </div>

      {/* Indicators Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
      }}>
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          href="/admin/products"
          color="gold"
        />
        <StatCard
          title="Registered Customers"
          value={stats.totalCustomers.toLocaleString()}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
          href="/admin/customers"
          color="blue"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            </svg>
          }
          href="/admin/orders"
          color={stats.pendingOrders > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          }
          href="/admin/inventory"
          color={stats.lowStockItems > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Pending Careers"
          value={stats.jobApplications}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
          href="/admin/careers/applications"
          color="purple"
        />
        <StatCard
          title="Unread Messages"
          value={stats.newMessages}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
          href="/admin/messages"
          color={stats.newMessages > 0 ? 'red' : 'gold'}
        />
        <StatCard
          title="New Users (24h)"
          value={stats.onlineCustomers}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
              <circle cx="9" cy="7" r="4" />
              <path d="M9 21v-2a4 4 0 0 0-4-4H1a4 4 0 0 0-4 4v2" />
            </svg>
          }
          color="green"
        />
      </div>

      {/* Two Column Layout: Activities + Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2.1fr 1fr',
        gap: '28px',
        alignItems: 'start',
      }}>
        
        {/* Recent Activities Section */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(139,105,20,0.12)',
          borderRadius: '16px',
          padding: '28px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid rgba(26,18,9,0.05)' }}>
            <h3 style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '15px',
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
            {/* Timeline Vertical Connector line */}
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

        {/* Side Panel: Quick Actions + System Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Quick Actions */}
          <div style={{
            background: '#fff',
            border: '1px solid rgba(139,105,20,0.12)',
            borderRadius: '16px',
            padding: '28px 24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
          }}>
            <h3 style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              color: '#1a1209',
              margin: '0 0 24px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(26,18,9,0.05)'
            }}>
              Quick Actions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Add New Product', href: '/admin/products/new', color: '#8B6914' },
                { label: 'Process Orders', href: '/admin/orders?status=pending', color: '#3498db' },
                { label: 'Review Applications', href: '/admin/careers/applications', color: '#9b59b6' },
                { label: 'Manage Inventory', href: '/admin/inventory', color: '#2ecc71' },
                { label: 'View Messages', href: '/admin/messages', color: '#e74c3c' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'rgba(26,18,9,0.02)',
                    border: `1px solid rgba(139,105,20,0.06)`,
                    borderLeft: `4px solid ${action.color}`,
                    borderRadius: '8px',
                    textDecoration: 'none',
                    transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139,105,20,0.04)';
                    e.currentTarget.style.borderColor = '#8B6914';
                    e.currentTarget.style.transform = 'translateX(6px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(26,18,9,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(139,105,20,0.06)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <span style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '13px',
                    color: '#1a1209',
                    fontWeight: 600,
                  }}>
                    {action.label}
                  </span>
                  <span style={{ color: action.color, fontSize: '16px', fontWeight: 'bold' }}>→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* System Status Card */}
          <div style={{
            background: '#fff',
            border: '1px solid rgba(139,105,20,0.12)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
          }}>
            <p style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              color: 'rgba(26,18,9,0.5)',
              margin: '0 0 16px',
              textTransform: 'uppercase',
            }}>
              System Status
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#2ecc71',
                animation: 'pulse 2s infinite',
                boxShadow: '0 0 8px #2ecc7170'
              }} />
              <span style={{ fontSize: '13.5px', color: '#1a1209', fontWeight: 600 }}>All services online & synced</span>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(26,18,9,0.4)', margin: '12px 0 0', fontFamily: "'Jost', sans-serif" }}>
              Last sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.9); } }
        @keyframes arrowSlide { 0% { opacity: 0; transform: translateX(-4px); } 100% { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}