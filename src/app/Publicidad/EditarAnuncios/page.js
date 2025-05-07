"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";

export default function PaginaBase() {
  const router = useRouter();
  const [anuncios, setAnuncios] = useState([]); // Aquí se guardan los anuncios cargados
  const [mensaje, setMensaje] = useState("");
  const [indiceAnuncio, setIndiceAnuncio] = useState(0); // Seguimos el índice del anuncio visible
  const [mostrarAnuncio, setMostrarAnuncio] = useState(true); // Controlamos si mostrar el anuncio o no

  useEffect(() => {
    fetch("/api/anuncios")
      .then((res) => res.json())
      .then((data) => setAnuncios(data)); // Cargamos los anuncios de la API
  }, []);

  useEffect(() => {
    if (anuncios.length > 0) {
      const interval = setInterval(() => {
        setMostrarAnuncio(false); // Ocultamos el anuncio actual (inicio de transición)
        setTimeout(() => {
          setIndiceAnuncio((prevIndex) => (prevIndex + 1) % anuncios.length);  // Cambiar al siguiente anuncio
          setMostrarAnuncio(true); // Mostramos el siguiente anuncio (final de transición)
        }, 500); // Esperamos medio segundo para completar la transición
      }, 3000); // Cambiar cada 3 segundos

      return () => clearInterval(interval); // Limpiar el intervalo cuando el componente se desmonte
    }
  }, [anuncios]);

  const handleChange = (index, value) => {
    // Quitar caracteres peligrosos
    const sanitizedValue = value.replace(/[<>{}[\]()*&^#@!~`"'\\]/g, '');
  
    // Limitar a 100 caracteres
    const limitado = sanitizedValue.slice(0, 100);
  
    const nuevos = [...anuncios];
    nuevos[index] = limitado;
    setAnuncios(nuevos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/anuncios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuevosAnuncios: anuncios }),
    });
    const result = await res.json();
    setMensaje(result.message);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-6 relative" style={{ backgroundImage: "url('/fondo.png')" }}>
      {/* Fondo oscurecido */}
      <div className="absolute inset-0 bg-black opacity-40"></div>

      {/* Navegación */}
      <NavegadorAdmin />

      {/* Contenido principal */}
      <div className="top-10 relative z-10 w-full max-w-6xl mt-8">
        <div className="bg-[#F5F1F1] p-6 rounded-lg shadow-lg border-4 border-[#762114]">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Editar Anuncios</h2>
          <form onSubmit={handleSubmit}>
            {anuncios.map((anuncio, i) => (
              <div key={i} className="mb-4">
                <label className="block text-sm font-semibold text-[#7B2710]">
                  Anuncio {i + 1}
                </label>
                <input
                  type="text"
                  value={anuncio}
                  onChange={(e) => handleChange(i, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  maxLength={100}
                />
                <p className="text-sm text-gray-500">{anuncio.length}/100 caracteres</p>
              </div>
            ))}
            <button type="submit" className="bg-[#762114] text-white px-4 py-2 rounded hover:bg-[#DC9C5C]">
              Guardar Cambios
            </button>
            {mensaje && <p className="mt-2 text-green-600">{mensaje}</p>}
          </form>
        </div>
      </div>

      {/* Sección de anuncios */}
      <div className="w-full max-w-4xl mt-10 p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-bold text-[#7B2710] mb-4">Anuncios</h2>
        <div className="w-full h-12 overflow-hidden relative">
          {/* Mostrar el anuncio actual con animación */}
          <div
            className={`transition-opacity duration-500 ${mostrarAnuncio ? 'opacity-100' : 'opacity-0'}`}
            style={{ transition: "opacity 0.5s" }}
          >
            {anuncios.length > 0 && anuncios[indiceAnuncio]}  {/* Mostrar el anuncio actual */}
          </div>
        </div>
      </div>
    </div>
  );
}
