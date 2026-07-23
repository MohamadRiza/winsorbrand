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

  // ✅ INSTANT OPTIMISTIC ORDER STATUS UPDATE
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find(o => o._id === orderId);
    if (!targetOrder || targetOrder.status === newStatus) return;

    const previousStatus = targetOrder.status;

    // 1. Optimistic local state update (0ms delay UI response)
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?._id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }

    setUpdatingId(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status');

      if (data.success) {
        toast.success(`Order #${targetOrder.orderRef} updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
        if (data.data && selectedOrder?._id === orderId) {
          setSelectedOrder(data.data);
        }
      }
    } catch (error: any) {
      console.error('Update status error:', error);
      toast.error(error.message || 'Failed to update status. Reverting changes.');
      
      // Rollback on failure
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: previousStatus } : o));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: previousStatus } : null);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
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
      revenue: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.subtotal || 0), 0)
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeTab !== 'all' && order.status !== activeTab) {
        return false;
      }

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
    setTimeout(() => {
      setSelectedOrder(null);
    }, 300);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-[#faf7f0] text-[#8B6914] border-[#8B6914]/30', label: 'Pending', dot: 'bg-[#8B6914]' };
      case 'processing':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-200', label: 'Processing', dot: 'bg-blue-500' };
      case 'shipped':
        return { bg: 'bg-purple-50 text-purple-800 border-purple-200', label: 'Shipped', dot: 'bg-purple-500' };
      case 'delivered':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Delivered', dot: 'bg-emerald-500' };
      case 'cancelled':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Cancelled', dot: 'bg-rose-500' };
      case 'cancel_requested':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse', label: 'Cancel Requested', dot: 'bg-amber-500' };
      default:
        return { bg: 'bg-gray-50 text-gray-700 border-gray-200', label: status, dot: 'bg-gray-400' };
    }
  };

  const ORDER_STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6914]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-['Jost'] select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-semibold text-[#1a1209]">
            Order Management
          </h1>
          <p className="text-[#1a1209]/60 text-sm mt-0.5">
            Review client purchases, manage status transitions, and resolve cancellation requests.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#1a1209]/10 shadow-sm">
          <span className="text-xs text-[#1a1209]/50 font-medium uppercase tracking-wider">Active Orders:</span>
          <span className="font-bold text-[#8B6914] text-lg font-mono tabular-nums">{orders.filter(o => o.status !== 'cancelled').length}</span>
        </div>
      </div>

      {/* Luxury Professional Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Orders */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#8B6914]/30 transition-all">
          <span className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Total Orders</span>
          <span className="text-3xl font-bold text-[#1a1209] font-['Jost'] tabular-nums tracking-tight mt-2">
            {metrics.total.toLocaleString()}
          </span>
        </div>

        {/* Cancellation Requests */}
        <button 
          onClick={() => setActiveTab('cancel_requested')}
          className={`text-left bg-white border rounded-xl p-4 flex flex-col justify-between transition-all shadow-sm ${
            metrics.cancelRequests > 0 
              ? 'border-amber-400 bg-amber-50/20 hover:bg-amber-50/40 ring-1 ring-amber-400/30' 
              : 'border-[#1a1209]/10 hover:border-[#8B6914]/30'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Cancel Requests</span>
            {metrics.cancelRequests > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <span className={`text-3xl font-bold font-['Jost'] tabular-nums tracking-tight mt-2 ${metrics.cancelRequests > 0 ? 'text-amber-700' : 'text-[#1a1209]'}`}>
            {metrics.cancelRequests.toLocaleString()}
          </span>
        </button>

        {/* Pending */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#8B6914]/30 transition-all">
          <span className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Pending</span>
          <span className="text-3xl font-bold text-[#8B6914] font-['Jost'] tabular-nums tracking-tight mt-2">
            {metrics.pending.toLocaleString()}
          </span>
        </div>

        {/* Processing / Shipped */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#8B6914]/30 transition-all">
          <span className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">In Transit (Proc/Ship)</span>
          <span className="text-3xl font-bold text-blue-700 font-['Jost'] tabular-nums tracking-tight mt-2">
            {(metrics.processing + metrics.shipped).toLocaleString()}
          </span>
        </div>

        {/* Delivered */}
        <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#8B6914]/30 transition-all">
          <span className="text-[11px] font-semibold tracking-wider text-[#1a1209]/50 uppercase">Delivered</span>
          <span className="text-3xl font-bold text-emerald-700 font-['Jost'] tabular-nums tracking-tight mt-2">
            {metrics.delivered.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filtering Controls */}
      <div className="bg-white border border-[#1a1209]/10 rounded-xl p-4 space-y-4 shadow-sm">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-[#1a1209]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order Ref (e.g. WS-894210), Customer ID, City, Phone, or Timepiece title..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f4] border border-[#1a1209]/15 rounded-lg text-[#1a1209] placeholder-[#1a1209]/40 focus:outline-none focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/20 transition text-sm font-['Jost']"
          />
        </div>

        {/* Segmented Filter Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-[#1a1209]/5 pt-3">
          {[
            { id: 'all', label: `All Orders (${metrics.total})` },
            { id: 'cancel_requested', label: `Cancel Requested (${metrics.cancelRequests})` },
            { id: 'pending', label: `Pending (${metrics.pending})` },
            { id: 'processing', label: `Processing (${metrics.processing})` },
            { id: 'shipped', label: `Shipped (${metrics.shipped})` },
            { id: 'delivered', label: `Delivered (${metrics.delivered})` },
            { id: 'cancelled', label: `Cancelled (${metrics.cancelled})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#1a1209] text-[#faf7f0] border-[#1a1209] shadow-sm'
                  : 'bg-white text-[#1a1209]/70 border-[#1a1209]/10 hover:bg-[#faf7f0]/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#1a1209]/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#faf7f0] border-b border-[#1a1209]/10">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1a1209]/70">Order Ref & Client</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1a1209]/70">Date</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1a1209]/70">Destination</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1a1209]/70">Items</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1a1209]/70">Subtotal</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1a1209]/70">Status</th>
                <th className="px-6 py-3.5 text-right text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1a1209]/70">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1209]/5">
              {filteredOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

                return (
                  <tr key={order._id} className="hover:bg-[#faf7f0]/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#1a1209] text-sm tracking-wider">
                            #{order.orderRef}
                          </span>
                          {order.isGift && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-[#8b6914]/15 text-[#8b6914] border border-[#8b6914]/30 uppercase tracking-widest">
                              🎁 GIFT
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#1a1209]/50 mt-0.5 truncate font-mono">
                          ID: {order.clerkId.slice(0, 14)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-[#1a1209]/80 font-mono">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-[#1a1209]/80 font-medium">
                        <span>{order.shippingAddress?.city}, {order.shippingAddress?.country}</span>
                        <span className="text-[11px] text-[#1a1209]/50 font-mono">{order.shippingAddress?.mobileCode} {order.shippingAddress?.mobile}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-[#1a1209]/80">
                      {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#8B6914] text-sm font-mono tabular-nums">
                      LKR {(order.subtotal || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                        {updatingId === order._id && (
                          <svg className="animate-spin h-3.5 w-3.5 text-[#8B6914]" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="px-4 py-1.5 bg-[#1a1209] hover:bg-[#8B6914] text-[#faf7f0] text-xs font-medium rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        View Details
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
            <p className="text-[#1a1209]/70 text-base font-semibold">No orders matching query</p>
            <p className="text-xs text-[#1a1209]/40 mt-1">Try modifying your search keywords or switching tab filters.</p>
          </div>
        )}
      </div>

      {/* Luxury Details Side Drawer */}
      <div 
        className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
          isDrawerOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-[#1a1209]/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeOrderDetails}
        />

        <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
          <div 
            className={`w-screen max-w-xl bg-white shadow-2xl border-l border-[#1a1209]/10 flex flex-col h-full transform transition-transform duration-300 ${
              isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-[#faf7f0] border-b border-[#1a1209]/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-['Cormorant_Garamond'] text-2xl font-bold text-[#1a1209]">
                    Order #{selectedOrder?.orderRef}
                  </h2>
                  {selectedOrder && (
                    <button 
                      onClick={() => copyToClipboard(selectedOrder.orderRef, 'Order Reference')}
                      className="text-[#8B6914] hover:text-[#1a1209] transition p-1"
                      title="Copy Reference"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#1a1209]/60 font-mono mt-0.5">
                  Placed: {selectedOrder?.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <button
                onClick={closeOrderDetails}
                className="p-2 rounded-lg text-[#1a1209]/50 hover:bg-[#1a1209]/5 hover:text-[#1a1209] transition-all cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              
              {/* Order Status & Interactive Step Tracker */}
              {selectedOrder && (
                <div className="bg-[#faf7f0] border border-[#8B6914]/25 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1a1209]/70 uppercase tracking-wider">
                      Current Order Lifecycle
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(selectedOrder.status).bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadge(selectedOrder.status).dot}`} />
                      {getStatusBadge(selectedOrder.status).label}
                    </span>
                  </div>

                  {/* Interactive Lifecycle Step Bar (for active non-cancelled orders) */}
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'cancel_requested' && (
                    <div className="pt-2">
                      <div className="grid grid-cols-4 gap-1.5 relative">
                        {ORDER_STEPS.map((step, idx) => {
                          const currentStepIndex = ORDER_STEPS.indexOf(selectedOrder.status as any);
                          const isDone = idx <= currentStepIndex;
                          const isCurrent = selectedOrder.status === step;

                          return (
                            <button
                              key={step}
                              disabled={updatingId !== null}
                              onClick={() => selectedOrder._id && updateOrderStatus(selectedOrder._id, step)}
                              className={`py-2 px-1 rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center gap-1 cursor-pointer border ${
                                isCurrent
                                  ? 'bg-[#8B6914] text-white border-[#8B6914] shadow-sm ring-2 ring-[#8B6914]/30'
                                  : isDone
                                  ? 'bg-[#1a1209] text-white border-[#1a1209]'
                                  : 'bg-white text-[#1a1209]/60 border-[#1a1209]/15 hover:border-[#8B6914]'
                              }`}
                            >
                              <span className="capitalize">{step}</span>
                              {isCurrent && updatingId === selectedOrder._id && (
                                <span className="text-[9px] text-amber-200 animate-pulse">Syncing...</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-[#1a1209]/50 mt-2.5 text-center font-medium">
                        Click any lifecycle step above to instantly update order status
                      </p>
                    </div>
                  )}

                  {/* Cancellation Request Box */}
                  {selectedOrder.status === 'cancel_requested' && (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Cancellation Request Pending</p>
                          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                            The client requested to cancel this order. Approving will restore inventory stock automatically.
                          </p>
                        </div>
                      </div>

                      {selectedOrder.cancelReason && (
                        <div className="bg-white p-3 rounded-lg border border-amber-200 text-xs">
                          <span className="font-semibold text-amber-900">Reason provided:</span>{' '}
                          <span className="text-[#1a1209] italic">"{selectedOrder.cancelReason}"</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          disabled={updatingId !== null}
                          onClick={() => selectedOrder._id && updateOrderStatus(selectedOrder._id, 'cancelled')}
                          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          Approve Cancel
                        </button>
                        <button
                          disabled={updatingId !== null}
                          onClick={() => selectedOrder._id && updateOrderStatus(selectedOrder._id, 'processing')}
                          className="flex-1 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                          Reject Request
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === 'cancelled' && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-center font-medium">
                      ❌ Order has been Cancelled. Stock restored to inventory.
                    </div>
                  )}
                </div>
              )}

              {/* Timepiece Items Purchased */}
              <div>
                <h3 className="text-xs font-semibold text-[#1a1209]/70 uppercase tracking-wider mb-3">
                  Purchased Items ({selectedOrder?.items.length || 0})
                </h3>
                <div className="divide-y divide-[#1a1209]/5 border border-[#1a1209]/10 rounded-2xl overflow-hidden bg-white shadow-sm">
                  {selectedOrder?.items.map((item, index) => (
                    <div key={index} className="p-4 space-y-3 hover:bg-[#faf7f0]/30 transition-colors">
                      <div className="flex gap-3.5">
                        <div className="w-16 h-16 bg-[#faf7f0] rounded-xl overflow-hidden border border-[#1a1209]/10 flex-shrink-0">
                          <img 
                            src={item.productThumbnail} 
                            alt={item.productTitle} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[#1a1209] truncate">{item.productTitle}</p>
                          <p className="text-xs text-[#1a1209]/50 font-mono mt-0.5">Model: {item.productModelNo} · Color: {item.colorVariant || 'Default'}</p>
                          
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs font-medium text-[#1a1209]/70 font-mono">{item.quantity} × LKR {(item.price || 0).toLocaleString()}</span>
                            <span className="text-sm font-bold text-[#8B6914] font-mono tabular-nums">LKR {((item.quantity || 1) * (item.price || 0)).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Gift Packaging Box if Gift */}
                      {item.isGift && (
                        <div className="p-3.5 rounded-xl bg-[#faf7f0] border border-[#8B6914]/20 text-xs space-y-2">
                          <div className="font-bold text-[#8B6914] flex items-center gap-1.5">
                            <span>🎁</span> Premium Gift Packaging Included
                          </div>
                          {item.giftNote && (
                            <div className="space-y-1">
                              <span className="text-[11px] text-[#1a1209]/60 font-medium">Patron Greeting Message:</span>
                              <p className="italic text-[#1a1209] bg-white p-2.5 rounded-lg border border-[#1a1209]/10 whitespace-pre-wrap font-serif text-sm">
                                "{item.giftNote}"
                              </p>
                            </div>
                          )}
                          {item.canvaLink && (
                            <div className="pt-1">
                              <span className="text-[11px] text-[#1a1209]/60 font-medium block mb-1">Canva Card Link:</span>
                              <a 
                                href={item.canvaLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[#8B6914] font-semibold hover:underline break-all inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-[#8B6914]/20"
                              >
                                View Greeting Link ↗
                              </a>
                            </div>
                          )}
                          {item.giftAttachmentUrl && (
                            <div className="pt-1">
                              <span className="text-[11px] text-[#1a1209]/60 font-medium block mb-1">Wishes Card Document:</span>
                              <a 
                                href={item.giftAttachmentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[#8B6914] font-semibold hover:underline inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-[#8B6914]/20"
                              >
                                📄 Download Attached Document ↗
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Total Bar */}
                  <div className="p-4 bg-[#faf7f0] flex justify-between items-center border-t border-[#1a1209]/10">
                    <span className="text-sm font-semibold text-[#1a1209]">Subtotal Amount</span>
                    <span className="text-lg font-bold text-[#8B6914] font-mono tabular-nums">
                      LKR {(selectedOrder?.subtotal || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-xs font-semibold text-[#1a1209]/70 uppercase tracking-wider mb-3">Shipping Address</h3>
                <div className="bg-[#fbf9f4] border border-[#1a1209]/10 rounded-2xl p-4 text-xs space-y-3 font-['Jost']">
                  <div className="flex justify-between border-b border-[#1a1209]/5 pb-2">
                    <span className="text-[#1a1209]/60 font-medium">Street Address</span>
                    <span className="text-[#1a1209] font-semibold text-right max-w-[220px]">{selectedOrder?.shippingAddress?.address}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1a1209]/5 pb-2">
                    <span className="text-[#1a1209]/60 font-medium">City / Postal Code</span>
                    <span className="text-[#1a1209] font-semibold">{selectedOrder?.shippingAddress?.city} — {selectedOrder?.shippingAddress?.postalCode}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1a1209]/5 pb-2">
                    <span className="text-[#1a1209]/60 font-medium">Country</span>
                    <span className="text-[#1a1209] font-semibold">{selectedOrder?.shippingAddress?.country}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[#1a1209]/60 font-medium">Mobile Contact</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#1a1209] font-mono font-bold text-sm">
                        {selectedOrder?.shippingAddress?.mobileCode} {selectedOrder?.shippingAddress?.mobile}
                      </span>
                      {selectedOrder?.shippingAddress?.mobile && (
                        <button
                          onClick={() => copyToClipboard(`${selectedOrder.shippingAddress.mobileCode} ${selectedOrder.shippingAddress.mobile}`, 'Mobile Phone')}
                          className="text-[#8B6914] hover:text-[#1a1209] text-xs font-semibold p-1"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Metadata */}
              <div>
                <h3 className="text-xs font-semibold text-[#1a1209]/70 uppercase tracking-wider mb-3">Order Metadata</h3>
                <div className="bg-[#fbf9f4] border border-[#1a1209]/10 rounded-2xl p-4 text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#1a1209]/50 font-sans">Client ID:</span>
                    <span className="text-[#1a1209] font-semibold">{selectedOrder?.clerkId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1a1209]/50 font-sans">Order Ref:</span>
                    <span className="text-[#1a1209] font-semibold">#{selectedOrder?.orderRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1a1209]/50 font-sans">Time Placed:</span>
                    <span className="text-[#1a1209]">
                      {selectedOrder?.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  {selectedOrder?.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-[#1a1209]/50 font-sans">Last Updated:</span>
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
                className="px-5 py-2.5 border border-[#1a1209]/20 rounded-xl text-xs font-semibold text-[#1a1209] hover:bg-[#1a1209]/5 transition-all bg-white shadow-sm cursor-pointer"
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
