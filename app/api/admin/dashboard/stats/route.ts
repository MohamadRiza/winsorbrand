import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Admin from '@/lib/models/Admin';
import Vacancy from '@/lib/models/Vacancy';
import JobApplication from '@/lib/models/JobApplication';
import InventorySettings from '@/lib/models/InventorySettings';
import Order from '@/lib/models/Order';
import ContactMessage from '@/lib/models/ContactMessage';
import Customer from '@/lib/models/Customer';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  // ✅ VERIFY AUTHENTICATION
  const accessToken = req.cookies.get('admin_access_token')?.value;
  
  if (!accessToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyAccessToken(accessToken);
  
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    // Load Inventory settings for dynamic thresholds
    let settings = await InventorySettings.findOne();
    if (!settings) {
      settings = await InventorySettings.create({
        lowStockThreshold: 10,
        outOfStockThreshold: 0,
        alertNotificationsEnabled: true,
      });
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      totalCustomers,
      lowStockCount,
      openVacanciesCount,
      pendingApplicationsCount,
      pendingOrdersCount,
      newMessagesCount,
      recentRegistrationsCount,
      hasLowStockOrOutOfStock,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Customer.countDocuments(),
      Product.countDocuments({ 
        isActive: true, 
        colorVariants: { 
          $elemMatch: { 
            qty: { 
              $lte: settings.lowStockThreshold, 
              $gt: settings.outOfStockThreshold 
            } 
          } 
        } 
      }),
      Vacancy.countDocuments({ status: 'active' }),
      JobApplication.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'pending' }),
      ContactMessage.countDocuments({ read: false }),
      Customer.countDocuments({ createdAt: { $gte: last24h } }),
      Product.exists({
        isActive: true,
        colorVariants: {
          $elemMatch: {
            qty: { $lte: settings.lowStockThreshold }
          }
        }
      })
    ]);

    // Fetch recent items for live activities feed
    const [recentOrders, recentMessages, recentApplications, recentProducts] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
      ContactMessage.find().sort({ createdAt: -1 }).limit(5).lean(),
      JobApplication.find().sort({ createdAt: -1 }).limit(5).populate('vacancyId', 'title').lean(),
      Product.find().sort({ updatedAt: -1 }).limit(5).lean(),
    ]);

    const clerkIds = recentOrders.map(o => o.clerkId).filter(Boolean);
    const customersList = await Customer.find({ clerkId: { $in: clerkIds } }).lean();
    const customerMap = new Map(customersList.map(c => [c.clerkId, c.email]));

    const activitiesList: any[] = [];

    // Format recent orders
    for (const order of recentOrders) {
      const email = customerMap.get(order.clerkId) || 'Customer';
      const userName = email.split('@')[0];
      const itemCount = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      activitiesList.push({
        id: `order-${order._id}`,
        user: userName,
        action: `placed order for ${itemCount} timepiece${itemCount > 1 ? 's' : ''}`,
        target: `${order.orderRef} ($${order.subtotal.toLocaleString()})`,
        time: order.createdAt.toISOString(),
        type: 'order',
      });
    }

    // Format recent contact messages
    for (const msg of recentMessages) {
      activitiesList.push({
        id: `msg-${msg._id}`,
        user: msg.name,
        action: 'sent contact message',
        target: `"${msg.subject}"`,
        time: msg.createdAt.toISOString(),
        type: 'message',
      });
    }

    // Format recent career applications
    for (const app of recentApplications) {
      const name = `${app.firstName} ${app.lastName}`;
      const title = (app.vacancyId as any)?.title || 'Career Position';
      activitiesList.push({
        id: `app-${app._id}`,
        user: name,
        action: 'applied for',
        target: title,
        time: app.createdAt.toISOString(),
        type: 'customer',
      });
    }

    // Format recent timepiece updates
    for (const prod of recentProducts) {
      activitiesList.push({
        id: `prod-${prod._id}`,
        user: 'Admin Manager',
        action: 'updated timepiece catalog',
        target: prod.title,
        time: (prod.updatedAt || prod.createdAt || new Date()).toISOString(),
        type: 'product',
      });
    }

    // Sort merged activities by date descending
    activitiesList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const topActivities = activitiesList.slice(0, 8);

    // Calculate revenue & orders distribution
    const allOrders = await Order.find().sort({ createdAt: 1 }).lean();
    const totalRevenue = allOrders.reduce((sum, order) => {
      const val = order.finalTotal !== null && order.finalTotal !== undefined ? order.finalTotal : order.subtotal;
      return sum + (val || 0);
    }, 0);

    const completedOrders = allOrders.filter(o => o.status === 'delivered').length;
    const processingOrders = allOrders.filter(o => ['processing', 'shipped'].includes(o.status)).length;
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;

    // Group sales overview (last 14 days)
    const salesOverview: { date: string; amount: number }[] = [];
    const oneDay = 24 * 60 * 60 * 1000;
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * oneDay);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      salesOverview.push({ date: dateStr, amount: 0 });
    }

    for (const order of allOrders) {
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const amount = order.finalTotal !== null && order.finalTotal !== undefined ? order.finalTotal : order.subtotal;
      const match = salesOverview.find(s => s.date === orderDate);
      if (match) {
        match.amount += (amount || 0);
      }
    }

    // Calculate top selling products
    const productSalesMap = new Map<string, { title: string; thumbnail: string; sales: number }>();
    for (const order of allOrders) {
      if (order.items) {
        for (const item of order.items) {
          const current = productSalesMap.get(item.productId) || {
            title: item.productTitle,
            thumbnail: item.productThumbnail,
            sales: 0
          };
          current.sales += (item.quantity * item.price);
          productSalesMap.set(item.productId, current);
        }
      }
    }

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 4);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          totalCustomers,
          pendingOrders: pendingOrdersCount,
          openVacancies: openVacanciesCount,
          jobApplications: pendingApplicationsCount,
          newMessages: newMessagesCount,
          lowStockItems: lowStockCount,
          onlineCustomers: recentRegistrationsCount,
          alertNotificationsEnabled: settings.alertNotificationsEnabled,
          hasLowStockOrOutOfStock: !!hasLowStockOrOutOfStock,
          totalRevenue,
          ordersDistribution: {
            total: allOrders.length,
            completed: completedOrders,
            processing: processingOrders,
            pending: pendingOrders,
          },
          salesOverview,
          topProducts,
        },
        activities: topActivities,
      },
    });

  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}