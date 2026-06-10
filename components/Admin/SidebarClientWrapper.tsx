// components/Admin/SidebarClientWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { getUpcomingOccasions, SpecialOccasion } from '@/lib/occasionHelper';

export default function SidebarClientWrapper() {
  const [adminData, setAdminData] = useState<{ name?: string; role?: 'admin' | 'staff'; permissions?: string[] }>({});
  const [stats, setStats] = useState({
    pendingOrders: 0,
    newMessages: 0,
    lowStockItems: 0,
    jobApplications: 0,
  });
  const [SidebarComp, setSidebarComp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const router = useRouter();

  // Occasion Reminder Modal state
  const [occasions, setOccasions] = useState<SpecialOccasion[]>([]);
  const [showOccasionModal, setShowOccasionModal] = useState(false);

  // Dynamically import Sidebar
  useEffect(() => {
    import('./Sidebar').then(mod => setSidebarComp(() => mod.default));
  }, []);

  // Fetch admin profile & stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/admin/me', { credentials: 'include' }),
          fetch('/api/admin/dashboard/stats', { credentials: 'include' }),
        ]);
        
        // Handle 401 Unauthorized
        if (profileRes.status === 401 || statsRes.status === 401) {
          setIsAuthenticated(false);
          router.push('/admin/login');
          return;
        }

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setAdminData({ 
            name: profile.username, 
            role: profile.role,
            permissions: profile.permissions || []
          });
        }
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) {
            setStats(statsData.data || statsData);
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Poll for stats updates every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [router]);

  // Check for special occasions on mount
  useEffect(() => {
    const list = getUpcomingOccasions();
    if (list.length > 0) {
      const dismissed = sessionStorage.getItem('winsor_admin_occasions_dismissed');
      if (!dismissed) {
        setOccasions(list);
        setShowOccasionModal(true);
      }
    }
  }, []);

  const handleDismissOccasion = () => {
    setShowOccasionModal(false);
    sessionStorage.setItem('winsor_admin_occasions_dismissed', 'true');
  };

  const handleManageOccasions = () => {
    setShowOccasionModal(false);
    sessionStorage.setItem('winsor_admin_occasions_dismissed', 'true');
    router.push('/admin/products/categories');
  };

  // Show nothing while loading or if not authenticated
  if (isLoading || !isAuthenticated || !SidebarComp) {
    return null;
  }
  
  const currentOccasion = occasions[0];
  
  return (
    <>
      <SidebarComp 
        adminName={adminData.name} 
        adminRole={adminData.role} 
        permissions={adminData.permissions}
        stats={stats} 
      />

      {/* Occasion Reminder Modal */}
      {showOccasionModal && currentOccasion && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(26, 18, 9, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#1a1209',
            border: '1px solid rgba(201, 161, 74, 0.4)',
            borderRadius: '16px',
            padding: '32px 24px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(139, 105, 20, 0.1)',
            textAlign: 'center',
            fontFamily: "'Jost', sans-serif",
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}>
            {/* Pulsing Occasion Emoji */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '2px solid #8B6914',
              backgroundColor: 'rgba(139, 105, 20, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              margin: '0 auto 20px',
              boxShadow: '0 8px 20px rgba(139, 105, 20, 0.25)',
              userSelect: 'none',
            }}>
              {currentOccasion.emoji}
            </div>

            {/* Content Header */}
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '24px',
              fontWeight: 600,
              color: '#f3e3b8',
              margin: '0 0 4px',
              letterSpacing: '0.02em',
            }}>
              {currentOccasion.isToday ? 'Celebration Today!' : 'Upcoming Celebration'}
            </h2>
            
            <p style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#8B6914',
              margin: '0 0 20px',
            }}>
              {currentOccasion.label} — {currentOccasion.dateStr}
            </p>

            {/* Advice Text */}
            <p style={{
              fontSize: '13.5px',
              color: 'rgba(243, 227, 184, 0.85)',
              lineHeight: '1.6',
              margin: '0 0 28px',
              padding: '0 10px',
            }}>
              {currentOccasion.isToday 
                ? `Today is ${currentOccasion.label}! Please ensure that your storefront banner displays, product curations, and seasonal promotions are active for our visitors.`
                : `${currentOccasion.label} is coming up in ${currentOccasion.daysRemaining} days! Get ahead of the holiday by matching timepiece catalogs and updating related gift categories.`
              }
            </p>

            {/* Buttons Row */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDismissOccasion}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(243, 227, 184, 0.25)',
                  borderRadius: '8px',
                  color: 'rgba(243, 227, 184, 0.8)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: "'Jost', sans-serif",
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(243, 227, 184, 0.5)';
                  e.currentTarget.style.color = '#f3e3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(243, 227, 184, 0.25)';
                  e.currentTarget.style.color = 'rgba(243, 227, 184, 0.8)';
                }}
              >
                Dismiss
              </button>
              
              <button
                onClick={handleManageOccasions}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: '#8B6914',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#1a1209',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Jost', sans-serif",
                  transition: 'background-color 0.2s, transform 0.1s',
                  boxShadow: '0 4px 12px rgba(139, 105, 20, 0.3)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c9a14a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B6914'}
              >
                Configure
              </button>
            </div>
          </div>
          
          <style>{`
            @keyframes scaleUp {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}