'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const filteredMessages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = messages;
    
    if (filterTab === 'unread') {
      result = result.filter(m => !m.read);
    }
    
    if (q) {
      result = result.filter(m => 
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.mobile || '').toLowerCase().includes(q) ||
        (m.subject || '').toLowerCase().includes(q) ||
        (m.message || '').toLowerCase().includes(q)
      );
    }
    
    return result;
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
        setMessages(prev => prev.map(m => m._id === id ? { ...m, read: !currentRead } : m));
        setSelectedMessage(prev => prev && prev._id === id ? { ...prev, read: !currentRead } : prev);
        toast.success(!currentRead ? 'Marked as Read' : 'Marked as Unread');
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
        toast.success('Inquiry deleted successfully.');
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  // Metrics
  const totalInquiries = messages.length;
  const unreadInquiries = messages.filter(m => !m.read).length;
  const patronInquiries = messages.filter(m => m.isLoggedIn).length;
  const guestInquiries = totalInquiries - patronInquiries;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]" />
        <p className="mt-4 text-xs font-semibold text-[#8B6914] tracking-widest uppercase font-['Jost']">
          Retrieving Support Inquiries…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-['Jost'] select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B6914]/15 pb-5">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#8B6914] tracking-wide">
            CUSTOMER CARE INQUIRIES
          </h1>
          <p className="text-[#1a1209]/60 text-sm mt-0.5">
            Review, manage, and respond to patron and guest feedback submitted via Customer Care.
          </p>
        </div>
        <button
          onClick={fetchMessages}
          className="self-start sm:self-center px-4 py-2 bg-white border border-[#1a1209]/15 hover:border-[#8B6914] text-xs font-semibold text-[#1a1209] rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4 text-[#8B6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Inquiries
        </button>
      </div>

      {/* Professional Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
          <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">TOTAL INQUIRIES</p>
          <p className="font-['Jost'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums font-mono">{totalInquiries.toLocaleString()}</p>
        </div>
        <div className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${
          unreadInquiries > 0 ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400/30' : 'border-[#1a1209]/10'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">UNREAD INQUIRIES</p>
            {unreadInquiries > 0 && <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />}
          </div>
          <p className={`font-['Jost'] text-3xl font-bold mt-1 tabular-nums font-mono ${unreadInquiries > 0 ? 'text-amber-700' : 'text-[#1a1209]'}`}>
            {unreadInquiries.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
          <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">PATRON INQUIRIES</p>
          <p className="font-['Jost'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums font-mono">{patronInquiries.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm hover:border-[#8B6914]/30 transition-all">
          <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">GUEST INQUIRIES</p>
          <p className="font-['Jost'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums font-mono">{guestInquiries.toLocaleString()}</p>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search by sender name, email, phone, subject or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
          />
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1209]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setFilterTab('all')} 
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#1a1209] text-[#faf7f0] border-[#1a1209] shadow-sm'
                : 'bg-white text-[#1a1209]/70 border-[#1a1209]/10 hover:bg-[#faf7f0]/60'
            }`}
          >
            All Inquiries ({totalInquiries})
          </button>
          <button 
            onClick={() => setFilterTab('unread')} 
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'unread'
                ? 'bg-[#1a1209] text-[#faf7f0] border-[#1a1209] shadow-sm'
                : 'bg-white text-[#1a1209]/70 border-[#1a1209]/10 hover:bg-[#faf7f0]/60'
            }`}
          >
            Unread Only
            {unreadInquiries > 0 && (
              <span className="px-1.5 py-0.5 bg-[#8B6914] text-white text-[10px] font-bold rounded-full font-mono">
                {unreadInquiries}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Messages Table Listing */}
      {filteredMessages.length === 0 ? (
        <div className="bg-white border border-dashed border-[#8B6914]/30 rounded-xl p-12 text-center">
          <svg className="w-10 h-10 text-[#1a1209]/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            <line x1="8" y1="12" x2="16" y2="12" strokeWidth="1.5" />
          </svg>
          <p className="text-sm text-[#1a1209]/60 font-medium">No customer care inquiries found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#1a1209]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1a1209] text-[#f3e3b8]">
                <tr>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">SENDER</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">TYPE</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">EMAIL ADDRESS</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">MOBILE CONTACT</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">SUBJECT</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">RECEIVED DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1209]/5">
                {filteredMessages.map((m) => (
                  <tr 
                    key={m._id} 
                    onClick={() => handleRowClick(m)}
                    className="hover:bg-[#faf7f0]/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full border border-[#8B6914]/30 bg-[#faf7f0] flex items-center justify-center overflow-hidden flex-shrink-0">
                          {m.profileImage ? (
                            <img src={m.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-semibold text-[#8B6914]">
                              {m.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className={`text-sm ${m.read ? 'font-medium text-[#1a1209]/80' : 'font-bold text-[#1a1209]'}`}>
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {m.isLoggedIn ? (
                        <span className="px-2 py-0.5 bg-[#8B6914]/10 text-[#8B6914] border border-[#8B6914]/30 text-[9px] font-extrabold rounded uppercase tracking-wider">
                          PATRON
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 text-[9px] font-bold rounded uppercase tracking-wider">
                          GUEST
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-[#8B6914]">
                      {m.email}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#1a1209]/80 font-mono">
                      {m.mobile || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {!m.read && (
                          <span className="w-2 h-2 rounded-full bg-[#8B6914] flex-shrink-0" title="Unread Message" />
                        )}
                        <span className={`text-xs truncate max-w-[220px] ${m.read ? 'font-normal text-[#1a1209]/70' : 'font-bold text-[#1a1209]'}`}>
                          {m.subject}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#1a1209]/50 font-mono">
                      {new Date(m.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILS SLIDE-OUT DRAWER */}
      {drawerOpen && selectedMessage && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Overlay */}
          <div 
            onClick={() => setDrawerOpen(false)} 
            className="absolute inset-0 bg-[#1a1209]/50 backdrop-blur-sm transition-opacity duration-300"
          />
          
          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-xl bg-[#faf7f0] shadow-2xl border-l border-[#1a1209]/10 flex flex-col h-full transform transition-transform duration-300">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-[#1a1209] text-[#f3e3b8] border-b border-[#8B6914]/30 flex items-center justify-between">
                <h2 className="font-['Cormorant_Garamond'] text-xl font-bold tracking-wider uppercase">
                  SUPPORT INQUIRY DETAILS
                </h2>
                <button 
                  onClick={() => setDrawerOpen(false)} 
                  className="text-[#f3e3b8]/60 hover:text-[#f3e3b8] text-xl font-bold transition-colors cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Profile Card Header */}
                <div className="bg-white border border-[#8B6914]/20 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                  <div className="w-20 h-20 rounded-full border-2 border-[#8B6914] p-1 bg-[#faf7f0] flex items-center justify-center overflow-hidden mb-3">
                    {selectedMessage.profileImage ? (
                      <img src={selectedMessage.profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-2xl font-bold text-[#8B6914]">
                        {selectedMessage.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#1a1209] capitalize">
                    {selectedMessage.name}
                  </h3>
                  <p className="text-[10px] font-bold text-[#8B6914] tracking-wider uppercase font-mono mt-0.5">
                    {selectedMessage.isLoggedIn ? 'REGISTERED WINSOR PATRON' : 'GUEST VISITOR'}
                  </p>
                </div>

                {/* Sender Contact Info */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">CONTACT INFORMATION</h4>
                  <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] font-semibold text-[#1a1209]/40 uppercase tracking-wider">EMAIL ADDRESS</span>
                        <span className="font-semibold text-[#8B6914]">{selectedMessage.email}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedMessage.email, 'Email')}
                        className="px-2 py-1 bg-[#faf7f0] border border-[#8B6914]/20 text-[#8B6914] rounded text-[10px] font-bold hover:bg-[#8B6914] hover:text-white transition-all"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#1a1209]/5">
                      <div>
                        <span className="block text-[10px] font-semibold text-[#1a1209]/40 uppercase tracking-wider">MOBILE CONTACT</span>
                        <span className="font-mono text-[#1a1209] font-medium">{selectedMessage.mobile || '—'}</span>
                      </div>
                      {selectedMessage.mobile && (
                        <button
                          onClick={() => copyToClipboard(selectedMessage.mobile, 'Mobile Number')}
                          className="px-2 py-1 bg-[#faf7f0] border border-[#8B6914]/20 text-[#8B6914] rounded text-[10px] font-bold hover:bg-[#8B6914] hover:text-white transition-all"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                    <div className="pt-2 border-t border-[#1a1209]/5 font-mono text-[11px]">
                      <span className="block text-[10px] font-semibold text-[#1a1209]/40 uppercase tracking-wider font-sans mb-0.5">IP ADDRESS & DATE</span>
                      <span className="text-[#1a1209]/80">
                        {selectedMessage.ipAddress} · {new Date(selectedMessage.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Brief & High-Contrast Readable Message Body */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">MESSAGE BRIEF</h4>
                  <div className="bg-white border border-[#1a1209]/10 rounded-xl p-5 space-y-4 shadow-sm">
                    <div>
                      <span className="block text-[10px] font-semibold text-[#1a1209]/40 uppercase tracking-wider mb-1">SUBJECT</span>
                      <h5 className="text-base font-bold text-[#8B6914]">
                        {selectedMessage.subject}
                      </h5>
                    </div>

                    {/* ✅ HIGH-CONTRAST READABLE MESSAGE BODY (SUPPORTS 1000+ CHARS) */}
                    <div className="pt-3 border-t border-[#1a1209]/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#1a1209]/60 tracking-wider uppercase">MESSAGE BODY</span>
                        <span className="text-[10px] font-mono text-[#8B6914] font-bold">
                          {selectedMessage.message.length} characters
                        </span>
                      </div>
                      <div className="bg-[#faf7f0] border border-[#8B6914]/20 rounded-xl p-4 max-h-[350px] overflow-y-auto shadow-inner">
                        <p className="text-sm font-['Jost'] text-[#1a1209] font-medium leading-relaxed whitespace-pre-wrap break-words">
                          {selectedMessage.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="space-y-3 pt-4 border-t border-[#1a1209]/10">
                  <div className="flex gap-3">
                    <a 
                      href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                      className="flex-1 py-3 bg-[#1a1209] hover:bg-[#8B6914] text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Reply via Email
                    </a>
                    
                    <button 
                      onClick={() => handleToggleRead(selectedMessage._id, selectedMessage.read)}
                      className={`px-4 py-3 border text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedMessage.read 
                          ? 'border-[#1a1209]/20 text-[#1a1209] hover:bg-[#1a1209]/5' 
                          : 'border-[#8B6914] text-[#8B6914] bg-[#8B6914]/10 hover:bg-[#8B6914] hover:text-white'
                      }`}
                    >
                      {selectedMessage.read ? 'Mark Unread' : '✓ Mark Read'}
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteMessage(selectedMessage._id)} 
                    disabled={deleting}
                    className="w-full py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Inquiry
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
