"use client";
import { createContext, useContext, useState } from "react";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // 🔹 Agregar producto al carrito
  const addToCart = (producto) => {
    setCartItems((prev) => {
      // 🔹 Crear ID único
      const uniqueId =
        producto.categoria === "Anillos"
          ? `${producto.id}-${producto.id_stock || "0"}-${producto.talla || "0"}`
          : producto.tipo === "personalizado"
          ? `${producto.id}-${Date.now()}` // productos personalizados únicos por tiempo
          : `${producto.id}`;

      // 🔹 DEBUG: Ver qué se está generando
      console.log("🛒 DEBUG addToCart:", {
        producto: producto.name,
        categoria: producto.categoria,
        id: producto.id,
        id_stock: producto.id_stock,
        talla: producto.talla,
        uniqueIdGenerado: uniqueId
      });

      // 🔹 Buscar producto existente
      const stockDisponible = Number(producto.stock || 0);

      // 🔹 Buscar producto existente
      const existe = prev.find((item) => item.uniqueId === uniqueId);

      if (existe) {
        if (producto.tipo !== "personalizado" && existe.quantity + 1 > stockDisponible)
          return prev; // solo checar stock en productos normales
        return prev.map((item) =>
          item.uniqueId === uniqueId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // 🔹 CORREGIDO: Guardar tanto talla como id_stock
      return [...prev, { 
        ...producto, 
        quantity: 1, 
        uniqueId,  
        talla: producto.talla || null,
        id_stock: producto.id_stock || null  // ← ESTO FALTABA
      }];
    });
  };

  // 🔹 Eliminar producto
  const removeItem = (uniqueId) => {
    setCartItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
  };

  // 🔹 Actualizar cantidad
  const updateQuantity = (uniqueId, newQuantity) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.uniqueId !== uniqueId) return item;

        // Para productos normales, limitar por stock
        if (item.tipo !== "personalizado") {
          const stockDisponible = Number(item.stock || 0);
          return {
            ...item,
            quantity:
              newQuantity < 1
                ? 1
                : newQuantity > stockDisponible
                ? stockDisponible
                : newQuantity,
          };
        }

        // Para personalizados, permitir incrementar libremente (o poner un límite alto)
        return {
          ...item,
          quantity: newQuantity < 1 ? 1 : newQuantity > 99 ? 99 : newQuantity,
        };
      })
    );
  };

  // 🔹 Limpiar carrito
  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
