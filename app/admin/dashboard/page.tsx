'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';


// Type alias for cleaner JSX usage
type JSXElement = React.JSX.Element;

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
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    gold: { bg: 'rgba(139,105,20,0.1)', border: 'rgba(139,105,20,0.3)', text: '#8B6914' },
    blue: { bg: 'rgba(52,152,219,0.1)', border: 'rgba(52,152,219,0.3)', text: '#3498db' },
    green: { bg: 'rgba(46,204,113,0.1)', border: 'rgba(46,204,113,0.3)', text: '#2ecc71' },
    red: { bg: 'rgba(231,76,60,0.1)', border: 'rgba(231,76,60,0.3)', text: '#e74c3c' },
    purple: { bg: 'rgba(155,89,182,0.1)', border: 'rgba(155,89,182,0.3)', text: '#9b59b6' },
  };
  const colors = colorMap[color];

  const Content = (
    <div style={{
      background: '#fff',
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: href ? 'pointer' : 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(26,18,9,0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '10px',
        background: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.text,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '11px',
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
          fontSize: '28px',
          fontWeight: 600,
          color: '#1a1209',
          margin: '4px 0 0',
          lineHeight: 1.1,
        }}>
          {value}
        </p>
        {trend && (
          <p style={{
            fontSize: '11px',
            color: trend.positive ? '#27ae60' : '#e74c3c',
            margin: '6px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
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
  const typeColors: Record<Activity['type'], string> = {
    order: '#3498db',
    product: '#8B6914',
    customer: '#2ecc71',
    message: '#9b59b6',
  };

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '14px 0',
      borderBottom: '1px solid rgba(26,18,9,0.06)',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: `${typeColors[activity.type]}15`,
        border: `2px solid ${typeColors[activity.type]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: typeColors[activity.type],
        fontSize: '14px',
        flexShrink: 0,
      }}>
        {activity.type === 'order' && '📦'}
        {activity.type === 'product' && '⌚'}
        {activity.type === 'customer' && '👤'}
        {activity.type === 'message' && '✉️'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '13px',
          color: '#1a1209',
          margin: 0,
          lineHeight: 1.4,
        }}>
          <strong style={{ fontWeight: 600 }}>{activity.user}</strong>{' '}
          {activity.action}{' '}
          <strong style={{ fontWeight: 500, color: '#8B6914' }}>{activity.target}</strong>
        </p>
        <p style={{
          fontSize: '11px',
          color: 'rgba(26,18,9,0.45)',
          margin: '4px 0 0',
          fontFamily: "'Jost', sans-serif",
        }}>
          {activity.time}
        </p>
      </div>
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
  const [loading, setLoading] = useState(true);
  const [activities] = useState<Activity[]>([
    { id: '1', user: 'Admin', action: 'updated product', target: 'Classic Chronograph', time: '2 min ago', type: 'product' },
    { id: '2', user: 'Customer #4821', action: 'placed order', target: '#ORD-2891', time: '18 min ago', type: 'order' },
    { id: '3', user: 'Nimal P.', action: 'submitted application', target: 'Sales Associate', time: '1 hr ago', type: 'customer' },
    { id: '4', user: 'System', action: 'low stock alert', target: 'Heritage Pilot (3 left)', time: '2 hrs ago', type: 'product' },
    { id: '5', user: 'Kasun D.', action: 'sent message', target: 'Warranty Inquiry', time: '3 hrs ago', type: 'message' },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/stats', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        if (data.success) setStats(data.data);
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

  return (
    <div style={{ fontFamily: "'Jost', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '32px',
          fontWeight: 600,
          color: '#1a1209',
          margin: 0,
          letterSpacing: '0.02em',
        }}>
          Dashboard
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'rgba(26,18,9,0.6)',
          margin: '8px 0 0',
        }}>
          Overview of your luxury timepiece business
        </p>
      </div>

      {/* Stats Grid */}
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          href="/admin/products"
          color="gold"
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers.toLocaleString()}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            </svg>
          }
          href="/admin/orders"
          color={stats.pendingOrders > 0 ? 'red' : 'green'}
          trend={stats.pendingOrders > 0 ? { value: 12, positive: false } : undefined}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          }
          href="/admin/inventory"
          color={stats.lowStockItems > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Job Applications"
          value={stats.jobApplications}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2" />
            </svg>
          }
          href="/admin/careers/applications"
          color="purple"
        />
        <StatCard
          title="New Messages"
          value={stats.newMessages}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
          href="/admin/messages"
          color={stats.newMessages > 0 ? 'red' : 'gold'}
        />
      </div>

      {/* Two Column Layout: Activities + Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
      }}>
        {/* Recent Activities */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(26,18,9,0.1)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              color: '#1a1209',
              margin: 0,
              letterSpacing: '0.05em',
            }}>
              Recent Activities
            </h3>
            <Link href="/admin/activities" style={{
              fontSize: '11px',
              color: '#8B6914',
              textDecoration: 'none',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              View All →
            </Link>
          </div>
          
          <div>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(26,18,9,0.1)',
          borderRadius: '12px',
          padding: '24px',
          height: 'fit-content',
        }}>
          <h3 style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '16px',
            fontWeight: 600,
            color: '#1a1209',
            margin: '0 0 20px',
            letterSpacing: '0.05em',
          }}>
            Quick Actions
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  padding: '14px 16px',
                  background: 'rgba(26,18,9,0.03)',
                  border: `1px solid ${action.color}20`,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${action.color}10`;
                  e.currentTarget.style.borderColor = action.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(26,18,9,0.03)';
                  e.currentTarget.style.borderColor = `${action.color}20`;
                }}
              >
                <span style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '13px',
                  color: '#1a1209',
                  fontWeight: 500,
                }}>
                  {action.label}
                </span>
                <span style={{ color: action.color, fontSize: '16px' }}>→</span>
              </Link>
            ))}
          </div>

          {/* System Status */}
          <div style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(26,18,9,0.08)',
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              color: 'rgba(26,18,9,0.5)',
              margin: '0 0 12px',
              textTransform: 'uppercase',
            }}>
              System Status
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#2ecc71',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: '12px', color: '#1a1209' }}>All systems operational</span>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(26,18,9,0.4)', margin: '8px 0 0' }}>
              Last sync: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}