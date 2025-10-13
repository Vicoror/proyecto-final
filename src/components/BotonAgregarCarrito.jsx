// components/BotonAgregarCarrito.jsx
import { useCart } from "@/components/CartContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

const BotonAgregarCarrito = ({ producto, className = "" }) => {
  const { addToCart, cartItems } = useCart();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensajeModal, setMensajeModal] = useState("");

  useEffect(() => {
    document.body.style.overflow = mostrarModal ? "hidden" : "";
  }, [mostrarModal]);

  const handleAgregar = () => {
    console.log("🔍 DEBUG BotonAgregarCarrito - INICIO:", {
      nombre: producto.name,
      categoria: producto.categoria,
      talla: producto.talla,
      id_stock: producto.id_stock,
      stock: producto.stock,
      productoCompleto: producto
    });

    if (producto.categoria === "Anillos") {
      if (!producto.talla) {
        setMensajeModal("Seleccione una talla antes de agregar al carrito.");
        setMostrarModal(true);
        return;
      }

      if (producto.tipo !== "personalizado" && Number(producto.stock || 0) <= 0) {
        setMensajeModal("No hay stock disponible para esta talla.");
        setMostrarModal(true);
        return;
      }

      addToCart(producto);
      setMensajeModal("¡Producto añadido al carrito!");
      setMostrarModal(true);
      return;
    }

    const existente = cartItems.find((item) => item.id === producto.id);
    const cantidadActual = existente ? existente.quantity : 0;
    const stockDisponible = Number(producto.stock);

    if (stockDisponible <= 0) {
      setMensajeModal("No hay stock disponible.");
    } else if (cantidadActual + 1 > stockDisponible) {
      setMensajeModal("Stock máximo alcanzado");
    } else {
      addToCart(producto);
      setMensajeModal("¡Producto añadido al carrito!");
    }

    setMostrarModal(true);
  };

  return (
    <>
      <button
        onClick={handleAgregar}
        disabled={producto.tipo !== "personalizado" && producto.stock === 0}
        className={`w-full py-2 rounded-lg text-white font-semibold transition-colors ${
          (producto.tipo !== "personalizado" && producto.stock === 0)
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#762114] hover:bg-[#DC9C5C]"
        } ${className}`}
      >
        Agregar al carrito
      </button>

      {mostrarModal &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-[90%] sm:max-w-sm w-full text-center mx-4">
              <h2 className="text-lg sm:text-xl font-semibold text-[#762114] mb-4">
                {mensajeModal}
              </h2>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="border border-[#762114] text-[#762114] px-4 py-2 rounded-lg hover:bg-[#F5F1F1] text-sm"
                >
                  Volver
                </button>

                {mensajeModal === "¡Producto añadido al carrito!" && (
                  <Link href="/Carrito">
                    <button className="bg-[#762114] text-white px-4 py-2 rounded-lg hover:bg-[#DC9C5C] text-sm">
                      Ver carrito
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default BotonAgregarCarrito;
