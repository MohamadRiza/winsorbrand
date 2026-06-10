'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
}

interface ProfileData {
  username: string;
  role: 'admin' | 'staff';
  permissions: string[];
  isTemporary: boolean;
  expiresAt?: string;
}

export default function PermissionGate({
  children,
  permission,
  permissions,
}: PermissionGateProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [expired, setExpired] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/me', { credentials: 'include' });
        
        if (res.status === 401) {
          // Redirect to appropriate login based on path
          const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/staff/login';
          router.push(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        const data = await res.json();

        if (res.status === 403 && data.expired) {
          setExpired(true);
          setLoading(false);
          return;
        }

        if (!res.ok || !data.success) {
          router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        setProfile(data);

        // Authorization Logic
        if (data.role === 'admin') {
          setAuthorized(true);
        } else if (data.role === 'staff') {
          // If temporary staff, check client-side expiry just in case
          if (data.isTemporary && data.expiresAt && new Date(data.expiresAt) < new Date()) {
            setExpired(true);
            setAuthorized(false);
          } else {
            // Check permissions
            let isPermitted = true;
            
            if (permission) {
              isPermitted = data.permissions.includes(permission);
            }
            
            if (permissions && permissions.length > 0) {
              isPermitted = permissions.every((p: string) => data.permissions.includes(p));
            }
            
            setAuthorized(isPermitted);
          }
        }
      } catch (err) {
        console.error('Permission Gate auth check failed:', err);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [permission, permissions, pathname, router]);

  // 1. Loading State (Premium Luxury Gold Spinner)
  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '80vh',
          fontFamily: "'Jost', sans-serif"
        }}
      >
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(139,105,20,0.15)',
          borderTopColor: '#8B6914',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#8B6914', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '16px', fontWeight: 500 }}>
          Verifying Credentials…
        </p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // 2. Account Expired State (Temporary Staff expiration)
  if (expired) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '80vh',
          padding: '24px',
          fontFamily: "'Jost', sans-serif"
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: '460px',
          background: '#fff',
          border: '1px solid rgba(220,50,50,0.3)',
          borderRadius: '16px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 12px 30px rgba(220,50,50,0.08)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(220,50,50,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc3232',
            margin: '0 auto 20px',
            fontSize: '32px'
          }}>
            ⏳
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '26px',
            fontWeight: 600,
            color: '#1a1209',
            margin: '0 0 12px'
          }}>
            Staff Account Expired
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'rgba(26,18,9,0.6)',
            lineHeight: '1.6',
            margin: '0 0 28px'
          }}>
            Your temporary staff account credentials have expired. Access to the administration portal is blocked until an administrator updates your access parameters.
          </p>
          <button
            onClick={() => router.push('/staff/login')}
            style={{
              padding: '12px 28px',
              backgroundColor: '#1a1209',
              border: 'none',
              borderRadius: '8px',
              color: '#faf7f0',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a2815'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1209'}
          >
            Go to Staff Login
          </button>
        </div>
      </div>
    );
  }

  // 3. Unauthorized State (Premium Access Denied UI)
  if (!authorized) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '80vh',
          padding: '24px',
          fontFamily: "'Jost', sans-serif"
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: '460px',
          background: '#fff',
          border: '1px solid rgba(201,161,74,0.3)',
          borderRadius: '16px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 12px 30px rgba(139,105,20,0.06)'
        }}>
          {/* Glowing Lock Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(139,105,20,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8B6914',
            margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '26px',
            fontWeight: 600,
            color: '#1a1209',
            margin: '0 0 12px'
          }}>
            Access Denied
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'rgba(26,18,9,0.6)',
            lineHeight: '1.6',
            margin: '0 0 28px'
          }}>
            Your account does not possess the permissions required to access this resource. Please contact your administrator if you require access to this section.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(26,18,9,0.15)',
                borderRadius: '8px',
                color: 'rgba(26,18,9,0.7)',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(26,18,9,0.4)';
                e.currentTarget.style.color = '#1a1209';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(26,18,9,0.15)';
                e.currentTarget.style.color = 'rgba(26,18,9,0.7)';
              }}
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1a1209',
                border: 'none',
                borderRadius: '8px',
                color: '#faf7f0',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a2815'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1209'}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized State (Render Page Content)
  return <>{children}</>;
}
