"use client";
import { createContext, useContext, useState } from "react";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (producto) => {
  setCartItems((prev) => {
    const existente = prev.find(
      (item) => (item.id || item.id) === (producto.id || producto.id)
    );

    if (existente) {
      if (existente.quantity + 1 > Number(producto.stock)) return prev;
      return prev.map((item) =>
        (item.id || item.id) === (producto.id || producto.id)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }

    return [...prev, { ...producto, quantity: 1 }];
  });
};


  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                newQuantity < 1
                  ? 1
                  : newQuantity > Number(item.stock)
                  ? Number(item.stock)
                  : newQuantity,
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
