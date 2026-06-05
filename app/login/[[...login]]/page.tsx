import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#faf7f0',
      padding: '120px 24px 60px',
      fontFamily: "'Jost', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <SignIn 
          appearance={{
            variables: {
              colorPrimary: '#8B6914',
              colorBackground: '#faf7f0',
              colorText: '#1a1209',
              fontFamily: "'Jost', sans-serif",
            },
            elements: {
              card: {
                border: '1px solid rgba(139,105,20,0.15)',
                boxShadow: '0 12px 40px rgba(26,18,9,0.05)',
                borderRadius: '8px',
                background: '#faf7f0',
              },
              headerTitle: {
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '28px',
                fontWeight: 600,
                color: '#1a1209',
                letterSpacing: '0.04em',
              },
              headerSubtitle: {
                color: 'rgba(26,18,9,0.5)',
                fontSize: '13px',
              },
              socialButtonsBlockButton: {
                border: '1px solid rgba(26,18,9,0.15)',
                borderRadius: '6px',
                '&:hover': {
                  background: 'rgba(139,105,20,0.04)',
                  borderColor: '#8B6914',
                }
              },
              formFieldInput: {
                borderRadius: '6px',
                border: '1px solid rgba(26,18,9,0.15)',
                '&:focus': {
                  borderColor: '#8B6914',
                }
              },
              footerActionLink: {
                color: '#8B6914',
                '&:hover': {
                  color: '#1a1209',
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
}
