"use client";
import { useCart } from "./CartContext";
import { useState } from "react";
import { FiShoppingBag } from "react-icons/fi";
import Link from "next/link"; // 👉 Agregado para la navegación

const IconoCarrito = () => {
  const { cartItems } = useCart();
  const [mostrar, setMostrar] = useState(false);

  const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      onMouseEnter={() => setMostrar(true)}
      onMouseLeave={() => setMostrar(false)}
      className="relative inline-block"
    >
      <Link href="/Carrito">
        <button className="text-2xl flex items-center">
          <FiShoppingBag />
          {total > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1">
              {total}
            </span>
          )}
        </button>
      </Link>

      {mostrar && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg border rounded-lg p-4 z-50 text-[#762114]">
          <h4 className="font-bold mb-2 text-sm">Productos en el carrito:</h4>
          {cartItems.length === 0 ? (
            <p className="text-sm text-center">Tu carrito está vacío.</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {cartItems.map((item, index) => (
          <li key={`${item.id}-${item.nombre || item.name}-${index}`} className="border-b pb-2">
            <div className="flex justify-between">
              <span className="text-sm">{item.nombre || item.name}</span>
              <span className="text-sm font-semibold">x{item.quantity}</span>
        </div>
  </li>
))}

            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default IconoCarrito;
