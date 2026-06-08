'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface CustomerData {
  _id: string;
  clerkId: string;
  email: string;
  mobileCode?: string;
  mobile?: string;
  profileImage?: string;
  country?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detail Modal/Drawer states
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch all customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/customers');
        const data = await res.json();
        if (data.success) {
          setCustomers(data.data || []);
          setFilteredCustomers(data.data || []);
        } else {
          throw new Error(data.error || 'Failed to fetch customers');
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Could not load customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers on search
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(c => 
      c.email.toLowerCase().includes(q) ||
      (c.mobile && c.mobile.toLowerCase().includes(q)) ||
      (c.country && c.country.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  // Metric aggregates
  const totalPatrons = customers.length;
  const domesticPatrons = customers.filter(c => c.country === 'LK').length;
  const globalPatrons = totalPatrons - domesticPatrons;

  const handleRowClick = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  return (
    <div style={pageContainerStyle}>
      {/* Font & Custom Keyframe imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        .ac-input:focus { border-color: #8B6914 !important; box-shadow: 0 0 0 1px rgba(139,105,20,0.15); }
        .ac-row { transition: background 0.18s ease; cursor: pointer; }
        .ac-row:hover { background: rgba(139,105,20,0.03) !important; }
        
        @media (max-width: 992px) {
          .ac-table-card { display: none !important; }
          .ac-mobile-grid { display: flex !important; }
        }
      `}</style>

      {/* Title Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>PATRON DIRECTORY</h1>
          <p style={subtitleStyle}>Manage and inspect registered customer profiles, shipping credentials, and order logs.</p>
        </div>
      </div>

      {/* Metrics Header */}
      <div style={metricsRowStyle}>
        <div style={metricCardStyle}>
          <p style={metricLabelStyle}>TOTAL PATRONS</p>
          <p style={metricValueStyle}>{totalPatrons}</p>
        </div>
        <div style={metricCardStyle}>
          <p style={metricLabelStyle}>DOMESTIC PATRONS (LK)</p>
          <p style={metricValueStyle}>{domesticPatrons}</p>
        </div>
        <div style={metricCardStyle}>
          <p style={metricLabelStyle}>GLOBAL PATRONS</p>
          <p style={metricValueStyle}>{globalPatrons}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
          <input
            type="text"
            className="ac-input"
            placeholder="Search patrons by email, mobile, country, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,9,0.38)" strokeWidth="1.8" style={searchIconStyle}>
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
      </div>

      {loading ? (
        <div style={loadingWrapperStyle}>
          <div style={spinnerStyle} />
          <p style={loadingTextStyle}>Retrieving directories…</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={emptyWrapperStyle}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,9,0.22)" strokeWidth="1" style={{ marginBottom: '14px' }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <p style={emptyTextStyle}>No patron directories found matching your criteria.</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="ac-table-card" style={tableCardStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={thStyle}>PATRON</th>
                  <th style={thStyle}>EMAIL ADDRESS</th>
                  <th style={thStyle}>MOBILE CONTACT</th>
                  <th style={thStyle}>LOCATION</th>
                  <th style={thStyle}>REGISTERED</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>ORDERS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c._id} className="ac-row" onClick={() => handleRowClick(c)} style={tableRowStyle}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={avatarContainerStyle}>
                          {c.profileImage ? (
                            <img src={c.profileImage} alt="Avatar" style={avatarStyle} />
                          ) : (
                            <div style={avatarFallbackStyle}>{c.email.charAt(0).toUpperCase()}</div>
                          )}
                        </div>
                        <span style={patronNameStyle}>{c.email.split('@')[0]}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={emailLinkStyle}>{c.email}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={textStyle}>
                        {c.mobileCode ? `${c.mobileCode} ` : ''}{c.mobile || '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={textStyle}>
                        {c.city ? `${c.city}, ` : ''}{c.country || '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={dateStyle}>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={orderBadgeStyle}>0 ORDERS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="ac-mobile-grid" style={mobileGridStyle}>
            {filteredCustomers.map((c) => (
              <div key={c._id} onClick={() => handleRowClick(c)} style={mobileCardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={avatarContainerStyle}>
                    {c.profileImage ? (
                      <img src={c.profileImage} alt="Avatar" style={avatarStyle} />
                    ) : (
                      <div style={avatarFallbackStyle}>{c.email.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div>
                    <h2 style={patronNameStyle}>{c.email.split('@')[0]}</h2>
                    <p style={{ ...dateStyle, margin: 0 }}>Registered: {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span style={{ ...orderBadgeStyle, marginLeft: 'auto' }}>0 ORDERS</span>
                </div>
                
                <div style={cardRowStyle}>
                  <span style={cardLabelStyle}>Email:</span>
                  <span style={{ ...textStyle, wordBreak: 'break-all' }}>{c.email}</span>
                </div>
                <div style={cardRowStyle}>
                  <span style={cardLabelStyle}>Mobile:</span>
                  <span>{c.mobileCode ? `${c.mobileCode} ` : ''}{c.mobile || '—'}</span>
                </div>
                <div style={cardRowStyle}>
                  <span style={cardLabelStyle}>Location:</span>
                  <span>{c.city ? `${c.city}, ` : ''}{c.country || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* DETAILS SLIDE-OUT DRAWER */}
      {drawerOpen && selectedCustomer && (
        <>
          {/* Overlay */}
          <div onClick={() => setDrawerOpen(false)} style={overlayStyle} />
          
          {/* Drawer Panel */}
          <div style={drawerPanelStyle}>
            <div style={drawerHeaderStyle}>
              <h2 style={drawerTitleStyle}>PATRON PROFILE DETAILS</h2>
              <button onClick={() => setDrawerOpen(false)} style={drawerCloseBtnStyle}>✕</button>
            </div>

            <div style={drawerBodyStyle}>
              {/* Profile Card Header */}
              <div style={drawerProfileCardStyle}>
                <div style={drawerAvatarContainerStyle}>
                  {selectedCustomer.profileImage ? (
                    <img src={selectedCustomer.profileImage} alt="Profile" style={drawerAvatarStyle} />
                  ) : (
                    <div style={drawerAvatarFallbackStyle}>{selectedCustomer.email.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <h3 style={drawerCustomerNameStyle}>{selectedCustomer.email.split('@')[0]}</h3>
                <p style={drawerCustomerSubStyle}>PATRON ID: {selectedCustomer._id}</p>
              </div>

              {/* Contact Credentials */}
              <div style={drawerSectionStyle}>
                <h4 style={sectionTitleStyle}>CONTACT CREDENTIALS</h4>
                <div style={detailsBoxStyle}>
                  <div style={detailFieldStyle}>
                    <span style={detailLabelStyle}>EMAIL ADDRESS</span>
                    <span style={detailValueStyle}>{selectedCustomer.email}</span>
                  </div>
                  <div style={detailFieldStyle}>
                    <span style={detailLabelStyle}>MOBILE CONTACT</span>
                    <span style={detailValueStyle}>
                      {selectedCustomer.mobileCode ? `${selectedCustomer.mobileCode} ` : ''}{selectedCustomer.mobile || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div style={drawerSectionStyle}>
                <h4 style={sectionTitleStyle}>SHIPPING ADDRESS</h4>
                <div style={detailsBoxStyle}>
                  <div style={detailFieldStyle}>
                    <span style={detailLabelStyle}>STREET ADDRESS</span>
                    <span style={detailValueStyle}>{selectedCustomer.address || '—'}</span>
                  </div>
                  <div style={detailFieldStyle}>
                    <span style={detailLabelStyle}>CITY / TOWN</span>
                    <span style={detailValueStyle}>{selectedCustomer.city || '—'}</span>
                  </div>
                  <div style={detailFieldStyle}>
                    <span style={detailLabelStyle}>POSTAL CODE</span>
                    <span style={detailValueStyle}>{selectedCustomer.postalCode || '—'}</span>
                  </div>
                  <div style={detailFieldStyle}>
                    <span style={detailLabelStyle}>COUNTRY</span>
                    <span style={detailValueStyle}>{selectedCustomer.country || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Orders Activity Log */}
              <div style={drawerSectionStyle}>
                <h4 style={sectionTitleStyle}>ORDERS ACTIVITY LOG</h4>
                <div style={ordersPlaceholderBoxStyle}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(201,161,74,0.4)" strokeWidth="1.5" style={{ marginBottom: '10px' }}>
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <p style={placeholderTitleStyle}>NO ORDERS RECORDED YET</p>
                  <p style={placeholderDescStyle}>
                    Patron has not placed any checkout items. Transaction history and shipping statuses will populate once payment modules are online.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Styling Declarations
const pageContainerStyle: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  color: '#1a1209',
  paddingTop: '10px',
  minHeight: '90vh',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderBottom: '1px solid rgba(139,105,20,0.15)',
  paddingBottom: '20px',
  marginBottom: '28px',
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: '32px',
  fontWeight: 600,
  color: '#8B6914',
  letterSpacing: '0.05em',
  margin: '0 0 6px 0',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '13.5px',
  color: 'rgba(26,18,9,0.6)',
  margin: 0,
};

const metricsRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '20px',
  marginBottom: '28px',
};

const metricCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(139,105,20,0.15)',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 4px 12px rgba(26,18,9,0.02)',
  boxSizing: 'border-box',
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.12em',
  color: '#8B6914',
  margin: '0 0 8px 0',
};

const metricValueStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: '32px',
  fontWeight: 600,
  color: '#1a1209',
  margin: 0,
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 16px 11px 40px',
  background: '#ffffff',
  border: '1px solid rgba(139,105,20,0.2)',
  borderRadius: '6px',
  outline: 'none',
  fontSize: '13px',
  color: '#1a1209',
  transition: 'all 0.22s ease',
  boxSizing: 'border-box',
};

const searchIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
};

const loadingWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '100px 0',
};

const loadingTextStyle: React.CSSProperties = {
  marginTop: '16px',
  fontSize: '13px',
  color: '#8B6914',
  letterSpacing: '0.08em',
};

const spinnerStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '2px solid rgba(139,105,20,0.12)',
  borderTop: '2px solid #8B6914',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const emptyWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#ffffff',
  border: '1px dashed rgba(139,105,20,0.25)',
  borderRadius: '8px',
  padding: '60px 20px',
  textAlign: 'center',
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(26,18,9,0.5)',
  margin: 0,
};

const tableCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(139,105,20,0.15)',
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(26,18,9,0.03)',
  overflow: 'hidden',
  display: 'block',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyle: React.CSSProperties = {
  background: '#1a1209',
  borderBottom: '1px solid rgba(139,105,20,0.25)',
};

const thStyle: React.CSSProperties = {
  padding: '14px 20px',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.12em',
  color: '#f3e3b8',
  textTransform: 'uppercase',
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(139,105,20,0.08)',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 20px',
  verticalAlign: 'middle',
};

const avatarContainerStyle: React.CSSProperties = {
  width: '34px',
  height: '34px',
  borderRadius: '50%',
  border: '1px solid rgba(139,105,20,0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#faf7f0',
  overflow: 'hidden',
  flexShrink: 0,
};

const avatarStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const avatarFallbackStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: '#8B6914',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: 500,
};

const patronNameStyle: React.CSSProperties = {
  fontSize: '13.5px',
  fontWeight: 600,
  color: '#1a1209',
  textTransform: 'capitalize',
};

const emailLinkStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#8B6914',
  fontWeight: 500,
};

const textStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(26,18,9,0.8)',
};

const dateStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(26,18,9,0.5)',
};

const orderBadgeStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: '#8B6914',
  border: '1px solid rgba(139,105,20,0.22)',
  borderRadius: '3px',
  padding: '2px 8px',
  background: 'rgba(139,105,20,0.02)',
  display: 'inline-block',
};

const mobileGridStyle: React.CSSProperties = {
  display: 'none',
  flexDirection: 'column',
  gap: '16px',
};

const mobileCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(139,105,20,0.15)',
  borderRadius: '8px',
  padding: '18px',
  boxShadow: '0 4px 12px rgba(26,18,9,0.02)',
  boxSizing: 'border-box',
  cursor: 'pointer',
};

const cardRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12.5px',
  padding: '6px 0',
  borderBottom: '1px solid rgba(26,18,9,0.03)',
};

const cardLabelStyle: React.CSSProperties = {
  color: 'rgba(26,18,9,0.45)',
  fontWeight: 500,
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(26, 18, 9, 0.45)',
  backdropFilter: 'blur(3px)',
  zIndex: 100,
};

const drawerPanelStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: '460px',
  maxWidth: '90%',
  background: '#faf7f0',
  boxShadow: '-8px 0 32px rgba(26,18,9,0.16)',
  zIndex: 101,
  display: 'flex',
  flexDirection: 'column',
  animation: 'slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
};

const drawerHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px',
  borderBottom: '1px solid rgba(139,105,20,0.18)',
  background: '#1a1209',
  color: '#f3e3b8',
};

const drawerTitleStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: '18px',
  fontWeight: 600,
  margin: 0,
  letterSpacing: '0.08em',
};

const drawerCloseBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(243,227,184,0.6)',
  fontSize: '18px',
  transition: 'color 0.2s ease',
};

const drawerBodyStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const drawerProfileCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(139,105,20,0.12)',
  borderRadius: '8px',
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: '0 4px 12px rgba(26,18,9,0.02)',
};

const drawerAvatarContainerStyle: React.CSSProperties = {
  width: '74px',
  height: '74px',
  borderRadius: '50%',
  border: '2px solid #8B6914',
  padding: '3px',
  marginBottom: '14px',
  background: '#faf7f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const drawerAvatarStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
};

const drawerAvatarFallbackStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  background: '#8B6914',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  fontWeight: 500,
};

const drawerCustomerNameStyle: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 600,
  margin: '0 0 4px 0',
  textTransform: 'capitalize',
};

const drawerCustomerSubStyle: React.CSSProperties = {
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: 'rgba(26,18,9,0.4)',
  margin: 0,
  textTransform: 'uppercase',
};

const drawerSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 600,
  letterSpacing: '0.12em',
  color: '#8B6914',
  margin: 0,
};

const detailsBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(26,18,9,0.06)',
  borderRadius: '6px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const detailFieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 500,
  letterSpacing: '0.08em',
  color: 'rgba(26,18,9,0.4)',
};

const detailValueStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#1a1209',
};

const ordersPlaceholderBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px dashed rgba(139,105,20,0.2)',
  borderRadius: '6px',
  padding: '30px 16px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const placeholderTitleStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: '#c9a14a',
  margin: '0 0 6px 0',
};

const placeholderDescStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(26,18,9,0.5)',
  lineHeight: '1.5',
  margin: 0,
};
