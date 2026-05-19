// components/Admin/SidebarClientWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';

export default function SidebarClientWrapper() {
  const [adminData, setAdminData] = useState<{ name?: string; role?: 'admin' | 'staff' }>({});
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
        
        // ✅ Handle 401 Unauthorized
        if (profileRes.status === 401 || statsRes.status === 401) {
          setIsAuthenticated(false);
          router.push('/admin/login');
          return;
        }

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setAdminData({ name: profile.username, role: profile.role });
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

  // ✅ Show nothing while loading or if not authenticated
  if (isLoading || !isAuthenticated || !SidebarComp) {
    return null;
  }
  
  return (
    <SidebarComp 
      adminName={adminData.name} 
      adminRole={adminData.role} 
      stats={stats} 
    />
  );
}