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
    const existingIdx = cartItems.findIndex(
      item => item.productId === productId && item.colorVariant === colorVariant
    );

    let updated: CartItem[];
    if (existingIdx > -1) {
      updated = [...cartItems];
      updated[existingIdx].quantity += quantity;
    } else {
      updated = [...cartItems, { productId, quantity, colorVariant, product }];
    }

    // If product is not provided (e.g. from generic detail triggers), fetch it if guest
    if (!product && !isSignedIn) {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const idx = updated.findIndex(
            item => item.productId === productId && item.colorVariant === colorVariant
          );
          if (idx > -1) {
            updated[idx].product = data.data;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

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
