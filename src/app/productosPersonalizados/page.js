"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiShoppingCart, FiUser, FiHome } from "react-icons/fi";
import Link from "next/link";

export default function Component() {
  const router = useRouter();
  const [cartItems] = useState(0); // Ejemplo de estado para el carrito

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4 sm:p-6 relative"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black opacity-40"></div>
      
      {/* Header con navegación */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <Link href="/" className="flex items-center">
          <h1 
            className="text-3xl md:text-4xl font-bold text-[#7B2710] cursor-pointer transition-all duration-300 hover:scale-105"
            style={{ fontFamily: 'Alex Brush' }}
          >
            Bernarda Sierra
          </h1>
          <FiHome className="ml-2 text-[#7B2710] text-2xl" />
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-[#7B2710] hover:text-[#DC9C5C] transition-colors duration-300">
            <FiUser className="text-2xl" />
          </Link>
          <button 
            className="text-[#7B2710] hover:text-[#DC9C5C] relative transition-colors duration-300"
            onClick={() => router.push('/cart')}
          >
            <FiShoppingCart className="text-2xl" />
            {cartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#DC9C5C] text-[#F5F1F1] text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}