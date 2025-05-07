"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Presentacion() {
  const [imagenesCarrusel, setImagenesCarrusel] = useState([]);
  const [mediaPresentacion, setMediaPresentacion] = useState({ 
    tipo: "imagen", 
    imagen_url: "", 
    texto: "" 
  });
  const [terceraImagen, setTerceraImagen] = useState({ 
    imagen_url: "", 
    texto: "" 
  });
  const [carruselIndex, setCarruselIndex] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchPresentacion = async () => {
    try {
      const res = await fetch("/api/presentacion");
      const data = await res.json();
  
      // Extraer imagen y texto del tercer bloque
      const imagenTercero = data.tercero?.imagen_url || "";
      const textoTercero = data.tercero?.texto || "";
  
      // Carrusel: filtrar entradas mal formadas y evitar duplicado con el tercer bloque
      const carruselFiltrado = (data.carrusel || [])
      .filter((img) => img?.imagen_url && img?.texto)
      .filter(
        (img) =>
          img.imagen_url !== data.tercero?.imagen_url &&
          img.texto !== data.tercero?.texto
      );
  
      setImagenesCarrusel(carruselFiltrado);
  
      // Bloque 2: solo si está activo y tiene URL
      if (data.segundo?.activo && data.segundo?.imagen_url) {
        setMediaPresentacion({
          tipo: data.segundo.tipo === "video" ? "video" : "imagen",
          imagen_url: data.segundo.imagen_url,
          texto: data.segundo.texto || ""
        });
      } else {
        setMediaPresentacion({ tipo: "imagen", imagen_url: "", texto: "" });
      }
  
      // Bloque 3: solo si está activo y tiene URL
      if (data.tercero?.activo && data.tercero?.imagen_url) {
        setTerceraImagen({
          imagen_url: data.tercero.imagen_url,
          texto: data.tercero.texto || ""
        });
      } else {
        setTerceraImagen({ imagen_url: "", texto: "" });
      }
  
    } catch (error) {
      console.error("Error al cargar presentación:", error);
    }
  };

  useEffect(() => {
    fetchPresentacion();
    
    const interval = setInterval(fetchPresentacion, 60000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  useEffect(() => {
    if (imagenesCarrusel.length > 0) {
      const interval = setInterval(() => {
        setCarruselIndex((prev) => (prev + 1) % imagenesCarrusel.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [imagenesCarrusel]);

  const handleRefresh = () => {
    setLastUpdate(Date.now());
  };

  return (
    <section className="mt-8 px-4 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* Carrusel */}
        <motion.div className="relative overflow-hidden rounded-lg shadow-lg h-64 md:h-80"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="w-full h-full relative">
            {imagenesCarrusel.length > 0 && imagenesCarrusel[carruselIndex]?.imagen_url ? (
              <>
                <img
                  src={imagenesCarrusel[carruselIndex].imagen_url}
                  alt="Imagen carrusel"
                  className="w-full h-full object-cover absolute inset-0 transition-opacity duration-1000"
                  style={{ opacity: 1 }}
                />
                <div className="absolute bottom-0 bg-black/50 w-full text-white text-center py-2">
                  {imagenesCarrusel[carruselIndex].texto}
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                Imagen de carrusel no disponible
              </div>
            )}
          </div>
        </motion.div>

        {/* Segundo bloque */}
        <motion.div className="relative overflow-hidden rounded-lg shadow-lg h-64 md:h-80"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {mediaPresentacion.imagen_url ? (
            mediaPresentacion.tipo === "video" ? (
              <video
                src={mediaPresentacion.imagen_url}
                autoPlay
                muted
                loop
                className="w-full h-full object-cover absolute inset-0"
                key={mediaPresentacion.imagen_url}
              />
            ) : (
              <img
                src={mediaPresentacion.imagen_url}
                alt="Presentación 2"
                className="w-full h-full object-cover absolute inset-0"
                key={mediaPresentacion.imagen_url}
              />
            )
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
              Media no disponible
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <h3 className="text-white text-xl font-regular" style={{ fontFamily: "Alex Brush" }}>
              {mediaPresentacion.texto || "Texto no disponible"}
            </h3>
          </div>
        </motion.div>

        {/* Tercer bloque (sin duplicar texto) */}
        <motion.div className="relative overflow-hidden rounded-lg shadow-lg h-64 md:h-80"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="w-full h-full relative">
            {terceraImagen.imagen_url ? (
              <img
                src={terceraImagen.imagen_url}
                alt="Presentación 3"
                className="w-full h-full object-cover absolute inset-0"
                key={terceraImagen.imagen_url}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                Imagen no disponible
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <h3 className="text-white text-xl font-regular" style={{ fontFamily: "Alex Brush" }}>
                {terceraImagen.texto || "Texto no disponible"}
              </h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Botón de recarga */}
      <button 
        onClick={handleRefresh}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        title="Actualizar presentación"
      >
        🔄
      </button>
    </section>
  );
}
