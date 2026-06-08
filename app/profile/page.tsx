'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import toast from 'react-hot-toast';

const COUNTRIES = [
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'RU', name: 'Russia' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'MV', name: 'Maldives' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'JP', name: 'Japan' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'QA', name: 'Qatar' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'KR', name: 'South Korea' },
];

const DIAL_CODES = [
  { code: '+94', label: 'LK (+94)' },
  { code: '+1', label: 'US (+1)' },
  { code: '+1', label: 'CA (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+33', label: 'FR (+33)' },
  { code: '+49', label: 'DE (+49)' },
  { code: '+7', label: 'RU (+7)' },
  { code: '+86', label: 'CN (+86)' },
  { code: '+91', label: 'IN (+91)' },
  { code: '+960', label: 'MV (+960)' },
  { code: '+61', label: 'AU (+61)' },
  { code: '+64', label: 'NZ (+64)' },
  { code: '+41', label: 'CH (+41)' },
  { code: '+852', label: 'HK (+852)' },
  { code: '+65', label: 'SG (+65)' },
  { code: '+60', label: 'MY (+60)' },
  { code: '+62', label: 'ID (+62)' },
  { code: '+81', label: 'JP (+81)' },
  { code: '+971', label: 'AE (+971)' },
  { code: '+974', label: 'QA (+974)' },
  { code: '+966', label: 'SA (+966)' },
  { code: '+82', label: 'KR (+82)' },
];

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    mobileCode: '+94',
    mobile: '',
    country: 'LK',
    address: '',
    city: '',
    postalCode: '',
  });

  // Fetch customer details from MongoDB
  useEffect(() => {
    if (!isSignedIn) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/customer/profile');
        const data = await res.json();
        
        if (data.success && data.data) {
          setFormData({
            mobileCode: data.data.mobileCode || '+94',
            mobile: data.data.mobile || '',
            country: data.data.country || 'LK',
            address: data.data.address || '',
            city: data.data.city || '',
            postalCode: data.data.postalCode || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile details', err);
        toast.error('Could not load profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isSignedIn]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        email: user.primaryEmailAddress?.emailAddress,
        profileImage: user.imageUrl,
        ...formData,
      };

      const res = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Profile details saved successfully! ✨');
      } else {
        throw new Error(data.error || 'Failed to save profile');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not save profile details.');
    } finally {
      setSaving(false);
    }
  };

  // 1. Clerk Loading State
  if (!isLoaded) {
    return (
      <div style={loadingWrapperStyle}>
        <div style={spinnerStyle} />
      </div>
    );
  }

  // 2. Unauthenticated State (Access Restriction Screen)
  if (!isSignedIn) {
    return (
      <div style={pageContainerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <h1 style={titleStyle}>SECURE PROFILE ACCESS</h1>
            <p style={subtitleStyle}>
              To view and complete your personal profile details, please sign in to your Winsor account.
            </p>
            <div style={{ marginTop: '28px' }}>
              <SignInButton mode="modal">
                <button style={primaryButtonStyle}>
                  SIGN IN WITH CLERK
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Form State
  return (
    <div style={pageContainerStyle}>
      <div style={cardStyle}>
        {/* Profile Avatar Header */}
        <div style={profileHeaderStyle}>
          <div style={avatarContainerStyle}>
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" style={avatarStyle} />
            ) : (
              <div style={avatarFallbackStyle}>{user.firstName?.charAt(0) || 'U'}</div>
            )}
          </div>
          <h1 style={titleStyle}>{user.fullName || 'CUSTOMER PROFILE'}</h1>
          <p style={badgeStyle}>WINSOR PATRON</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
            <div style={spinnerStyle} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={formStyle}>
            {/* Synchronized Email (Read Only) */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>
                EMAIL ADDRESS <span style={syncLabelStyle}>(SYNCED WITH CLERK)</span>
              </label>
              <div style={disabledInputWrapperStyle}>
                <input
                  type="email"
                  value={user.primaryEmailAddress?.emailAddress || ''}
                  disabled
                  style={disabledInputStyle}
                />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,9,0.35)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '14px' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>

            {/* Mobile & Country row */}
            <div style={rowStyle}>
              <div style={{ ...formGroupStyle, flex: 1, minWidth: '280px' }}>
                <label style={labelStyle}>MOBILE NUMBER</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    name="mobileCode"
                    value={formData.mobileCode}
                    onChange={handleInputChange}
                    style={selectCodeStyle}
                  >
                    {DIAL_CODES.map((dc, index) => (
                      <option key={`${dc.code}-${index}`} value={dc.code}>
                        {dc.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="77 123 4567"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ ...formGroupStyle, flex: 1, minWidth: '240px' }}>
                <label style={labelStyle}>COUNTRY</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  style={selectStyle}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Home Address */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>HOME ADDRESS</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address, Suite, Apartment number"
                style={inputStyle}
                required
              />
            </div>

            {/* City & Postal Code row */}
            <div style={rowStyle}>
              <div style={{ ...formGroupStyle, flex: 1, minWidth: '240px' }}>
                <label style={labelStyle}>CITY / TOWN</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Colombo"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={{ ...formGroupStyle, flex: 1, minWidth: '240px' }}>
                <label style={labelStyle}>POSTAL CODE</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="e.g. 00100"
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              style={{
                ...primaryButtonStyle,
                marginTop: '10px',
                opacity: saving ? 0.75 : 1,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'SAVING PROFILE DETAILS…' : 'SAVE PROFILE DETAILS'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Styling Constants
const loadingWrapperStyle: React.CSSProperties = {
  minHeight: '80vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#faf7f0',
};

const spinnerStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '2px solid rgba(139,105,20,0.12)',
  borderTop: '2px solid #8B6914',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const pageContainerStyle: React.CSSProperties = {
  background: '#faf7f0',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '140px 20px 60px 20px',
};

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(26,18,9,0.06)',
  boxShadow: '0 12px 36px rgba(26,18,9,0.04)',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '640px',
  padding: '40px',
  boxSizing: 'border-box',
};

const profileHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '32px',
  borderBottom: '1px solid rgba(26,18,9,0.05)',
  paddingBottom: '24px',
};

const avatarContainerStyle: React.CSSProperties = {
  width: '84px',
  height: '84px',
  borderRadius: '50%',
  border: '2px solid #8B6914',
  padding: '3px',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#faf7f0',
};

const avatarStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
};

const avatarFallbackStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  background: '#8B6914',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Jost', sans-serif",
  fontSize: '28px',
  fontWeight: 500,
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: '24px',
  fontWeight: 600,
  color: '#1a1209',
  letterSpacing: '0.12em',
  margin: '0 0 6px 0',
  textTransform: 'uppercase',
  textAlign: 'center',
};

const subtitleStyle: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  fontSize: '13px',
  color: 'rgba(26,18,9,0.6)',
  lineHeight: '1.6',
  maxWidth: '460px',
  margin: '0 auto',
};

const badgeStyle: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  fontSize: '9px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  color: '#8B6914',
  margin: 0,
  border: '1px solid rgba(139,105,20,0.25)',
  padding: '3px 10px',
  borderRadius: '3px',
  background: 'rgba(139,105,20,0.03)',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
};

const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '7px',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '18px',
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  fontSize: '10px',
  fontWeight: 500,
  color: 'rgba(26,18,9,0.48)',
  letterSpacing: '0.15em',
};

const syncLabelStyle: React.CSSProperties = {
  color: '#8B6914',
  fontSize: '9px',
  fontWeight: 400,
};

const inputStyle: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  fontSize: '13.5px',
  color: '#1a1209',
  background: 'transparent',
  border: '1px solid rgba(26,18,9,0.12)',
  borderRadius: '5px',
  padding: '12px 16px',
  outline: 'none',
  transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
  boxSizing: 'border-box',
  width: '100%',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231a1209' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 16px center',
  backgroundSize: '16px',
  cursor: 'pointer',
  paddingRight: '40px',
};

const selectCodeStyle: React.CSSProperties = {
  ...selectStyle,
  width: '110px',
  flexShrink: 0,
  paddingLeft: '12px',
  paddingRight: '28px',
  backgroundPosition: 'right 8px center',
  backgroundSize: '12px',
};

const disabledInputWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(26,18,9,0.02)',
  border: '1px solid rgba(26,18,9,0.06)',
  borderRadius: '5px',
};

const disabledInputStyle: React.CSSProperties = {
  ...inputStyle,
  border: 'none',
  background: 'transparent',
  color: 'rgba(26,18,9,0.48)',
  cursor: 'not-allowed',
};

const primaryButtonStyle: React.CSSProperties = {
  background: '#8B6914',
  border: '1px solid #8B6914',
  color: '#ffffff',
  padding: '14px 28px',
  fontFamily: "'Jost', sans-serif",
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  borderRadius: '4px',
  transition: 'all 0.25s ease',
  width: '100%',
};
