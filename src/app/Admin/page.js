"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NavegadorAdmin from "@/components/NavegadorAdmin";


export default function AdminMenuPage() {
  const router = useRouter();

  // Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/fondo.png')" }}>

        <NavegadorAdmin /> {/* Barra de navegación del admin */}
      
      {/* Capa oscura semitransparente para mejor contraste */}
      <div className="absolute inset-0 bg-black opacity-40"></div>
      
      {/* Contenedor principal responsive */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        
        {/* Título con diseño responsive */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#7B2710] mb-8 text-center 
                      bg-white bg-opacity-70 py-6 px-8 rounded-lg shadow-xl backdrop-blur-sm
                      w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg
                      transform transition-all hover:scale-105 duration-300">
          Menú Administrador
        </h1>
        
        {/* Espacio adicional para dispositivos pequeños */}
        <div className="h-16 sm:h-24 md:h-32"></div>
      </div>
    </div>
  );
}