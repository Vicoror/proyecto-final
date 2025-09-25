"use client";

import { useEffect, useState } from "react";
import { FiX, FiPackage, FiZoomIn, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Image from "next/image";
import BotonAgregarCarrito from "@/components/BotonAgregarCarrito";
import IconoCarrito from "@/components/IconoCarrito";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function VerProducto({ idProducto, onClose }) {
  const [producto, setProducto] = useState(null);
  const [error, setError] = useState("");
  const [imagenSeleccionadaIndex, setImagenSeleccionadaIndex] = useState(null);
  const [isButtonGlowing, setIsButtonGlowing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!idProducto) return;
    const fetchProducto = async () => {
      try {
        const res = await fetch(`/api/productos?id=${idProducto}`);
        if (!res.ok) throw new Error("No se pudo obtener el producto.");
        const data = await res.json();
        setProducto(data);
      } catch (err) {
        setError("Error al cargar el producto.");
      }
    };
    fetchProducto();
  }, [idProducto]);

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
    activar_botn: producto.activar_botn // Asegurar que tenemos este campo
  };

  const imagenes = [prod.image, prod.image2, prod.image3].filter(Boolean);
  const imagenSeleccionada = imagenes[imagenSeleccionadaIndex];

  const siguienteImagen = () => {
    setImagenSeleccionadaIndex((prev) => (prev + 1) % imagenes.length);
  };

  const anteriorImagen = () => {
    setImagenSeleccionadaIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  console.log("🚀 Producto preparado para agregar:", prod);

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

        {prod.stock > 0 ? (
          <div className="flex items-center text-sm text-green-700 bg-green-100 rounded p-2 mb-4">
            <FiPackage className="mr-2" /> {prod.stock} piezas disponibles
          </div>
        ) : (
          <div className="flex items-center text-sm text-red-700 bg-red-100 rounded p-2 mb-4">
            <FiPackage className="mr-2" /> Pronto tendremos piezas disponibles
          </div>
        )}

        {/* Botón de agregar al carrito */}
        <BotonAgregarCarrito 
          producto={prod} 
          className="w-full py-2 rounded-lg text-white font-semibold transition-colors bg-[#762114] hover:bg-[#DC9C5C] mb-4" 
        />

        {/* Botón de personalización - Solo se muestra si activar_botn es verdadero */}
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

      {imagenSeleccionadaIndex !== null && (
        <div className="fixed inset-0 bg-[#762114] bg-opacity-70 z-50 flex justify-center items-center px-4">
          <button
            onClick={() => setImagenSeleccionadaIndex(null)}
            className="absolute top-5 left-5 text-white text-4xl hover:text-[#DC9C5C]"
          >
            <FiArrowLeft />
          </button>

          {/* Flecha anterior */}
          {imagenSeleccionadaIndex > 0 && (
            <button
              onClick={() => setImagenSeleccionadaIndex((prev) => prev - 1)}
              className="absolute left-5 md:left-80 text-white text-4xl hover:text-[#DC9C5C] top-30"
              aria-label="Imagen anterior"
            >
              <FiArrowLeft />
            </button>
          )}

          {/* Imagen ampliada */}
          <Image
            src={imagenes[imagenSeleccionadaIndex]}
            alt="Imagen ampliada"
            width={600}
            height={600}
            className="max-w-full max-h-[90vh] rounded-lg object-contain shadow-xl"
          />

          {/* Flecha siguiente */}
          {imagenSeleccionadaIndex < imagenes.length - 1 && (
            <button
              onClick={() => setImagenSeleccionadaIndex((prev) => prev + 1)}
              className="absolute right-5 md:right-80 text-white text-4xl hover:text-[#DC9C5C] top-30"
              aria-label="Siguiente imagen"
            >
              <FiArrowRight />
            </button>
          )}
        </div>
      )}
      
      {/* Estilos para la animación de glow */}
      <style jsx>{`
        @keyframes glow {
          0% { box-shadow: 0 0 5px #DC9C5C; }
          50% { box-shadow: 0 0 20px #DC9C5C, 0 0 30px #DC9C5C; }
          100% { box-shadow: 0 0 5px #DC9C5C; }
        }
        .animate-glow {
          animation: glow 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}