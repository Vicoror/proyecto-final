"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft } from "lucide-react";
import EditarMateriales from "@/components/EditarMateriales";
import EditarPP from "../../../components/EditarPP";

export default function PaginaBase() {
  const router = useRouter();
  const [mostrarMateriales, setMostrarMateriales] = useState(false);

  // Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, []);

  const toggleMateriales = () => {
    setMostrarMateriales(!mostrarMateriales);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      {/* Capa oscura para mejorar contraste */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      <NavegadorAdmin />

      {/* Contenedor principal con márgenes y padding ajustados */}
      <main className="relative z-10 px-2 sm:px-0 pt-20 pb-8 w-full max-w-[99.5vw] mx-auto">
        {/* Flecha de retroceso posicionada debajo del navegador */}
        <div className="w-full max-w-[99.5vw] max-w-5xl mx-auto mb-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-[#F5F1F1] transition-colors"
          >
            <ArrowLeft className="mr-2" size={30} />
            Anterior
          </button>
        </div>
        
        {/* Sección de editar publicidad expandida */}
        <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#7B2710]">Gestión de Productos Personalizados y Materiales</h2>
            <button 
              onClick={toggleMateriales}
              className="bg-[#7B2710] hover:bg-[#5e1d0a] text-[#F5F1F1] font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
              </svg>
              {mostrarMateriales ? "Ocultar Materiales" : "Gestionar Materiales"}
            </button>
          </div>

          {/* Componente EditarMateriales que aparece/desaparece */}
          {mostrarMateriales && (
            <div className="mb-6 border border-[#762114] rounded-lg p-4 bg-white">
              <h3 className="text-xl font-semibold text-[#7B2710] mb-4">Gestión de Materiales</h3>
              <EditarMateriales />
            </div>
          )}

          {/* Componente de búsqueda EditarPP */}
          <EditarPP/>
        </section>
      </main>
    </div>
  );
}