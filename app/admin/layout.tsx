import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAccessToken } from '@/lib/jwt';
import { Toaster } from 'react-hot-toast';
import SidebarClientWrapper from '@/components/Admin/SidebarClientWrapper';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // ✅ SERVER-SIDE AUTH CHECK
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('admin_access_token')?.value;

  if (!accessToken) {
    redirect('/admin/login');
  }

  const payload = verifyAccessToken(accessToken);
  
  if (!payload) {
    redirect('/admin/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#faf7f0' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1209',
            color: '#f3e3b8',
            border: '1px solid rgba(201,161,74,0.3)',
            fontSize: '13px',
            fontFamily: "'Jost', sans-serif",
          },
          success: { iconTheme: { primary: '#8B6914', secondary: '#1a1209' } },
          error: { iconTheme: { primary: '#dc3232', secondary: '#1a1209' } },
        }}
      />
      
      <SidebarClientWrapper />
      
      <main style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width, 260px)',
        padding: 'var(--main-padding, 24px 32px)',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease',
        minHeight: '100vh',
        boxSizing: 'border-box',
        width: '100%',
        overflowX: 'hidden'
      }}>
        {children}
      </main>
    </div>
  );
}