"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft} from "lucide-react";

export default function EditarAnunciosBase() {
  const [anuncios, setAnuncios] = useState([ { id: null, titulo: "", activo: true }, { id: null, titulo: "", activo: true }, { id: null, titulo: "", activo: true } ]);
  const [mensaje, setMensaje] = useState("");
  const [indiceAnuncio, setIndiceAnuncio] = useState(0);
  const [mostrarAnuncio, setMostrarAnuncio] = useState(true);
  const anunciosActivos = anuncios.filter(anuncio => anuncio.activo && anuncio.titulo.trim() !== "");

  // Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, []);

  useEffect(() => {
    fetch("/api/anuncios")
      .then((res) => {
        // Verificamos si la respuesta es válida
        if (!res.ok) {
          throw new Error("Error en la respuesta de la API");
        }
        return res.json(); // Solo intentamos convertir la respuesta a JSON si es válida
      })
      .then((data) => {
        // Asegúrate de que los anuncios tengan una estructura consistente
        const anunciosLimpiados = data.map((a) => ({
          id: a.id,
          titulo: a.titulo || "",
          activo: a.activo ?? true,
        }));
        setAnuncios(anunciosLimpiados);
      })
      .catch((err) => {
        console.error("Error al cargar anuncios:", err);
        setMensaje("Error al cargar los anuncios.");
      });
  }, []);

  useEffect(() => {
    if (anuncios.length > 0) {
      const interval = setInterval(() => {
        setMostrarAnuncio(false);
        setTimeout(() => {
          setIndiceAnuncio((prev) => (prev + 1) % anuncios.length);
          setMostrarAnuncio(true);
        }, 500);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [anuncios]);

  const handleChange = (index, value) => {
    const nuevos = [...anuncios];
    const clean = value.replace(/[<>{}[\]()*&^#@~`"'\\]/g, '').slice(0, 100);
    nuevos[index].titulo = clean;
    setAnuncios(nuevos);
  };

  const handleToggleActivo = async (index) => {
    const anuncio = anuncios[index];
    const nuevoEstado = !anuncio.activo;

  
    try {
      const res = await fetch(`/api/anuncios/${anuncio.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: anuncio.titulo,
          activo: nuevoEstado,
        }),
      });
  
      if (!res.ok) throw new Error("Error al actualizar");
  
      // ✅ Actualiza el estado local con el nuevo valor
      const nuevos = [...anuncios];
      nuevos[index].activo = nuevoEstado;
      setAnuncios(nuevos);
      setMensaje("Cambio guardado.");
    } catch (err) {
      console.error("Error al actualizar:", err);
      setMensaje("No se pudo actualizar el estado.");
    }
  };
  

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Se asegura que los anuncios tengan un título válido y 'activo' como booleano
  const anunciosConValores = anuncios.map((anuncio) => ({
    ...anuncio,
    titulo: anuncio.titulo || "",  // Si el título está vacío, lo reemplaza por una cadena vacía
    activo: typeof anuncio.activo === "boolean" ? anuncio.activo : false, // Asegura que 'activo' siempre sea un valor booleano
  }));

  try {
    const res = await fetch("/api/anuncios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuevosAnuncios: anunciosConValores }),
    });

    if (!res.ok) {
      console.error("Error al guardar los anuncios.");
      setMensaje("Error al guardar los anuncios.");
      return;
    }

    const result = await res.json();
    setMensaje(result.message || "Anuncios guardados correctamente.");
  } catch (err) {
    console.error("Error al guardar los anuncios:", err);
    setMensaje("Error al guardar los anuncios.");
  }
};

  
return (
  <div className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-2 relative" style={{ backgroundImage: "url('/fondo.png')" }}>
    <div className="absolute inset-0 bg-black opacity-40"></div>
    <NavegadorAdmin />

    <div className="relative z-10 px-2 sm:px-0 pt-17 pb-10 w-full max-w-[1500px] mx-auto">
       <div className="w-full max-w-[99.5vw] max-w-5xl mx-auto mb-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-[#F5F1F1] transition-colors"
          >
            <ArrowLeft className="mr-2" size={30} />
            Anterior
          </button>
        </div>
      <div className="bg-[#F5F1F1] p-6 rounded-lg shadow-lg border-4 border-[#762114]">
        <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Editar Anuncios</h2>
        <form onSubmit={handleSubmit}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="mb-6 p-4 bg-white rounded-lg shadow-md border border-[#762114]">
              <h3 className="text-lg font-bold text-[#7B2710] mb-2">Anuncio {i + 1}</h3>
              <label className="block text-sm font-semibold text-[#7B2710]">Título</label>
              <input
                type="text"
                value={anuncios[i]?.titulo || ""}
                onChange={(e) => handleChange(i, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                maxLength={100}
              />
              <p className="text-sm text-gray-500">{(anuncios[i]?.titulo || "").length}/100 caracteres</p>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={anuncios[i]?.activo ?? true}
                  onChange={() => handleToggleActivo(i)}
                  className="mr-2"
                />
                <label className="text-sm text-[#7B2710]">Activo</label>
                <span className={`ml-2 text-sm ${anuncios[i]?.activo ? "text-green-600" : "text-red-600"}`}>
                  {anuncios[i]?.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          ))}
          <button type="submit" className="bg-[#762114] text-white px-4 py-2 rounded hover:bg-[#DC9C5C]">Guardar Cambios</button>
          {mensaje && <p className="mt-2 text-green-600">{mensaje}</p>}
        </form>
      </div>
    </div>

    <div className="w-full max-w-4xl mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold text-[#7B2710] mb-4">Anuncio Actual</h2>
      {anuncios.filter(a => a.activo && a.titulo.trim() !== "").length > 0 && (
  <div className="w-full h-12 overflow-hidden relative">
    <div className={`transition-opacity duration-500 ${mostrarAnuncio ? "opacity-100" : "opacity-0"}`}>
      {anuncios.filter(a => a.activo && a.titulo.trim() !== "")[indiceAnuncio]?.titulo}
    </div>
  </div>
)}
    </div>
  </div>
);
}