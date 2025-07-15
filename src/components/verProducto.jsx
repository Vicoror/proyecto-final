"use client";

import { useEffect, useState } from "react";
import { FiX, FiPackage, FiZoomIn, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Image from "next/image";

export default function VerProducto({ idProducto, onClose }) {
  const [producto, setProducto] = useState(null);
  const [error, setError] = useState("");
  const [imagenSeleccionadaIndex, setImagenSeleccionadaIndex] = useState(null);

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

  if (!idProducto || !producto) return null;

  const imagenes = [producto.imagen, producto.imagen2, producto.imagen3].filter(Boolean);
  const imagenSeleccionada = imagenes[imagenSeleccionadaIndex];

  const siguienteImagen = () => {
    setImagenSeleccionadaIndex((prev) => (prev + 1) % imagenes.length);
  };

  const anteriorImagen = () => {
    setImagenSeleccionadaIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-40 z-50 flex justify-center items-center px-4 overflow-y-auto py-10">
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
          {producto.nombre}
        </h2>

        <div className="flex space-x-3 overflow-x-auto mb-4 scrollbar-hide">
          {imagenes.map((img, i) => (
            <div key={i} className="relative group">
              <Image
                src={img}
                alt={`Imagen ${i + 1}`}
                width={180}
                height={180}
                className="rounded-lg object-cover w-[180px] h-[180px] shadow cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setImagenSeleccionadaIndex(i)}
              />
              <div className="absolute bottom-2 right-2 text-white bg-[#762114] bg-opacity-80 p-1 rounded-full text-xs">
                <FiZoomIn />
              </div>
            </div>
          ))}
        </div>

        <p className="text-md mb-2 text-justify">{producto.descripcion}</p>
        <p className="text-[#DC9C5C] text-xl font-bold mb-3">${producto.precio}</p>

        {producto.stock > 0 ? (
          <div className="flex items-center text-sm text-green-700 bg-green-100 rounded p-2 mb-4">
            <FiPackage className="mr-2" /> {producto.stock} piezas disponibles
          </div>
        ) : (
          <div className="flex items-center text-sm text-red-700 bg-red-100 rounded p-2 mb-4">
            <FiPackage className="mr-2" /> Pronto tendremos piezas disponibles
          </div>
        )}

        <button
          disabled={producto.stock === 0}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-colors ${
            producto.stock === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-[#762114] hover:bg-[#DC9C5C]"
          }`}
        >
          Agregar al carrito
        </button>
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
      
    </div>
  );
}
