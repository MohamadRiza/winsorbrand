'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { IOrder, OrderStatus } from '@/types';

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
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detail Modal/Drawer states
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch customers and orders in parallel for real-time sync
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, ordRes] = await Promise.all([
        fetch('/api/admin/customers'),
        fetch('/api/admin/orders', { credentials: 'include' })
      ]);

      const custData = await custRes.json();
      const ordData = await ordRes.json();

      if (custData.success) {
        setCustomers(custData.data || []);
      } else {
        throw new Error(custData.error || 'Failed to fetch customers');
      }

      if (ordData.success) {
        setOrders(ordData.data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not load patron directories');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Match customer to their orders in DB
  const getCustomerOrders = (customer: CustomerData): IOrder[] => {
    return orders.filter(o => 
      (o.clerkId && (o.clerkId === customer.clerkId || o.clerkId === customer._id)) ||
      ((o.shippingAddress as any)?.email && (o.shippingAddress as any).email.toLowerCase() === customer.email.toLowerCase())
    );
  };

  // Filter customers on search
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;

    return customers.filter(c => 
      c.email.toLowerCase().includes(q) ||
      (c.mobile && c.mobile.toLowerCase().includes(q)) ||
      (c.country && c.country.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  }, [searchQuery, customers]);

  // Metric aggregates
  const totalPatrons = customers.length;
  const domesticPatrons = customers.filter(c => c.country === 'LK').length;
  const globalPatrons = totalPatrons - domesticPatrons;
  const patronsWithOrders = useMemo(() => {
    return customers.filter(c => getCustomerOrders(c).length > 0).length;
  }, [customers, orders]);

  const handleRowClick = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: '✓ Delivered',
          isDelivered: true,
        };
      case 'shipped':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          label: '🚚 Not Delivered Yet (Shipped)',
          isDelivered: false,
        };
      case 'processing':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          label: '⚙️ Not Delivered Yet (Processing)',
          isDelivered: false,
        };
      case 'pending':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          label: '⏳ Not Delivered Yet (Pending)',
          isDelivered: false,
        };
      case 'cancelled':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: '❌ Cancelled',
          isDelivered: false,
        };
      case 'cancel_requested':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse',
          label: '⚠️ Cancel Requested',
          isDelivered: false,
        };
      default:
        return {
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
          label: status,
          isDelivered: false,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]" />
        <p className="mt-4 text-xs font-semibold text-[#8B6914] tracking-widest uppercase font-['Jost']">
          Retrieving Patron Directories & Orders…
        </p>
      </div>
    );
  }

  const selectedCustomerOrders = selectedCustomer ? getCustomerOrders(selectedCustomer) : [];
  const selectedTotalItemsOrdered = selectedCustomerOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.items?.reduce((iSum, i) => iSum + i.quantity, 0) || 0), 0);

  const selectedDeliveredCount = selectedCustomerOrders.filter(o => o.status === 'delivered').length;
  const selectedPendingDeliveryCount = selectedCustomerOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

  return (
    <div className="space-y-6 font-['Jost'] select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B6914]/15 pb-5">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#8B6914] tracking-wide">
            PATRON DIRECTORY
          </h1>
          <p className="text-[#1a1209]/60 text-sm mt-0.5">
            Manage registered patron profiles, shipping credentials, and synced purchase activity logs.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="self-start sm:self-center px-4 py-2 bg-white border border-[#1a1209]/15 hover:border-[#8B6914] text-xs font-semibold text-[#1a1209] rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4 text-[#8B6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync Orders
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">TOTAL PATRONS</p>
          <p className="font-['Cormorant_Garamond'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums">{totalPatrons}</p>
        </div>
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">PATRONS WITH ORDERS</p>
          <p className="font-['Cormorant_Garamond'] text-3xl font-bold text-[#8B6914] mt-1 tabular-nums">{patronsWithOrders}</p>
        </div>
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">DOMESTIC PATRONS (LK)</p>
          <p className="font-['Cormorant_Garamond'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums">{domesticPatrons}</p>
        </div>
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wider text-[#8B6914] uppercase">GLOBAL PATRONS</p>
          <p className="font-['Cormorant_Garamond'] text-3xl font-bold text-[#1a1209] mt-1 tabular-nums">{globalPatrons}</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search patrons by email, mobile, country, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-sm text-[#1a1209] placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition"
          />
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1209]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Table Listing */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-dashed border-[#8B6914]/30 rounded-xl p-12 text-center">
          <svg className="w-10 h-10 text-[#1a1209]/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            <line x1="8" y1="12" x2="16" y2="12" strokeWidth="1.5" />
          </svg>
          <p className="text-sm text-[#1a1209]/60 font-medium">No patron directories found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#1a1209]/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1a1209] text-[#f3e3b8]">
                <tr>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">PATRON</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">EMAIL ADDRESS</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">MOBILE CONTACT</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">LOCATION</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase">REGISTERED</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-semibold tracking-[0.15em] uppercase">PURCHASE ACTIVITY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1209]/5">
                {filteredCustomers.map((c) => {
                  const custOrders = getCustomerOrders(c);
                  const totalItems = custOrders
                    .filter(o => o.status !== 'cancelled')
                    .reduce((sum, o) => sum + (o.items?.reduce((iSum, i) => iSum + i.quantity, 0) || 0), 0);
                  const hasDelivered = custOrders.some(o => o.status === 'delivered');
                  const hasPendingDelivery = custOrders.some(o => o.status !== 'delivered' && o.status !== 'cancelled');

                  return (
                    <tr 
                      key={c._id} 
                      onClick={() => handleRowClick(c)}
                      className="hover:bg-[#faf7f0]/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full border border-[#8B6914]/30 bg-[#faf7f0] flex items-center justify-center overflow-hidden flex-shrink-0">
                            {c.profileImage ? (
                              <img src={c.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-semibold text-[#8B6914]">
                                {c.email.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-sm text-[#1a1209] capitalize">
                            {c.email.split('@')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-[#8B6914]">
                        {c.email}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#1a1209]/80 font-mono">
                        {c.mobileCode ? `${c.mobileCode} ` : ''}{c.mobile || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#1a1209]/80">
                        {c.city ? `${c.city}, ` : ''}{c.country || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#1a1209]/50 font-mono">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {custOrders.length > 0 ? (
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="px-3 py-1 bg-[#faf7f0] border border-[#8B6914]/30 text-[#8B6914] text-xs font-bold rounded-full font-mono">
                              {custOrders.length} {custOrders.length === 1 ? 'Order' : 'Orders'} ({totalItems} {totalItems === 1 ? 'Item' : 'Items'})
                            </span>
                            <span className="text-[10px] font-semibold text-[#1a1209]/60">
                              {hasDelivered && !hasPendingDelivery && <span className="text-emerald-700 font-bold">✓ Delivered</span>}
                              {hasPendingDelivery && <span className="text-amber-700 font-bold">🚚 In Transit / Pending</span>}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-400 text-[10px] font-semibold rounded">
                            0 ORDERS
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILS SLIDE-OUT DRAWER */}
      {drawerOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Overlay */}
          <div 
            onClick={() => setDrawerOpen(false)} 
            className="absolute inset-0 bg-[#1a1209]/50 backdrop-blur-sm transition-opacity duration-300"
          />
          
          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-lg bg-[#faf7f0] shadow-2xl border-l border-[#1a1209]/10 flex flex-col h-full transform transition-transform duration-300">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-[#1a1209] text-[#f3e3b8] border-b border-[#8B6914]/30 flex items-center justify-between">
                <h2 className="font-['Cormorant_Garamond'] text-xl font-bold tracking-wider uppercase">
                  PATRON PROFILE DETAILS
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
                    {selectedCustomer.profileImage ? (
                      <img src={selectedCustomer.profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-2xl font-bold text-[#8B6914]">
                        {selectedCustomer.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#1a1209] capitalize">
                    {selectedCustomer.email.split('@')[0]}
                  </h3>
                  <p className="text-[10px] font-semibold text-[#1a1209]/40 tracking-wider uppercase font-mono mt-0.5">
                    PATRON ID: {selectedCustomer._id}
                  </p>
                </div>

                {/* Contact Credentials */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">CONTACT CREDENTIALS</h4>
                  <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-3 text-xs">
                    <div>
                      <span className="block text-[10px] font-semibold text-[#1a1209]/40 uppercase tracking-wider">EMAIL ADDRESS</span>
                      <span className="font-semibold text-[#8B6914]">{selectedCustomer.email}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-[#1a1209]/40 uppercase tracking-wider">MOBILE CONTACT</span>
                      <span className="font-mono text-[#1a1209] font-medium">
                        {selectedCustomer.mobileCode ? `${selectedCustomer.mobileCode} ` : ''}{selectedCustomer.mobile || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">SHIPPING ADDRESS</h4>
                  <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#1a1209]/40 font-medium">STREET ADDRESS</span>
                      <span className="text-[#1a1209] font-semibold text-right max-w-[200px]">{selectedCustomer.address || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#1a1209]/40 font-medium">CITY / TOWN</span>
                      <span className="text-[#1a1209] font-semibold">{selectedCustomer.city || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#1a1209]/40 font-medium">POSTAL CODE</span>
                      <span className="text-[#1a1209] font-semibold">{selectedCustomer.postalCode || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#1a1209]/40 font-medium">COUNTRY</span>
                      <span className="text-[#1a1209] font-semibold">{selectedCustomer.country || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Real Synced Orders Activity Log */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold tracking-wider text-[#8B6914] uppercase">
                      ORDERS ACTIVITY LOG ({selectedCustomerOrders.length})
                    </h4>
                    {selectedCustomerOrders.length > 0 && (
                      <span className="text-xs font-bold text-[#8B6914] font-mono">
                        {selectedTotalItemsOrdered} {selectedTotalItemsOrdered === 1 ? 'Item Purchased' : 'Items Purchased'}
                      </span>
                    )}
                  </div>

                  {selectedCustomerOrders.length > 0 ? (
                    <div className="space-y-4">
                      {/* Summary Pill Bar */}
                      <div className="p-3 bg-white border border-[#8B6914]/20 rounded-xl flex items-center justify-between text-xs font-semibold text-[#1a1209]/80">
                        <span>Delivery Status:</span>
                        <div className="flex gap-2">
                          {selectedDeliveredCount > 0 && (
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
                              ✓ {selectedDeliveredCount} Delivered
                            </span>
                          )}
                          {selectedPendingDeliveryCount > 0 && (
                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-full font-bold">
                              🚚 {selectedPendingDeliveryCount} Not Delivered Yet
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Order List */}
                      {selectedCustomerOrders.map((ord) => {
                        const statusBadge = getStatusBadge(ord.status);
                        const ordItemsCount = ord.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                        return (
                          <div key={ord._id} className="bg-white border border-[#1a1209]/10 rounded-2xl p-4 space-y-3 shadow-sm">
                            {/* Order Header */}
                            <div className="flex items-center justify-between border-b border-[#1a1209]/5 pb-3">
                              <div>
                                <span className="font-mono font-bold text-sm text-[#1a1209]">
                                  #{ord.orderRef}
                                </span>
                                <p className="text-[11px] text-[#1a1209]/40 font-mono mt-0.5">
                                  Placed: {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}>
                                {statusBadge.label}
                              </span>
                            </div>

                            {/* Items List */}
                            <div className="space-y-2.5">
                              {ord.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-[#faf7f0]/60 p-2.5 rounded-xl border border-[#1a1209]/5">
                                  <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-[#1a1209]/10 flex-shrink-0">
                                    <img src={item.productThumbnail} alt={item.productTitle} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-xs text-[#1a1209] truncate">{item.productTitle}</p>
                                    <p className="text-[10px] text-[#1a1209]/50 font-mono">Model: {item.productModelNo} · Color: {item.colorVariant || 'Default'}</p>
                                    <div className="flex justify-between items-center mt-1 text-xs">
                                      <span className="text-[#1a1209]/70 font-mono">{item.quantity} × LKR {(item.price || 0).toLocaleString()}</span>
                                      <span className="font-bold text-[#8B6914] font-mono">LKR {((item.quantity || 1) * (item.price || 0)).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Order Total Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#1a1209]/5 text-xs">
                              <span className="font-semibold text-[#1a1209]/70">{ordItemsCount} {ordItemsCount === 1 ? 'Timepiece' : 'Timepieces'} Total</span>
                              <span className="font-bold text-sm text-[#8B6914] font-mono tabular-nums">
                                Total: LKR {(ord.subtotal || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-dashed border-[#8B6914]/30 rounded-2xl p-8 text-center">
                      <svg className="w-8 h-8 text-[#8B6914]/40 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <p className="text-xs font-semibold text-[#8B6914] uppercase tracking-wider">No Orders Placed Yet</p>
                      <p className="text-xs text-[#1a1209]/50 mt-1 leading-relaxed">
                        Patron has not placed any checkout items yet. Completed orders and shipping statuses will display here once an order is submitted.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
