'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { IProduct } from '@/types';
import { toast } from 'react-hot-toast';

export interface CartItem {
  productId: string;
  quantity: number;
  colorVariant?: string;
  product?: IProduct;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity: number, colorVariant?: string, product?: IProduct) => void;
  removeFromCart: (productId: string, colorVariant?: string) => void;
  updateQuantity: (productId: string, quantity: number, colorVariant?: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isSyncingRef = useRef(false);

  // Helper to map DB items to frontend items
  const mapDbItems = (dbItems: any[]): CartItem[] => {
    return dbItems.map((item) => ({
      productId: item.productId?._id || item.productId,
      quantity: item.quantity,
      colorVariant: item.colorVariant || '',
      product: item.productId && typeof item.productId === 'object' ? item.productId : undefined,
    }));
  };

  // Helper to map local items to DB payload
  const mapToDbPayload = (items: CartItem[]) => {
    return items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      colorVariant: item.colorVariant || '',
    }));
  };

  // Helper to merge two arrays of cart items
  const mergeCartItems = (localItems: CartItem[], serverItems: CartItem[]): CartItem[] => {
    const merged: CartItem[] = [...serverItems];
    for (const local of localItems) {
      const existingIdx = merged.findIndex(
        item => item.productId === local.productId && item.colorVariant === local.colorVariant
      );
      if (existingIdx > -1) {
        merged[existingIdx].quantity += local.quantity;
      } else {
        merged.push(local);
      }
    }
    return merged;
  };

  // Load and sync cart
  useEffect(() => {
    if (!isLoaded) return;

    const loadAndSync = async () => {
      setLoading(true);
      if (isSignedIn) {
        try {
          // 1. Fetch server cart
          const res = await fetch('/api/customer/cart');
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

          // 2. Read local guest cart safely
          const localStr = localStorage.getItem('winsor_cart');
          let localItems: CartItem[] = [];
          if (localStr) {
            try {
              localItems = JSON.parse(localStr);
            } catch (e) {
              console.warn('Failed to parse local guest cart JSON:', e);
            }
          }

          if (localItems.length > 0) {
            // Merge local guest cart and server cart
            const merged = mergeCartItems(localItems, serverItems);
            
            // Save merged to server
            const saveRes = await fetch('/api/customer/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: mapToDbPayload(merged) }),
            });
            let saveData: any = { success: false };
            try {
              if (saveRes.ok && saveRes.headers.get('content-type')?.includes('application/json')) {
                saveData = await saveRes.json();
              }
            } catch (e) {
              console.warn('Failed to parse saved cart JSON:', e);
            }
            
            if (saveData.success && saveData.data?.items) {
              setCartItems(mapDbItems(saveData.data.items));
            } else {
              setCartItems(merged);
            }
            
            // Clear guest cart
            localStorage.removeItem('winsor_cart');
            toast.success('Your guest cart items have been synced to your account.');
          } else {
            setCartItems(serverItems);
          }
        } catch (err) {
          console.warn('Failed to sync/fetch cart:', err);
        }
      } else {
        // Signed out: Read local storage safely
        try {
          const localStr = localStorage.getItem('winsor_cart');
          let localItems: CartItem[] = [];
          if (localStr) {
            try {
              localItems = JSON.parse(localStr);
            } catch (e) {
              console.warn('Failed to parse local guest cart JSON:', e);
            }
          }
          
          if (localItems.length > 0) {
            // Populate products info for display
            const res = await fetch('/api/products');
            let data: any = { success: false };
            try {
              if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                data = await res.json();
              }
            } catch (e) {
              console.warn('Failed to parse products JSON:', e);
            }

            if (data.success && data.data) {
              const allProducts: IProduct[] = data.data;
              const populated = localItems.map(item => {
                const prod = allProducts.find(p => p._id === item.productId);
                return { ...item, product: prod };
              });
              setCartItems(populated);
            } else {
              setCartItems(localItems);
            }
          } else {
            setCartItems([]);
          }
        } catch (err) {
          console.warn('Failed to load local cart:', err);
        }
      }
      setLoading(false);
    };

    loadAndSync();
  }, [isSignedIn, isLoaded]);

  // Save changes helper
  const saveCart = async (newItems: CartItem[]) => {
    setCartItems(newItems);
    if (isSignedIn) {
      try {
        await fetch('/api/customer/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: mapToDbPayload(newItems) }),
        });
      } catch (err) {
        console.warn('Failed to save cart to server:', err);
      }
    } else {
      localStorage.setItem('winsor_cart', JSON.stringify(newItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        colorVariant: item.colorVariant,
      }))));
    }
  };

  const addToCart = async (productId: string, quantity: number, colorVariant?: string, product?: IProduct) => {
    let resolvedProduct = product;

    // Fetch product if not passed in parameters (e.g. guest or general listing triggers)
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
        item => item.productId === productId && item.colorVariant === colorVariant
      )?.quantity || 0;

      if (currentInCart + quantity > maxStock) {
        toast.error(`Sorry, only ${maxStock} item(s) available in stock for this timepiece.`);
        return;
      }
    }

    const existingIdx = cartItems.findIndex(
      item => item.productId === productId && item.colorVariant === colorVariant
    );

    let updated: CartItem[];
    if (existingIdx > -1) {
      updated = [...cartItems];
      updated[existingIdx].quantity += quantity;
      if (!updated[existingIdx].product && resolvedProduct) {
        updated[existingIdx].product = resolvedProduct;
      }
    } else {
      updated = [...cartItems, { productId, quantity, colorVariant, product: resolvedProduct }];
    }

    // Show custom toast notification
    const watchName = product?.title || 'Timepiece';
    const watchImg = product?.thumbnail?.url || '/graduation_gift.png';
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

          {/* Action button */}
          <a
            href="/cart"
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
            }}
          >
            Cart
          </a>

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

    await saveCart(updated);
  };

  const removeFromCart = async (productId: string, colorVariant?: string) => {
    const updated = cartItems.filter(
      item => !(item.productId === productId && item.colorVariant === colorVariant)
    );
    await saveCart(updated);
  };

  const updateQuantity = async (productId: string, quantity: number, colorVariant?: string) => {
    if (quantity < 1) return;

    // Validate inventory stock limits
    const item = cartItems.find(i => i.productId === productId && i.colorVariant === colorVariant);
    if (item && item.product && item.product.colorVariants) {
      let variant = item.product.colorVariants[0];
      if (colorVariant) {
        const found = item.product.colorVariants.find(v => v.colorName === colorVariant);
        if (found) variant = found;
      }

      if (quantity > variant.qty) {
        toast.error(`Sorry, only ${variant.qty} item(s) available in stock for this timepiece.`);
        return;
      }
    }

    const updated = cartItems.map(item => {
      if (item.productId === productId && item.colorVariant === colorVariant) {
        return { ...item, quantity };
      }
      return item;
    });
    await saveCart(updated);
  };

  const clearCart = async () => {
    await saveCart([]);
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
