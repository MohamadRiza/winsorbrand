'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { IOrder, OrderStatus } from '@/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Selection & Drawer State
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'cancel_requested' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status');

      if (data.success) {
        toast.success(`Order status updated to ${status}`);
        
        // Update local state
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
        
        // If the drawer is currently showing this order, update it
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch (error: any) {
      console.error('Update status error:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Metric aggregates
  const metrics = useMemo(() => {
    return {
      total: orders.length,
      cancelRequests: orders.filter(o => o.status === 'cancel_requested').length,
      processing: orders.filter(o => o.status === 'processing').length,
      pending: orders.filter(o => o.status === 'pending').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Tab filter
      if (activeTab !== 'all' && order.status !== activeTab) {
        return false;
      }

      // 2. Search query filter (Order reference, clerkId, shipping address, or product title)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesRef = order.orderRef.toLowerCase().includes(query);
        const matchesClerk = order.clerkId.toLowerCase().includes(query);
        const matchesCity = order.shippingAddress?.city?.toLowerCase().includes(query);
        const matchesMobile = order.shippingAddress?.mobile?.toLowerCase().includes(query);
        const matchesItems = order.items.some(item => 
          item.productTitle.toLowerCase().includes(query) ||
          item.productModelNo.toLowerCase().includes(query)
        );

        return matchesRef || matchesClerk || matchesCity || matchesMobile || matchesItems;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const openOrderDetails = (order: IOrder) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const closeOrderDetails = () => {
    setIsDrawerOpen(false);
    // Keep selectedOrder for closing transitions, clear after animation
    setTimeout(() => {
      setSelectedOrder(null);
    }, 300);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-[#faf7f0] text-[#8B6914] border-[#8B6914]/25', color: '#8B6914' };
      case 'processing':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', color: '#3498db' };
      case 'shipped':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', color: '#9b59b6' };
      case 'delivered':
        return { bg: 'bg-green-50 text-green-700 border-green-200', color: '#2ecc71' };
      case 'cancelled':
        return { bg: 'bg-red-50 text-red-700 border-red-200', color: '#e74c3c' };
      case 'cancel_requested':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse', color: '#d97706' };
      default:
        return { bg: 'bg-gray-50 text-gray-700 border-gray-200', color: '#6b7280' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-['Jost']">
      {/* Page Header */}
      <div>
        <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
          Order Management
        </h1>
        <p className="text-[#1a1209]/60 mt-1">
          Review client purchases, manage status transitions, and resolve cancellation requests.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric Total */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Total Orders</span>
          <span className="text-2xl font-semibold text-[#1a1209] font-['Cormorant_Garamond'] mt-1">{metrics.total}</span>
        </div>

        {/* Metric Cancellation Requests */}
        <button 
          onClick={() => setActiveTab('cancel_requested')}
          className={`text-left bg-white border rounded-xl p-4 flex flex-col justify-between transition-all shadow-sm ${
            metrics.cancelRequests > 0 
              ? 'border-amber-400 bg-amber-50/20 hover:bg-amber-50/40 ring-1 ring-amber-400/30' 
              : 'border-[#1a1209]/10'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Cancellation Requests</span>
            {metrics.cancelRequests > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <span className={`text-2xl font-semibold font-['Cormorant_Garamond'] mt-1 ${metrics.cancelRequests > 0 ? 'text-amber-700' : 'text-[#1a1209]'}`}>
            {metrics.cancelRequests}
          </span>
        </button>

        {/* Metric Pending */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Pending</span>
          <span className="text-2xl font-semibold text-[#8B6914] font-['Cormorant_Garamond'] mt-1">{metrics.pending}</span>
        </div>

        {/* Metric Processing & Shipped */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Processing / Shipped</span>
          <span className="text-2xl font-semibold text-[#3498db] font-['Cormorant_Garamond'] mt-1">{metrics.processing + metrics.shipped}</span>
        </div>

        {/* Metric Completed */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Completed (Delivered)</span>
          <span className="text-2xl font-semibold text-green-700 font-['Cormorant_Garamond'] mt-1">{metrics.delivered}</span>
        </div>
      </div>

      {/* Filtering Controls */}
      <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-[#1a1209]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order Ref, Customer ID, City, Mobile or Timepiece title..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/30 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition text-sm"
          />
        </div>

        {/* Segmented Filter Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-[#1a1209]/5 pt-3">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'cancel_requested', label: `Cancel Requested (${metrics.cancelRequests})` },
            { id: 'pending', label: 'Pending' },
            { id: 'processing', label: 'Processing' },
            { id: 'shipped', label: 'Shipped' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1a1209] text-[#faf7f0] border-[#1a1209]'
                  : 'bg-white text-[#1a1209]/70 border-[#1a1209]/10 hover:bg-[#faf7f0]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Listing */}
      <div className="bg-white border border-[#1a1209]/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#faf7f0] border-b border-[#1a1209]/10">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Order Details</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Client Contact</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Items</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-[#1a1209]/80 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1209]/5">
              {filteredOrders.map((order) => {
                const badge = getStatusColor(order.status);
                const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

                return (
                  <tr key={order._id} className="hover:bg-[#faf7f0]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#1a1209] text-sm tracking-wide">
                            {order.orderRef}
                          </span>
                          {order.isGift && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-[#8b6914]/10 text-[#8b6914] border border-[#8b6914]/20 uppercase tracking-widest">
                              GIFT
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#1a1209]/40 mt-0.5 truncate max-w-[150px]">
                          CID: {order.clerkId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1a1209]/80">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm text-[#1a1209]/80">
                        <span>{order.shippingAddress?.city}, {order.shippingAddress?.country}</span>
                        <span className="text-xs text-[#1a1209]/50">{order.shippingAddress?.mobileCode} {order.shippingAddress?.mobile}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1a1209]/80">
                      {itemCount} {itemCount === 1 ? 'Timepiece' : 'Timepieces'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#8B6914] text-sm">
                      LKR {order.subtotal.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg}`}>
                        {order.status === 'cancel_requested' ? 'Cancel Requested' : order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="px-3.5 py-1.5 bg-[#1a1209] hover:bg-[#2a1d10] text-[#faf7f0] text-xs font-medium rounded-md transition-all shadow-sm"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-[#1a1209]/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="text-[#1a1209]/60 text-base">No orders found matching this query</p>
            <p className="text-xs text-[#1a1209]/40 mt-1">Try resetting the filters or modifying the search terms.</p>
          </div>
        )}
      </div>

      {/* Details Side Drawer */}
      <div 
        className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
          isDrawerOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        style={{ fontFamily: "'Jost', sans-serif" }}
      >
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-[#1a1209]/45 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeOrderDetails}
        />

        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div 
            className={`w-screen max-w-lg bg-white shadow-2xl border-l border-[#1a1209]/10 flex flex-col h-full transform transition-transform duration-300 ${
              isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-[#faf7f0] border-b border-[#1a1209]/10 flex items-center justify-between">
              <div>
                <h2 className="font-['Cormorant_Garamond'] text-xl font-bold text-[#1a1209]">
                  Order Details
                </h2>
                <p className="text-xs text-[#1a1209]/50 mt-0.5">
                  Ref: {selectedOrder?.orderRef}
                </p>
              </div>
              <button
                onClick={closeOrderDetails}
                className="p-1 rounded-md text-[#1a1209]/50 hover:bg-[#1a1209]/5 hover:text-[#1a1209] transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Order Status Display & Action Bar */}
              {selectedOrder && (
                <div className="bg-[#fbf9f4] border border-[#1a1209]/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1a1209]/60 uppercase tracking-wider">Current Status</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(selectedOrder.status).bg}`}>
                      {selectedOrder.status === 'cancel_requested' ? 'Cancel Requested' : selectedOrder.status.toUpperCase()}
                    </span>
                  </div>

                  {/* If cancel requested, show cancellation notice box */}
                  {selectedOrder.status === 'cancel_requested' && (
                    <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-lg space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-lg leading-none">⚠️</span>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">Cancellation Request Pending</p>
                          <p className="text-xs text-red-700/90 leading-relaxed">
                            The client has requested to cancel this order. If approved, their product stock will be returned, and a manual refund must be issued within 24h.
                          </p>
                        </div>
                      </div>

                      {selectedOrder.cancelReason && (
                        <div className="bg-white/80 p-2.5 rounded border border-red-100 text-xs">
                          <span className="font-semibold text-red-800">Reason:</span>{' '}
                          <span className="text-[#1a1209]/80 italic">"{selectedOrder.cancelReason}"</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          disabled={updatingId !== null}
                          onClick={() => selectedOrder._id && updateOrderStatus(selectedOrder._id, 'cancelled')}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
                        >
                          Approve Cancel
                        </button>
                        <button
                          disabled={updatingId !== null}
                          onClick={() => selectedOrder._id && updateOrderStatus(selectedOrder._id, 'processing')}
                          className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded transition-colors disabled:opacity-50"
                        >
                          Reject / Keep Processing
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Standard order actions */}
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'cancel_requested' && (
                    <div className="mt-4 pt-3 border-t border-[#1a1209]/5">
                      <label className="block text-[11px] font-semibold tracking-wider text-[#1a1209]/60 uppercase mb-2">
                        Update Order Status
                      </label>
                      <div className="flex gap-2">
                        <select
                          disabled={updatingId !== null}
                          value={selectedOrder.status}
                          onChange={(e) => selectedOrder._id && updateOrderStatus(selectedOrder._id, e.target.value as OrderStatus)}
                          className="flex-1 px-3 py-2 bg-white border border-[#1a1209]/15 rounded text-sm text-[#1a1209] focus:outline-none focus:border-[#8B6914] disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === 'cancelled' && (
                    <div className="mt-4 p-3 bg-red-50/50 border border-red-100 rounded-lg text-xs text-red-700 text-center font-medium">
                      ❌ Order has been Cancelled. Stock has been restored.
                    </div>
                  )}
                </div>
              )}

              {/* Timepiece items list */}
              <div>
                <h3 className="text-xs font-semibold text-[#1a1209]/60 uppercase tracking-wider mb-3">Timepiece Items</h3>
                <div className="divide-y divide-[#1a1209]/5 border border-[#1a1209]/10 rounded-xl overflow-hidden bg-white">
                  {selectedOrder?.items.map((item, index) => (
                    <div key={index} className="p-3.5 flex gap-3 hover:bg-[#faf7f0]/20 transition-colors">
                      <div className="w-14 h-14 bg-[#faf7f0] rounded-lg overflow-hidden border border-[#1a1209]/10 flex-shrink-0">
                        <img 
                          src={item.productThumbnail} 
                          alt={item.productTitle} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#1a1209] truncate">{item.productTitle}</p>
                        <p className="text-[11px] text-[#1a1209]/50 mt-0.5">Model: {item.productModelNo} — Variant: {item.colorVariant || 'Default'}</p>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-xs text-[#1a1209]/70">{item.quantity} × LKR {item.price.toLocaleString()}</span>
                          <span className="text-xs font-semibold text-[#8B6914]">LKR {(item.quantity * item.price).toLocaleString()}</span>
                        </div>
                        {item.isGift && (
                          <div className="mt-2.5 p-3 rounded-lg bg-[#faf7f0] border border-[#1a1209]/10 text-xs space-y-2">
                            <div className="font-bold text-[#8B6914] flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                                <path d="M20 12v10H4V12" />
                                <path d="M2 7h20v5H2z" />
                                <path d="M12 22V7" />
                                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                              </svg>
                              Gifting Options
                            </div>
                            {item.giftNote && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-[#1a1209]/50 font-medium">Patron Gift Note:</span>
                                <span className="italic text-[#1a1209]/80 whitespace-pre-wrap bg-white p-2 rounded border border-[#1a1209]/5">"{item.giftNote}"</span>
                              </div>
                            )}
                            {item.canvaLink && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-[#1a1209]/50 font-medium">Canva Greeting Link:</span>
                                <a 
                                  href={item.canvaLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[#8B6914] font-medium hover:underline break-all inline-flex items-center gap-0.5"
                                >
                                  {item.canvaLink}
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            )}
                            {item.giftAttachmentUrl && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-[#1a1209]/50 font-medium">Wishes Card Document:</span>
                                <a 
                                  href={item.giftAttachmentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[#8B6914] font-medium hover:underline break-all inline-flex items-center gap-0.5"
                                >
                                  Download: {item.giftAttachmentName || 'Attached Card'}
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </a>
                              </div>
                            )}
                            {!item.giftNote && !item.canvaLink && !item.giftAttachmentUrl && (
                              <span className="text-[10.5px] text-[#1a1209]/40 italic">Marked as gift wrap only (no wishes message attached).</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Summary / Total box */}
                  <div className="p-3.5 bg-[#faf7f0]/50 flex justify-between items-center">
                    <span className="text-sm font-semibold text-[#1a1209]">Subtotal Amount</span>
                    <span className="text-base font-bold text-[#8B6914]">LKR {selectedOrder?.subtotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address info */}
              <div>
                <h3 className="text-xs font-semibold text-[#1a1209]/60 uppercase tracking-wider mb-3">Shipping Address</h3>
                <div className="bg-[#fbf9f4] border border-[#1a1209]/10 rounded-xl p-4 text-sm space-y-2.5">
                  <div className="grid grid-cols-3">
                    <span className="text-xs text-[#1a1209]/50 font-medium">Street</span>
                    <span className="col-span-2 text-[#1a1209] font-medium">{selectedOrder?.shippingAddress?.address}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-xs text-[#1a1209]/50 font-medium">City / Zip</span>
                    <span className="col-span-2 text-[#1a1209] font-medium">{selectedOrder?.shippingAddress?.city} — {selectedOrder?.shippingAddress?.postalCode}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-xs text-[#1a1209]/50 font-medium">Country</span>
                    <span className="col-span-2 text-[#1a1209] font-medium">{selectedOrder?.shippingAddress?.country}</span>
                  </div>
                  <div className="grid grid-cols-3 border-t border-[#1a1209]/5 pt-2.5 mt-2.5">
                    <span className="text-xs text-[#1a1209]/50 font-medium">Mobile Contact</span>
                    <span className="col-span-2 text-[#1a1209] font-semibold">
                      {selectedOrder?.shippingAddress?.mobileCode} {selectedOrder?.shippingAddress?.mobile}
                    </span>
                  </div>
                </div>
              </div>



              {/* Technical Audit Logs metadata */}
              <div>
                <h3 className="text-xs font-semibold text-[#1a1209]/60 uppercase tracking-wider mb-3">Metadata</h3>
                <div className="bg-[#fbf9f4] border border-[#1a1209]/10 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#1a1209]/45">Client ID</span>
                    <span className="text-[#1a1209] font-mono">{selectedOrder?.clerkId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1a1209]/45">Order Reference</span>
                    <span className="text-[#1a1209] font-mono">{selectedOrder?.orderRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1a1209]/45">Time Placed</span>
                    <span className="text-[#1a1209]">
                      {selectedOrder?.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  {selectedOrder?.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-[#1a1209]/45">Last Updated</span>
                      <span className="text-[#1a1209]">
                        {new Date(selectedOrder.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-[#1a1209]/10 bg-[#faf7f0] flex justify-end gap-3">
              <button
                onClick={closeOrderDetails}
                className="px-4 py-2 border border-[#1a1209]/15 rounded text-xs font-semibold text-[#1a1209]/70 hover:text-[#1a1209] transition-all bg-white"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
