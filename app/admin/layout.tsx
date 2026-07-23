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
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#faf7f0',
      backgroundImage: 'linear-gradient(rgba(250, 247, 240, 0.93), rgba(250, 247, 240, 0.93)), url(/hero_bg_marble.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
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