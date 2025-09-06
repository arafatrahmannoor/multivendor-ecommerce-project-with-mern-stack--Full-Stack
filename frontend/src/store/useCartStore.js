import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      // Cart state
      items: [],
      isOpen: false,

      // Actions
      addItem: (product, quantity = 1, variant = null) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          item => item.product._id === product._id && 
                  JSON.stringify(item.variant) === JSON.stringify(variant)
        );

        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;
          set({ items: updatedItems });
        } else {
          // Add new item
          const newItem = {
            id: `${product._id}-${Date.now()}`,
            product,
            quantity,
            variant,
            addedAt: new Date().toISOString()
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (itemId) => {
        const { items } = get();
        set({ items: items.filter(item => item.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        const updatedItems = items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        set({ items: updatedItems });
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set(state => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      // Computed values
      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = item.variant?.price || item.product.price;
          return total + (price * item.quantity);
        }, 0);
      },

      getCartItems: () => {
        return get().items;
      },

      // Shipping calculation
      getShippingCost: () => {
        const { items } = get();
        const totalPrice = get().getTotalPrice();
        
        // Free shipping over $100
        if (totalPrice >= 100) return 0;
        
        // $10 flat rate
        return items.length > 0 ? 10 : 0;
      },

      // Grand total including shipping
      getGrandTotal: () => {
        return get().getTotalPrice() + get().getShippingCost();
      }
    }),
    {
      name: 'e-commerce-cart',
      partialize: (state) => ({
        items: state.items
      })
    }
  )
);

export default useCartStore;
