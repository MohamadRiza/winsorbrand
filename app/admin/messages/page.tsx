'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface MessageData {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  subject: string;
  message: string;
  ipAddress: string;
  clerkId?: string;
  createdAt: string;
  isLoggedIn: boolean;
  profileImage?: string | null;
  read: boolean;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  
  // Detail Modal/Drawer states
  const [selectedMessage, setSelectedMessage] = useState<MessageData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch all messages
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messages');
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
        setFilteredMessages(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch messages');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Filter messages on search query and filter tab change
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    
    let result = messages;
    
    // 1. Filter by Tab
    if (filterTab === 'unread') {
      result = result.filter(m => !m.read);
    }
    
    // 2. Filter by Search Query
    if (q) {
      result = result.filter(m => 
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.mobile || '').toLowerCase().includes(q) ||
        (m.subject || '').toLowerCase().includes(q) ||
        (m.message || '').toLowerCase().includes(q)
      );
    }
    
    setFilteredMessages(result);
  }, [searchQuery, filterTab, messages]);

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !currentRead }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setMessages(prev => prev.map(m => m._id === id ? { ...m, read: !currentRead } : m));
        
        // Update selected message in drawer
        setSelectedMessage(prev => prev && prev._id === id ? { ...prev, read: !currentRead } : prev);
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not update status');
    }
  };

  const handleRowClick = (msg: MessageData) => {
    setSelectedMessage(msg);
    setDrawerOpen(true);
    
    // Automatically mark as read if it is unread when clicked
    if (!msg.read) {
      handleToggleRead(msg._id, false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this support message? This action is permanent.')) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Message deleted successfully.');
        setMessages(prev => prev.filter(m => m._id !== id));
        setDrawerOpen(false);
        setSelectedMessage(null);
      } else {
        throw new Error(data.error || 'Failed to delete message');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not delete message');
    } finally {
      setDeleting(false);
    }
  };

  // Metrics
  const totalInquiries = messages.length;
  const unreadInquiries = messages.filter(m => !m.read).length;
  const patronInquiries = messages.filter(m => m.isLoggedIn).length;
  const guestInquiries = totalInquiries - patronInquiries;

  return (
    <div style={pageContainerStyle}>
      {/* Font & Custom Keyframe imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        .msg-input:focus { border-color: #8B6914 !important; box-shadow: 0 0 0 1px rgba(139,105,20,0.15); }
        .msg-row { transition: background 0.18s ease; cursor: pointer; }
        .msg-row:hover { background: rgba(139,105,20,0.03) !important; }
        
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @media (max-width: 992px) {
          .msg-table-card { display: none !important; }
          .msg-mobile-grid { display: flex !important; }
        }
      `}</style>

      {/* Title Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>CUSTOMER SUPPORT INQUIRIES</h1>
          <p style={subtitleStyle}>Review, manage, and respond to patron and guest feedback submitted via Customer Care.</p>
        </div>
      </div>

      {/* Metrics Header */}
      <div style={metricsRowStyle}>
        <div style={metricCardStyle}>
          <p style={metricLabelStyle}>TOTAL INQUIRIES</p>
          <p style={metricValueStyle}>{totalInquiries}</p>
        </div>
        <div style={{ 
          ...metricCardStyle, 
          border: unreadInquiries > 0 ? '1px solid rgba(139,105,20,0.45)' : '1px solid rgba(139,105,20,0.15)', 
          background: unreadInquiries > 0 ? 'rgba(139,105,20,0.02)' : '#ffffff' 
        }}>
          <p style={metricLabelStyle}>UNREAD INQUIRIES</p>
          <p style={{ ...metricValueStyle, color: unreadInquiries > 0 ? '#8B6914' : '#1a1209' }}>
            {unreadInquiries}
            {unreadInquiries > 0 && (
              <span style={{ fontSize: '13px', color: '#8B6914', marginLeft: '6px', verticalAlign: 'middle' }}>●</span>
            )}
          </p>
        </div>
        <div style={metricCardStyle}>
          <p style={metricLabelStyle}>PATRON INQUIRIES</p>
          <p style={metricValueStyle}>{patronInquiries}</p>
        </div>
        <div style={metricCardStyle}>
          <p style={metricLabelStyle}>GUEST INQUIRIES</p>
          <p style={metricValueStyle}>{guestInquiries}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <input
            type="text"
            className="msg-input"
            placeholder="Search inquiries by name, email, mobile, content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,9,0.38)" strokeWidth="1.8" style={searchIconStyle}>
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        {/* Filter Tabs */}
        <div style={tabContainerStyle}>
          <button 
            onClick={() => setFilterTab('all')} 
            style={filterTab === 'all' ? activeTabStyle : inactiveTabStyle}
          >
            All Inquiries
          </button>
          <button 
            onClick={() => setFilterTab('unread')} 
            style={filterTab === 'unread' ? activeTabStyle : inactiveTabStyle}
          >
            Unread Only
            {unreadInquiries > 0 && <span style={tabBadgeStyle}>{unreadInquiries}</span>}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={loadingWrapperStyle}>
          <div style={spinnerStyle} />
          <p style={loadingTextStyle}>Retrieving inquiries…</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div style={emptyWrapperStyle}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(26,18,9,0.22)" strokeWidth="1" style={{ marginBottom: '14px' }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <p style={emptyTextStyle}>No customer care inquiries found matching your criteria.</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="msg-table-card" style={tableCardStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={thStyle}>SENDER</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>EMAIL ADDRESS</th>
                  <th style={thStyle}>MOBILE CONTACT</th>
                  <th style={thStyle}>SUBJECT</th>
                  <th style={thStyle}>RECEIVED DATE</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((m) => (
                  <tr key={m._id} className="msg-row" onClick={() => handleRowClick(m)} style={tableRowStyle}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={avatarContainerStyle}>
                          {m.profileImage ? (
                            <img src={m.profileImage} alt="Avatar" style={avatarStyle} />
                          ) : (
                            <div style={avatarFallbackStyle}>{m.name.charAt(0).toUpperCase()}</div>
                          )}
                        </div>
                        <span style={{ 
                          ...patronNameStyle, 
                          fontWeight: m.read ? 600 : 700,
                          color: m.read ? 'rgba(26,18,9,0.8)' : '#1a1209'
                        }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {m.isLoggedIn ? (
                        <span style={patronBadgeStyle}>PATRON</span>
                      ) : (
                        <span style={guestBadgeStyle}>GUEST</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={emailLinkStyle}>{m.email}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={textStyle}>{m.mobile}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!m.read && (
                          <span 
                            style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              background: '#8B6914', 
                              display: 'block', 
                              flexShrink: 0 
                            }} 
                            title="Unread Message" 
                          />
                        )}
                        <span style={{ 
                          ...textStyle, 
                          fontWeight: m.read ? 500 : 700, 
                          color: m.read ? 'rgba(26,18,9,0.7)' : '#1a1209' 
                        }}>
                          {m.subject}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={dateStyle}>{new Date(m.createdAt).toLocaleDateString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="msg-mobile-grid" style={mobileGridStyle}>
            {filteredMessages.map((m) => (
              <div key={m._id} onClick={() => handleRowClick(m)} style={mobileCardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={avatarContainerStyle}>
                    {m.profileImage ? (
                      <img src={m.profileImage} alt="Avatar" style={avatarStyle} />
                    ) : (
                      <div style={avatarFallbackStyle}>{m.name.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div>
                    <h2 style={{ 
                      ...patronNameStyle, 
                      fontWeight: m.read ? 600 : 700,
                      color: m.read ? 'rgba(26,18,9,0.8)' : '#1a1209'
                    }}>{m.name}</h2>
                    <p style={{ ...dateStyle, margin: 0 }}>Received: {new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!m.read && (
                      <span 
                        style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          background: '#8B6914', 
                          display: 'block' 
                        }} 
                      />
                    )}
                    {m.isLoggedIn ? (
                      <span style={patronBadgeStyle}>PATRON</span>
                    ) : (
                      <span style={guestBadgeStyle}>GUEST</span>
                    )}
                  </div>
                </div>
                
                <div style={cardRowStyle}>
                  <span style={cardLabelStyle}>Email:</span>
                  <span style={{ ...textStyle, wordBreak: 'break-all' }}>{m.email}</span>
                </div>
                <div style={cardRowStyle}>
                  <span style={cardLabelStyle}>Mobile:</span>
                  <span>{m.mobile}</span>
                </div>
                <div style={cardRowStyle}>
                  <span style={cardLabelStyle}>Subject:</span>
                  <span style={{ 
                    fontWeight: m.read ? 500 : 700,
                    color: m.read ? 'rgba(26,18,9,0.8)' : '#1a1209'
                  }}>{m.subject}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* DETAILS SLIDE-OUT DRAWER */}
      {drawerOpen && selectedMessage && (
        <>
          {/* Overlay */}
          <div onClick={() => setDrawerOpen(false)} style={overlayStyle} />
          
          {/* Drawer Panel */}
          <div style={drawerPanelStyle}>
            <div style={drawerHeaderStyle}>
              <h2 style={drawerTitleStyle}>SUPPORT INQUIRY DETAILS</h2>
              <button onClick={() => setDrawerOpen(false)} style={drawerCloseBtnStyle}>✕</button>
            </div>

            <div style={drawerBodyStyle}>
              {/* Profile Card Header */}
              <div style={drawerProfileCardStyle}>
                <div style={drawerAvatarContainerStyle}>
                  {selectedMessage.profileImage ? (
                    <img src={selectedMessage.profileImage} alt="Profile" style={drawerAvatarStyle} />
                  ) : (
                    <div style={drawerAvatarFallbackStyle}>{selectedMessage.name.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <h3 style={drawerCustomerNameStyle}>{selectedMessage.name}</h3>
                <p style={drawerCustomerSubStyle}>
                  {selectedMessage.isLoggedIn ? 'REGISTERED WINSOR PATRON' : 'GUEST VISITOR'}
                </p>
              </div>

              {/* Inquiry Credentials */}
              <div style={drawerSectionStyle}>
                <h4 style={sectionTitleStyle}>CONTACT INFORMATION</h4>
                <div style={detailsBoxStyle}>
                  <div style={detailFieldStyle}>
                    <span style={detailLabelStyle}>EMAIL ADDRESS</span>
                    <span style={detailValueStyle}>{selectedMessage.email}</span>
                  </div>
                  <div style={detailFieldStyle}>
                    <span style={detailLabelStyle}>MOBILE CONTACT</span>
                    <span style={detailValueStyle}>{selectedMessage.mobile}</span>
                  </div>
                  <div style={detailFieldStyle}>
                    <span style={detailLabelStyle}>IP ADDRESS & DATE</span>
                    <span style={detailValueStyle}>
                      {selectedMessage.ipAddress} · {new Date(selectedMessage.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div style={drawerSectionStyle}>
                <h4 style={sectionTitleStyle}>MESSAGE BRIEF</h4>
                <div style={detailsBoxStyle}>
                  <div style={detailFieldStyle}>
                    <span style={detailLabelStyle}>SUBJECT</span>
                    <span style={{ ...detailValueStyle, color: '#8B6914', fontSize: '14.5px' }}>{selectedMessage.subject}</span>
                  </div>
                  <div style={{ ...detailFieldStyle, marginTop: '4px', borderTop: '1px solid rgba(26,18,9,0.06)', paddingTop: '12px' }}>
                    <span style={detailLabelStyle}>MESSAGE BODY</span>
                    <p style={messageContentStyle}>{selectedMessage.message}</p>
                  </div>
                </div>
              </div>

              {/* Actions Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', paddingTop: '20px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <a 
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                    style={replyBtnStyle}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Reply via Email
                  </a>
                  
                  {/* Mark Read/Unread Toggle Button */}
                  <button 
                    onClick={() => handleToggleRead(selectedMessage._id, selectedMessage.read)}
                    style={{
                      ...secondaryBtnStyle,
                      borderColor: selectedMessage.read ? 'rgba(26,18,9,0.2)' : 'rgba(139,105,20,0.5)',
                      color: selectedMessage.read ? '#1a1209' : '#8B6914',
                      background: selectedMessage.read ? 'transparent' : 'rgba(139,105,20,0.04)',
                    }}
                  >
                    {selectedMessage.read ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Mark Unread
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Mark Read
                      </>
                    )}
                  </button>
                </div>
                
                <button 
                  onClick={() => handleDeleteMessage(selectedMessage._id)} 
                  disabled={deleting}
                  style={deleteBtnStyle}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  Delete Inquiry
                </button>
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
  gap: '20px',
  flexWrap: 'wrap',
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

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  background: '#ffffff',
  border: '1px solid rgba(139,105,20,0.15)',
  borderRadius: '6px',
  padding: '3px',
  gap: '4px',
};

const activeTabStyle: React.CSSProperties = {
  background: '#1a1209',
  color: '#f3e3b8',
  border: 'none',
  borderRadius: '4px',
  padding: '6px 14px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const inactiveTabStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'rgba(26,18,9,0.6)',
  border: 'none',
  borderRadius: '4px',
  padding: '6px 14px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const tabBadgeStyle: React.CSSProperties = {
  background: '#8B6914',
  color: '#ffffff',
  fontSize: '9px',
  fontWeight: 700,
  borderRadius: '50%',
  width: '15px',
  height: '15px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
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

const patronBadgeStyle: React.CSSProperties = {
  fontSize: '8.5px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: '#8B6914',
  border: '1px solid rgba(139,105,20,0.3)',
  borderRadius: '3px',
  padding: '2px 8px',
  background: 'rgba(139,105,20,0.05)',
  display: 'inline-block',
};

const guestBadgeStyle: React.CSSProperties = {
  fontSize: '8.5px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: 'rgba(26,18,9,0.6)',
  border: '1px solid rgba(26,18,9,0.15)',
  borderRadius: '3px',
  padding: '2px 8px',
  background: 'rgba(26,18,9,0.02)',
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
  fontWeight: 500,
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

const messageContentStyle: React.CSSProperties = {
  fontSize: '13.5px',
  lineHeight: '1.6',
  color: 'rgba(26,18,9,0.75)',
  whiteSpace: 'pre-wrap',
  margin: 0,
  background: '#faf7f0',
  border: '1px solid rgba(139,105,20,0.15)',
  borderRadius: '4px',
  padding: '12px 14px',
};

const replyBtnStyle: React.CSSProperties = {
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#1a1209',
  color: '#f3e3b8',
  border: 'none',
  borderRadius: '4px',
  padding: '12px 16px',
  fontSize: '12.5px',
  fontWeight: 500,
  letterSpacing: '0.05em',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'background-color 0.2s ease',
  textAlign: 'center',
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  border: '1px solid rgba(26,18,9,0.2)',
  borderRadius: '4px',
  padding: '12px 16px',
  fontSize: '12.5px',
  fontWeight: 500,
  letterSpacing: '0.05em',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const deleteBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  color: '#c62828',
  border: '1px solid rgba(198,40,40,0.3)',
  borderRadius: '4px',
  padding: '12px 18px',
  fontSize: '12.5px',
  fontWeight: 500,
  letterSpacing: '0.05em',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};
