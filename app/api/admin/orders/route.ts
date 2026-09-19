import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Customer from '@/lib/models/Customer';
import Product from '@/lib/models/Product';
import { verifyPermissions } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyPermissions(req, ['orders_read', 'orders_manage'], 'any');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await connectDB();
    
    // Fetch all orders in the system, sorted by newest first
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

    // Collect all clerkIds to look up customer profile information
    const clerkIds = Array.from(new Set(orders.map((o: any) => o.clerkId).filter(Boolean)));
    const customers = clerkIds.length > 0
      ? await Customer.find({ clerkId: { $in: clerkIds } }).lean()
      : [];
    const customerMap = new Map(customers.map((c: any) => [c.clerkId, c]));

    // Collect all productIds to ensure variant image lookup fallback for historical orders
    const allProductIds = Array.from(new Set(orders.flatMap((o: any) => (o.items || []).map((i: any) => i.productId)).filter(Boolean)));
    const products = allProductIds.length > 0
      ? await Product.find({ _id: { $in: allProductIds } } as any).select('_id thumbnail colorVariants').lean()
      : [];
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    const enrichedOrders = orders.map((order: any) => {
      const cust = order.clerkId ? customerMap.get(order.clerkId) : null;

      const customerName = order.customerName
        || order.guestName
        || cust?.name
        || (cust?.email ? cust.email.split('@')[0] : (order.isGuestOrder ? 'Guest Customer' : 'Registered Patron'));

      const customerEmail = order.customerEmail
        || order.guestEmail
        || cust?.email
        || null;

      const customerMobile = order.customerMobile
        || order.guestMobile
        || (order.shippingAddress?.mobileCode && order.shippingAddress?.mobile
          ? `${order.shippingAddress.mobileCode} ${order.shippingAddress.mobile}`
          : (cust?.mobileCode && cust?.mobile ? `${cust.mobileCode} ${cust.mobile}` : null));

      const enrichedItems = (order.items || []).map((item: any) => {
        let thumbnail = item.productThumbnail;
        if (item.productId && item.colorVariant) {
          const prod = productMap.get(item.productId.toString());
          const variant = prod?.colorVariants?.find((v: any) => v.colorName === item.colorVariant);
          if (variant?.image?.url) {
            thumbnail = variant.image.url;
          }
        }
        return {
          ...item,
          productThumbnail: thumbnail || item.productThumbnail,
        };
      });

      return {
        ...order,
        items: enrichedItems,
        customerName,
        customerEmail,
        customerMobile,
      };
    });
    
    return NextResponse.json({ success: true, data: enrichedOrders });
  } catch (error: any) {
    console.error('Admin fetch orders error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
