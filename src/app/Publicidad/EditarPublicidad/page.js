"use client";
import { useRouter } from "next/navigation";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { useEffect } from "react";

export default function PaginaBase() {
  const router = useRouter();

  // Protección de ruta
    useEffect(() => {
      const user = localStorage.getItem("user");
      if (!user) {
        router.replace("/login");
      }
    }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-6 relative" style={{ backgroundImage: "url('/fondo.png')" }}>
      {/* Fondo oscurecido */}
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <NavegadorAdmin />
      {/* Contenedor principal */}
      <div className="relative top-15 z-10 w-full max-w-6xl">
        {/* Contenedor del título (espacio conservado) */}
        <div className="bg-[#F5F1F1] p-6 rounded-lg shadow-lg border-4 border-[#762114]">
          {/* Espacio reservado para el título - mismo estilo original */}
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Editar Publicidad </h2>
          
          {/* Espacio vacío donde estaba el contenido (conservando el padding) */}
          <div className="p-4"></div>
        </div>
      </div>
    </div>
  );
}