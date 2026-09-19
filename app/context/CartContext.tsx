'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { IProduct } from '@/types';
import { toast } from 'react-hot-toast';

export interface CartItem {
  productId: string;
  quantity: number;
  colorVariant?: string;
  variantImage?: string;
  product?: IProduct;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity: number, colorVariant?: string, product?: IProduct) => Promise<void> | void;
  removeFromCart: (productId: string, colorVariant?: string) => Promise<void> | void;
  updateQuantity: (productId: string, quantity: number, colorVariant?: string) => Promise<void> | void;
  clearCart: () => Promise<void> | void;
  totalItemsCount: number;
}

const CART_STORAGE_KEY = 'winsor_cart';

// Helper to sanitize product snapshot before saving into localStorage
const sanitizeProductSnapshot = (product?: IProduct): IProduct | undefined => {
  if (!product) return undefined;
  return {
    _id: product._id,
    title: product.title,
    price: product.price,
    thumbnail: product.thumbnail ? { url: product.thumbnail.url } : undefined,
    modelNo: product.modelNo || '',
    colorVariants: product.colorVariants || [],
    isSoldOut: product.isSoldOut || false,
    giftCategories: product.giftCategories || [],
    description: product.description || '',
  } as IProduct;
};

// Helper to serialize items for localStorage
const serializeCartItems = (items: CartItem[]): string => {
  const sanitized = items.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    colorVariant: item.colorVariant || '',
    variantImage: item.variantImage || '',
    product: sanitizeProductSnapshot(item.product),
  }));
  return JSON.stringify(sanitized);
};

// Helper to safely read from localStorage
const readStoredCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      productId: item.productId,
      quantity: Math.max(1, Number(item.quantity) || 1),
      colorVariant: item.colorVariant || '',
      variantImage: item.variantImage || '',
      product: item.product && typeof item.product === 'object' ? item.product : undefined,
    }));
  } catch (err) {
    console.warn('Failed to parse cart from localStorage:', err);
    return [];
  }
};

// Helper to safely write to localStorage & notify
const writeStoredCart = (items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, serializeCartItems(items));
    window.dispatchEvent(new CustomEvent('winsor_cart_updated', { detail: items }));
  } catch (err) {
    console.warn('Failed to save cart to localStorage:', err);
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to map DB items to frontend items
  const mapDbItems = (dbItems: any[]): CartItem[] => {
    return dbItems.map((item) => {
      const productObj = item.productId && typeof item.productId === 'object' ? item.productId : undefined;
      const variantObj = productObj?.colorVariants?.find((v: any) => v.colorName === item.colorVariant);
      return {
        productId: productObj?._id || item.productId,
        quantity: item.quantity,
        colorVariant: item.colorVariant || '',
        variantImage: variantObj?.image?.url || '',
        product: sanitizeProductSnapshot(productObj),
      };
    });
  };

  // Helper to map local items to DB payload
  const mapToDbPayload = (items: CartItem[]) => {
    return items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      colorVariant: item.colorVariant || '',
    }));
  };

  // Helper to merge two arrays of cart items safely without losing products or items
  const mergeCartItems = (localItems: CartItem[], serverItems: CartItem[]): CartItem[] => {
    const merged: CartItem[] = [...serverItems];
    for (const local of localItems) {
      const existingIdx = merged.findIndex(
        item => item.productId === local.productId && (item.colorVariant || '') === (local.colorVariant || '')
      );
      if (existingIdx > -1) {
        if (!merged[existingIdx].product && local.product) {
          merged[existingIdx].product = local.product;
        }
        merged[existingIdx].quantity = Math.max(merged[existingIdx].quantity, local.quantity);
      } else {
        merged.push(local);
      }
    }
    return merged;
  };

  // Helper to persist in localStorage immediately and sync to server if signed in
  const syncToServer = async (items: CartItem[]) => {
    if (!isSignedIn) return;
    try {
      await fetch('/api/customer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: mapToDbPayload(items), clerkId: user?.id }),
      });
    } catch (err) {
      console.warn('Failed to sync cart to server:', err);
    }
  };

  // Synchronous and immediate local persistence + non-blocking background server sync
  const persistCart = (newItems: CartItem[]) => {
    setCartItems(newItems);
    writeStoredCart(newItems);
    if (isSignedIn) {
      syncToServer(newItems);
    }
  };

  // 1. Instant client-side hydration from localStorage (0ms on mount)
  useEffect(() => {
    const cached = readStoredCart();
    if (cached.length > 0) {
      setCartItems(cached);
    }
    setLoading(false);
  }, []);

  // 2. Cross-tab and window event synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          const updated = readStoredCart();
          setCartItems(updated);
        } catch (err) {
          console.warn('Failed to handle storage event for cart:', err);
        }
      }
    };

    const handleCustomUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCartItems(e.detail);
      } else {
        setCartItems(readStoredCart());
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('winsor_cart_updated', handleCustomUpdate);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('winsor_cart_updated', handleCustomUpdate);
    };
  }, []);

  // 3. Load & sync cart when Clerk auth state is ready
  useEffect(() => {
    if (!isLoaded) return;

    let isMounted = true;

    const loadAndSync = async () => {
      if (isSignedIn) {
        try {
          // 1. Fetch server cart
          const res = await fetch(`/api/customer/cart${user?.id ? '?clerkId=' + user.id : ''}`);
          let data: any = { success: false };
          try {
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
              data = await res.json();
            }
          } catch (e) {
            console.warn('Failed to parse server cart JSON:', e);
          }

          let serverItems: CartItem[] = [];
          if (data.success && data.data?.items) {
            serverItems = mapDbItems(data.data.items);
          }

          // 2. Read local cart snapshot
          const localItems = readStoredCart();

          let finalCart: CartItem[];
          if (localItems.length > 0 && serverItems.length > 0) {
            finalCart = mergeCartItems(localItems, serverItems);
          } else if (localItems.length > 0) {
            // Local has items, server had none (e.g. freshly added items before sync)
            finalCart = localItems;
          } else {
            finalCart = serverItems;
          }

          if (isMounted) {
            setCartItems(finalCart);
            writeStoredCart(finalCart);
          }

          // Persist merged cart to server if needed
          if (localItems.length > 0 || (finalCart.length > 0 && serverItems.length === 0)) {
            try {
              await fetch('/api/customer/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: mapToDbPayload(finalCart) }),
              });
            } catch (saveErr) {
              console.warn('Failed to persist merged cart to server:', saveErr);
            }
          }
        } catch (err) {
          console.warn('Failed to sync/fetch cart:', err);
        }
      } else {
        // Signed out: check if any items need product info backfill
        try {
          const localItems = readStoredCart();
          const missingProduct = localItems.some(item => !item.product);
          if (missingProduct && localItems.length > 0) {
            const res = await fetch('/api/products');
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
              const data = await res.json();
              if (data.success && Array.isArray(data.data)) {
                const allProducts: IProduct[] = data.data;
                const populated = localItems.map(item => {
                  if (item.product) return item;
                  const prod = allProducts.find(p => p._id === item.productId);
                  return prod ? { ...item, product: sanitizeProductSnapshot(prod) } : item;
                });
                if (isMounted) {
                  setCartItems(populated);
                  writeStoredCart(populated);
                }
              }
            }
          }
        } catch (err) {
          console.warn('Failed to load local cart products:', err);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    loadAndSync();

    return () => {
      isMounted = false;
    };
  }, [isSignedIn, isLoaded]);

  const addToCart = async (productId: string, quantity: number, colorVariant?: string, product?: IProduct) => {
    let resolvedProduct = product;

    // Fetch product if not passed in parameters (e.g. general listing triggers)
    if (!resolvedProduct) {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (data.success && data.data) {
          resolvedProduct = data.data;
        }
      } catch (err) {
        console.error('Failed to fetch product details for stock validation:', err);
      }
    }

    // Inventory stock check validation
    if (resolvedProduct && resolvedProduct.colorVariants && resolvedProduct.colorVariants.length > 0) {
      let variant = resolvedProduct.colorVariants[0]; // fallback default
      if (colorVariant) {
        const found = resolvedProduct.colorVariants.find(v => v.colorName === colorVariant);
        if (found) variant = found;
      }

      const maxStock = variant.qty;
      const currentInCart = cartItems.find(
        item => item.productId === productId && (item.colorVariant || '') === (colorVariant || '')
      )?.quantity || 0;

      if (currentInCart + quantity > maxStock) {
        toast.error(`Sorry, only ${maxStock} item(s) available in stock for this timepiece.`);
        return;
      }
    }

    const variantObj = resolvedProduct?.colorVariants?.find(v => v.colorName === colorVariant);
    const variantImage = variantObj?.image?.url || '';

    const existingIdx = cartItems.findIndex(
      item => item.productId === productId && (item.colorVariant || '') === (colorVariant || '')
    );

    let updated: CartItem[];
    if (existingIdx > -1) {
      updated = [...cartItems];
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: updated[existingIdx].quantity + quantity,
        variantImage: updated[existingIdx].variantImage || variantImage || '',
        product: updated[existingIdx].product || sanitizeProductSnapshot(resolvedProduct),
      };
    } else {
      updated = [
        ...cartItems,
        {
          productId,
          quantity,
          colorVariant: colorVariant || '',
          variantImage: variantImage || '',
          product: sanitizeProductSnapshot(resolvedProduct),
        },
      ];
    }

    // 1. Immediately persist synchronously (0ms) - ensures localStorage & state are written BEFORE any user navigation
    persistCart(updated);

    // 2. Show custom toast notification with Next.js Link
    const watchName = resolvedProduct?.title || 'Timepiece';
    const watchImg = variantImage || resolvedProduct?.thumbnail?.url || '/graduation_gift.png';
    const variantText = colorVariant ? ` (${colorVariant})` : '';

    toast.custom(
      (t) => (
        <div
          className={t.visible ? 'animate-enter' : 'animate-leave'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: '#1a1209',
            border: '1px solid #8B6914',
            padding: '12px 18px',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            minWidth: '320px',
            maxWidth: '450px',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Jost', sans-serif",
            animation: t.visible ? 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'toastSlideOut 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            pointerEvents: 'auto',
          }}
        >
          {/* Watch thumbnail */}
          <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '4px', overflow: 'hidden', background: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', flexShrink: 0 }}>
            <img
              src={watchImg}
              alt={watchName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '9px', letterSpacing: '0.15em', color: '#dfb15b', fontWeight: 600, textTransform: 'uppercase' }}>
              Timepiece Added
            </p>
            <h4 style={{ margin: '2px 0 0', fontSize: '13px', color: '#ffffff', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
              {watchName}{variantText}
            </h4>
          </div>

          {/* Action button - Next.js Link for instant SPA navigation */}
          <Link
            href="/cart"
            onClick={() => toast.dismiss(t.id)}
            style={{
              padding: '6px 14px',
              background: '#8B6914',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              textDecoration: 'none',
              borderRadius: '4px',
              transition: 'background 0.2s ease',
              display: 'inline-block',
            }}
          >
            Cart
          </Link>

          {/* Durative progress bar */}
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '2px',
              background: '#dfb15b',
              width: '100%',
              transformOrigin: 'left',
              animation: 'toastProgress 4s linear forwards',
            }}
          />

          {/* Embedded animations style */}
          <style>{`
            @keyframes toastSlideIn {
              from { transform: translateY(-20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes toastSlideOut {
              from { transform: translateY(0); opacity: 1; }
              to { transform: translateY(-20px); opacity: 0; }
            }
            @keyframes toastProgress {
              from { transform: scaleX(1); }
              to { transform: scaleX(0); }
            }
          `}</style>
        </div>
      ),
      { duration: 4000 }
    );
  };

  const removeFromCart = (productId: string, colorVariant?: string) => {
    const updated = cartItems.filter(
      item => !(item.productId === productId && (item.colorVariant || '') === (colorVariant || ''))
    );
    persistCart(updated);
  };

  const updateQuantity = (productId: string, quantity: number, colorVariant?: string) => {
    if (quantity < 1) return;

    // Validate inventory stock limits
    const item = cartItems.find(i => i.productId === productId && (i.colorVariant || '') === (colorVariant || ''));
    if (item && item.product && item.product.colorVariants) {
      let variant = item.product.colorVariants[0];
      if (colorVariant) {
        const found = item.product.colorVariants.find(v => v.colorName === colorVariant);
        if (found) variant = found;
      }

      if (variant && quantity > variant.qty) {
        toast.error(`Sorry, only ${variant.qty} item(s) available in stock for this timepiece.`);
        return;
      }
    }

    const updated = cartItems.map(item => {
      if (item.productId === productId && (item.colorVariant || '') === (colorVariant || '')) {
        return { ...item, quantity };
      }
      return item;
    });
    persistCart(updated);
  };

  const clearCart = () => {
    setCartItems([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('winsor_cart_updated', { detail: [] }));
      } catch (err) {
        console.warn('Failed to clear cart from localStorage:', err);
      }
    }
    if (isSignedIn) {
      syncToServer([]);
    }
  };

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
