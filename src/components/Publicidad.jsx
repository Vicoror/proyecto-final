"use client";
import { useState, useEffect } from "react";

export default function Publicidad({ items }) {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const isValid = Array.isArray(items) && items.length > 0;

  useEffect(() => {
    if (!isValid || !autoPlay) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoPlay, isValid, items]);

  const prev = () => {
    if (!isValid) return;
    setCurrent((prev) => (prev - 1 + items.length) % items.length);
  };

  const next = () => {
    if (!isValid) return;
    setCurrent((prev) => (prev + 1) % items.length);
  };

  if (!isValid) {
    return (
      <div className="w-full text-center py-8 text-white bg-gray-800 rounded-xl">
        No hay elementos de publicidad disponibles.
      </div>
    );
  }

  const actual = items[current];

  const renderContenido = () => {
    if (actual.tipo === "video") {
      return (
        <video
          src={actual.url}
          controls
          className="w-full h-full object-cover"
        />
      );
    } else {
      return (
        <div className="relative w-full h-full">
          {/* Capa de imagen */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: "url('/fondoProducto.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              pointerEvents: 'none'
            }}
          ></div>
          
          {/* Capa blanca semitransparente */}
          <div 
            className="absolute inset-0 z-1 bg-white/70" // Ajusta el 50 para más/menos blanqueo
            style={{ pointerEvents: 'none' }}
          ></div>
          
          {/* Imagen principal */}
          <img
            src={actual.url}
            alt={`Publicidad ${current + 1}`}
            className="relative z-10 w-full h-full object-contain transition-all duration-500"
          />
        </div>
      );
    }
  };

  return (
    <div
      className="w-full max-w-1xl mx-auto relative group overflow-hidden rounded-xl"
      onMouseEnter={() => setAutoPlay(false)}
      onMouseLeave={() => setAutoPlay(true)}
    >
      <div className="w-full h-[300px] md:h-[450px] bg-black flex items-center justify-center">
        {actual.enlace ? (
          <a
            href={actual.enlace.startsWith("http") ? actual.enlace : `https://${actual.enlace}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-full block"
          >
            {renderContenido()}
          </a>
        ) : (
          renderContenido()
        )}
      </div>

      {/* Flechas */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 text-black rounded-full p-2 hover:bg-white z-10 hidden group-hover:block"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 text-black rounded-full p-2 hover:bg-white z-10 hidden group-hover:block"
      >
        ›
      </button>

      {/* Puntitos */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full ${
              current === index ? "bg-white" : "bg-white/50"
            } hover:bg-white`}
          />
        ))}
      </div>
    </div>
  );
}
