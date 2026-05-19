    // ✅ Minimal layout for login page - NO auth check
export default function AuthLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <>{children}</>;
}