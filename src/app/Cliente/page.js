"use client";

import { useEffect, useState } from "react";
import { FaArrowLeft,FaHome } from "react-icons/fa";
import { useRouter } from 'next/navigation';

const menuItems = [
  { title: "Mis Compras", submenu: ["Historial de compras", "Seguimiento de envio"] },
  { title: "Mis Datos", submenu: ["Editar datos"] },
  { title: "Mi Carrito", submenu: [] },
];

export default function ClientePage() {
  // Estados y funciones permanecen exactamente igual
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const goBack = () => {
    router.back(); // Navegar a la página anterior
    };
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error al recuperar usuario:", error);
      router.push("/login");
    }
  }, [router]);

  if (!user) {
    return <p>Cargando...</p>;
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center p-4 sm:p-6 relative"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto bg-[#F5F1F1] p-4 sm:p-6 rounded-lg shadow-lg border-4 border-[#762114]">
        
        <div className="flex flex-col sm:flex-row items-center mb-4">
          <a href="/" className="text-[#7B2710] text-2xl sm:text-3xl mb-2 sm:mb-0 sm:mr-4 hover:text-[#DC9C5C]">
            <FaHome />
          </a>
          <h1 className="text-2xl sm:text-4xl font-serif text-[#7B2710] text-center">Bienvenid@, {user.nombre}!</h1>
        </div>
        <p className="text-base sm:text-lg text-[#7B2710] mb-4 sm:mb-0">Correo: {user.correo}</p>
        
        <nav className="mt-6 bg-[#DC9C5C] p-2 sm:p-4 rounded-lg">
          <ul className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 justify-center">
            {menuItems.map((item, index) => (
              <li key={index} className="relative">
                <button 
                  onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                  className="text-[#7B2710] font-serif font-bold px-3 sm:px-4 py-1 sm:py-2 hover:bg-[#8C9560] transition-colors rounded-lg w-full sm:w-auto text-sm sm:text-base"
                >
                  {item.title}
                </button>
                {activeMenu === index && item.submenu.length > 0 && (
                  <div className="sm:absolute left-0 mt-2 bg-[#8C9560] p-2 rounded-md shadow-md w-full sm:w-48">
                    {item.submenu.map((sub, subIndex) => (
                      <p
                        key={subIndex}
                        className="text-[#F5F1F1] py-2 px-4 hover:bg-[#7B2710] cursor-pointer rounded-md text-sm sm:text-base"
                        onClick={() => setActiveMenu(null)}
                      >
                        {sub}
                      </p>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      
      </div>
      
    </div>
    
  );
  
}