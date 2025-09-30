"use client";

import { useEffect, useState } from "react";
import { FiX, FiZoomIn, FiArrowRight } from "react-icons/fi";
import Image from "next/image";
import BotonAgregarCarrito from "@/components/BotonAgregarCarrito";
import IconoCarrito from "@/components/IconoCarrito";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function VerProducto({ idProducto, onClose }) {
  const [producto, setProducto] = useState(null);
  const [stockTallas, setStockTallas] = useState([]);
  const [selectedTalla, setSelectedTalla] = useState("");
  const [error, setError] = useState("");
  const [imagenSeleccionadaIndex, setImagenSeleccionadaIndex] = useState(null);
  const [isButtonGlowing, setIsButtonGlowing] = useState(false);
  const [mostrarTallas, setMostrarTallas] = useState(false);
  const router = useRouter();
  const stockSeleccionado = stockTallas.find(t => t.talla === selectedTalla);
  const [fotoTallas, setFotoTallas] = useState("");

  useEffect(() => {
    if (!idProducto) return;

    const fetchProducto = async () => {
      try {
        const res = await fetch(`/api/productos?id=${idProducto}`);
        if (!res.ok) throw new Error("No se pudo obtener el producto.");
        const data = await res.json();
        setProducto(data);

        if (data.categoria === "Anillos") {
          const resTallas = await fetch(`/api/tallas_anillos?id_producto=${idProducto}`);
          if (!resTallas.ok) throw new Error("No se pudo obtener las tallas del producto.");
          const dataTallas = await resTallas.json();
          const tallasDisponibles = dataTallas.filter(t => t.stock >= 1);
          setStockTallas(tallasDisponibles);
          if (tallasDisponibles.length > 0) setSelectedTalla(tallasDisponibles[0].talla);
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar el producto.");
      }
    };

    fetchProducto();
  }, [idProducto]);

      useEffect(() => {
        fetch('/api/whatsapp-config')
          .then(res => res.json())
          .then(data => setFotoTallas(data.foto_tallas_anillos || ""))
          .catch(err => console.error('Error:', err));
      }, []);

  const handlePersonalizarClick = () => {
    setIsButtonGlowing(true);
    setTimeout(() => {
      setIsButtonGlowing(false);
      router.push('/productosPersonalizados');
    }, 1000);
  };

  if (!idProducto || !producto) return null;

  const prod = {
    id: producto.id_productos,
    name: producto.nombre,
    price: producto.precio,
    description: producto.descripcion,
    image: producto.imagen,
    image2: producto.imagen2,
    image3: producto.imagen3,
    stock: producto.stock,
    activar_botn: producto.activar_botn
  };

  // CORREGIDO: Asegurar que productoCarrito tenga la talla correctamente
  const productoCarrito = {
    id: producto.id_productos,
    name: producto.nombre,
    price: producto.precio,
    description: producto.descripcion,
    image: producto.imagen,
    image2: producto.imagen2,
    image3: producto.imagen3,
    categoria: producto.categoria,
    talla: selectedTalla, // ← ESTO ES ESENCIAL
    stock: producto.categoria === "Anillos"
      ? (stockSeleccionado?.stock || 0)
      : producto.stock,
    id_stock: stockSeleccionado?.id_stock || null,
    uniqueId: producto.categoria === "Anillos"
      ? `${producto.id_productos}-${stockSeleccionado?.id_stock || 0}-${selectedTalla}`
      : String(producto.id_productos)
  };


console.log("🔍 DEBUG productoCarrito:", {
  nombre: producto.nombre,
  categoria: producto.categoria,
  id: producto.id_productos,
  selectedTalla: selectedTalla,
  id_stock: stockSeleccionado?.id_stock,
  stockSeleccionado: stockSeleccionado,
  productoCarrito: {
    talla: productoCarrito.talla,
    id_stock: productoCarrito.id_stock,
    uniqueId: productoCarrito.uniqueId,
    stock: productoCarrito.stock
  }
});

  const imagenes = [prod.image, prod.image2, prod.image3].filter(Boolean);

  return (
    <div className="fixed inset-0 bg-white bg-opacity-40 z-50 flex justify-center items-center px-4 overflow-y-auto py-10">
      <div className="absolute top-4 right-4 z-50">
        <IconoCarrito />
      </div>

      <div className="relative w-full max-w-lg rounded-xl shadow-2xl p-6 font-sans overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/fondoProducto.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            pointerEvents: 'none'
          }}
        />

        <button onClick={onClose} className="absolute top-3 right-3 text-2xl text-[#8C9560] hover:text-[#DC9C5C]">
          <FiX />
        </button>

        {error && <p className="text-red-500">{error}</p>}

        <h2 className="text-3xl font-normal text-center mb-4" style={{ fontFamily: "Alex Brush" }}>
          {prod.name}
        </h2>

        <div className="flex space-x-3 overflow-x-auto mb-4 scrollbar-hide">
          {imagenes.length > 0 ? (
            imagenes.map((img, i) => (
              <div key={`${img}-${i}`} className="relative group">
                <Image
                  src={img}
                  alt={`imagen ${i + 1}`}
                  width={180}
                  height={180}
                  className="rounded-lg object-cover w-[180px] h-[180px] shadow cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setImagenSeleccionadaIndex(i)}
                />
                <div className="absolute bottom-2 right-2 text-white bg-[#762114] bg-opacity-80 p-1 rounded-full text-xs">
                  <FiZoomIn />
                </div>
              </div>
            ))
          ) : (
            <div>No hay imágenes disponibles</div>
          )}
        </div>

        <p className="text-md mb-2 text-justify">{prod.description}</p>
        <p className="text-[#DC9C5C] text-xl font-bold mb-3">${prod.price}</p>

        {/* Mostrar stock por tallas si es anillo */}
        {producto?.categoria === "Anillos" && stockTallas.length > 0 && (
          <div className="mb-4">
            <label className="block text-[#7B2710] font-semibold mb-2">Seleccione talla</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedTalla}
                onChange={(e) => setSelectedTalla(e.target.value)}
                className="w-full p-2 border border-[#8C9560] rounded-md"
              >
                {stockTallas.map((t) => (
                  <option key={`${producto.id_productos}-${t.id_stock}`} value={t.talla}>
                    {t.talla} ({t.stock} disponibles)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setMostrarTallas(true)}
                className="px-2 py-1 bg-[#8C9560] text-white text-sm rounded hover:bg-[#DC9C5C] transition"
              >
                Ver tallas
              </button>
            </div>

           {mostrarTallas && (
            <div className="fixed inset-0 flex justify-center items-center z-50 pointer-events-none">
              <div className="relative z-10 pointer-events-auto">
                <button
                  onClick={() => setMostrarTallas(false)}
                  className="absolute -top-8 -right-8 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg text-gray-700 hover:text-red-500 text-lg border border-gray-300"
                >
                  ×
                </button>
                <img
                  src={fotoTallas || "/ruta-imagen-tallas-default.png"}
                  alt="Guía de tallas"
                  className="max-w-[280px] max-h-[350px] object-contain rounded-lg shadow-xl border border-gray-200"
                />
              </div>
            </div>
          )}
          </div>
        )}

        {/* Botón de agregar al carrito - CONDICIÓN SIMPLIFICADA */}
        {producto?.categoria === "Anillos" && stockTallas.length > 0 && (
          <BotonAgregarCarrito
            producto={productoCarrito} // ← Ya incluye la talla en producto.talla
            className="w-full py-2 rounded-lg text-white font-semibold transition-colors bg-[#762114] hover:bg-[#DC9C5C] mb-4"
          />
        )}

        {/* Para productos que no son anillos */}
        {producto?.categoria !== "Anillos" && (
          <BotonAgregarCarrito
            producto={productoCarrito}
            className="w-full py-2 rounded-lg text-white font-semibold transition-colors bg-[#762114] hover:bg-[#DC9C5C] mb-4"
          />
        )}

        {/* Botón de personalización */}
        {prod.activar_botn === 1 && (
          <div className="text-center my-4">
            <motion.button
              onClick={handlePersonalizarClick}
              className={`relative px-4 py-2 w-full bg-[#8C9560] text-white rounded-lg text-sm font-bold shadow-lg flex items-center justify-center mx-auto ${
                isButtonGlowing ? 'animate-glow' : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Personalizar mi joya <FiArrowRight className="ml-2" />
              {isButtonGlowing && (
                <motion.span
                  className="absolute inset-0 rounded-lg bg-[#DC9C5C] opacity-0"
                  animate={{ opacity: [0, 0.5, 0], scale: [1, 1.1, 1.2] }}
                  transition={{ duration: 1 }}
                />
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}