
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { siteContent } from '@/lib/content';
import { getImage } from '@/lib/images';

export interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
  isUpsell?: boolean;
}

export interface UpsellConfig {
  id?: string;
  enabled?: boolean;
  name: string;
  image: string;
  price: number;
  label?: string;
  sourceProductSlug?: string;
}

interface OrderDetailsForStorage {
    customer: {
        email: string;
        phone?: string;
        firstName: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
    };
    orderId: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem, upsells?: UpsellConfig[]) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearCartAndOrder: (orderDetails: OrderDetailsForStorage) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const communityUpsellItem: CartItem = {
    id: 'community-access-free',
    name: '1 Año de Acceso a la Comunidad',
    price: 0,
    quantity: 1,
    image: getImage(siteContent.homePage.communitySection.cartImage),
    color: 'GRATIS',
    isUpsell: true,
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
        localStorage.removeItem('cart');
    } finally {
        setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error("Failed to save cart to localStorage", error);
      }
    }
  }, [cartItems, isInitialized]);

  const addToCart = useCallback((itemToAdd: CartItem, productUpsells?: UpsellConfig[]) => {
    setCartItems(currentItems => {
      try {
        let newItems = [...currentItems];
        const existingItemIndex = newItems.findIndex(item => item.id === itemToAdd.id);
        const wasEmpty = newItems.filter(item => !item.isUpsell).length === 0;

        if (existingItemIndex > -1) {
          newItems[existingItemIndex].quantity += itemToAdd.quantity;
        } else {
          newItems.push({ ...itemToAdd });
        }

        // Add upsells only if a main product is being added to a previously empty cart.
        if (wasEmpty && !itemToAdd.isUpsell) {
          if (Array.isArray(productUpsells)) {
            // Per-product upsells override the global default. Empty array means "no upsells".
            productUpsells
              .filter((u) => u && u.enabled !== false && (u.name || '').trim().length > 0)
              .forEach((u, idx) => {
                const upsellId = u.id || `upsell-${itemToAdd.id}-${idx}`;
                if (newItems.some((i) => i.id === upsellId)) return;
                newItems.push({
                  id: upsellId,
                  name: u.name,
                  image: getImage(u.image || ''),
                  price: typeof u.price === 'number' ? u.price : 0,
                  quantity: 1,
                  color: u.label || (u.price === 0 ? 'GRATIS' : undefined),
                  isUpsell: true,
                });
              });
          } else {
            // Legacy fallback: global community upsell.
            const communityCartImage = siteContent?.homePage?.communitySection?.cartImage;
            if (communityCartImage) {
              const hasUpsell = newItems.some(item => item.id === communityUpsellItem.id);
              if (!hasUpsell) {
                newItems.push({
                  ...communityUpsellItem,
                  image: getImage(communityCartImage),
                });
              }
            }
          }
        }

        return newItems;
      } catch (e) {
        console.error("Error in addToCart:", e);
        return currentItems;
      }
    });
  }, []);
  
  const removeFromCart = useCallback((id: string) => {
    setCartItems(currentItems => {
      let newItems = currentItems.filter(item => item.id !== id);
      
      // If the last main product is removed, clear the cart completely
      const hasMainProduct = newItems.some(item => !item.isUpsell);
      if (!hasMainProduct) {
        return [];
      }
      
      return newItems;
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const clearCartAndOrder = useCallback((orderDetails: OrderDetailsForStorage) => {
    try {
        localStorage.setItem('lastOrder', JSON.stringify(orderDetails));
        setCartItems([]);
    } catch (error) {
        console.error("Failed to save order details to localStorage", error);
    }
  }, []);


  const contextValue = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearCartAndOrder,
    isCartOpen,
    setIsCartOpen,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
