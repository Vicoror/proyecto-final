"use client";

import { useCart } from "@/components/CartContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from 'next/link';
import { useAuth } from "@/components/AuthContext";
import CotizadorEnvios from "@/components/CotizadorEnvios";

const VerCarrito = () => {
  const { cartItems, updateQuantity, removeItem, clearCart } = useCart();
  const router = useRouter();
  const [confirmClear, setConfirmClear] = useState(false);
 const { isLoggedIn, loading } = useAuth();

 const subtotal = cartItems.reduce((total, item) => {
  const precio = item.precio ?? item.price; // Usa item.precio si existe, si no usa item.price
  return total + Number(precio) * Number(item.quantity);
  }, 0);


  const totalItems = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);


  const handleFinalizar = () => {
  if (loading) return; // aún no se sabe si está logueado

  if (!isLoggedIn) {
    router.push("/login");
  } else {
    router.push("/direccion-envio");
  }
};


  return (
    <div className="fixed top-0 right-0 w-full sm:w-[400px] h-full bg-white shadow-lg z-50 p-4 overflow-y-auto transition-all">
      {/* Cerrar carrito completo */}
     <div className="flex justify-between items-center">
        <Link href="/">
          <span
            onClick={() => window.history.back()}
            className="text-[#762114] hover:underline cursor-pointer"
          >
            ← Seguir comprando
          </span>
        </Link>
        <button
          onClick={() => setConfirmClear(true)}
          className="text-red-600 font-bold text-xl"
        >
          ×
        </button>
      </div>


      {confirmClear && (
        <div className="bg-white border p-4 rounded-lg shadow-md text-center mt-4">
          <p className="mb-2 font-semibold">¿Estás segur@ de eliminar todo el pedido?</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setConfirmClear(false)}
              className="text-sm px-4 py-2 rounded bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                clearCart();
                router.push("/");
              }}
              className="text-sm px-4 py-2 rounded bg-red-500 text-white"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      )}

      {/* Productos normales */}

      <h2 className="text-lg font-bold text-[#762114] mt-2 mb-4">Productos</h2>
      {cartItems
        .filter((p) => p.tipo !== "personalizado")
        .map((item) => (
          <div key={`normal-${item.id}`} className="border-b py-3">
            <div className="flex gap-3">
              {item.image ? (
              <Image
                src={item.image}
                alt={item.name || "Producto"}
                width={80}
                height={60}
                className="rounded object-cover"
              />
            ) : (
              <div className="w-15 h-15 bg-gray-200 rounded" />
            )}


              <div className="flex-grow">
                <h3 className="font-semibold text-sm">{item.name}</h3>
                {item.talla && (
                  <p className="text-xs text-gray-600">Talla: {item.talla}</p>
                )}
                <p className="text-xs text-gray-600">Precio: ${item.price}</p>
                <div className="flex items-center mt-1 gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="px-2 border rounded text-sm"
                  >
                    -
                  </button>
                  <span className="text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= Number(item.stock)}
                    className="px-2 border rounded text-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-auto text-red-500 text-sm"
                    aria-label={`Eliminar ${item.name} del carrito`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Productos personalizados */}
<h2 className="text-lg font-bold text-[#762114] mt-6 mb-4">
  Productos Personalizados
</h2>
{cartItems
  .filter((p) => p.tipo === "personalizado")
  .map((item) => {
    const materiales = Array.isArray(item.materiales)
      ? item.materiales
      : typeof item.materiales === "string"
        ? item.materiales.split(",")
        : [];

    return (
      <div key={`personalizado-${item.id}`} className="border-b py-3">
        <div className="flex gap-3">
          {item.imagen ? (
            <Image
              src={item.imagen}
              alt={item.name || "Producto"}
              width={80}
              height={60}
              className="rounded object-cover"
            />
          ) : (
            <div className="w-[60px] h-[60px] bg-gray-200 rounded" />
          )}

          <div className="flex-grow">
            <h3 className="font-semibold text-sm">{item.nombre}</h3>
           <p className="text-xs text-gray-600">
              Materiales:{" "}
              {item.materiales &&
                Object.entries(item.materiales)
                  .map(([key, valor]) => {
                    const nombresVisibles = {
                      metale: "Metal",
                      piedra: "Piedra",
                      hilo: "Hilo",
                };

                    // Obtener nombre o color si es objeto, o el valor directamente si es string
                    const nombre =
                      typeof valor === "object"
                        ? valor?.nombre || valor?.color
                        : valor;

                    // Si no hay nombre, no incluir este material
                    if (!nombre) return null;

                    return `${nombresVisibles[key] || key}: ${nombre}`;
                  })
                  .filter(Boolean) // Quita los null
                  .join(", ")}
            </p>



            <p className="text-xs text-gray-600">Precio: ${item.precio}</p>

            <div className="flex items-center mt-1 gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="px-2 border rounded text-sm"
              >
                -
              </button>
              <span className="text-sm">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= 10}
                className="px-2 border rounded text-sm"
              >
                +
              </button>
              <button
                onClick={() => removeItem(item.id)}
                className="ml-auto text-red-500 text-sm hover:text-red-700"
                aria-label={`Eliminar ${item.nombre} del carrito`}
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })}
      <h2 className="text-lg font-bold text-[#762114] mt-6 mb-4">
        Escoge tipo de envio
      </h2>
      <div>
          <CotizadorEnvios/>
        </div>
      {/* Resumen y acción */}
      <div className="mt-6 text-right border-t pt-4">
        <p className="text-sm mb-1 text-gray-600">Piezas: {totalItems}</p>
        <p className="text-lg font-bold text-[#762114] mb-3">
          Subtotal: ${subtotal.toFixed(2)}
        </p>
        <button
          onClick={handleFinalizar}
          disabled={cartItems.length === 0}
          className={`w-full py-2 rounded-lg transition cursor-pointer font-semibold
            ${cartItems.length === 0
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-[#762114] text-white hover:bg-[#DC9C5C]"}`}
        >
          Comprar
        </button>

      </div>
    </div>
  );
};

export default VerCarrito;
