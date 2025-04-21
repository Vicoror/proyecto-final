"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const menuItems = [
  { title: "Gestión de productos", submenu: ["Agregar productos", "Editar productos", "Lista de productos", "Stock"] },
  { title: "Publicidad", submenu: ["Agregar Publicidad", "Editar Publicidad"] },
  { title: "Pedidos", submenu: ["Editar status de pedidos"] },
  { title: "Gestión de clientes", submenu: ["Datos de clientes", "Editar clientes"] },
  { title: "Reportes", submenu: ["Reportes", "Métricas", "Ventas", "Chat"] },
];

export default function AdminMenuPage() {
  const [openMenu, setOpenMenu] = useState(null);
  const router = useRouter();

  // 🔐 Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, []);

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  const handleLogout = () => {
    localStorage.clear(); // Elimina cualquier dato guardado
    sessionStorage.clear();
    router.replace("/login"); // Redirige sin dejar historial
  };

  const goToClientMenu = () => {
    router.push("/Cliente");
  };

  const handleSubmenuClick = (submenuItem) => {
    const routes = {
      "Agregar productos": "/gestionProductos/AgregarProducto",
      "Editar productos": "/gestionProductos/EditarProductos",
      "Lista de productos": "/gestionProductos/ListaProductos",
      "Stock": "/gestionProductos/Stock",
      "Agregar Publicidad": "/Publicidad/agregarPublicidad",
      "Editar Publicidad": "/Publicidad/EditarPublicidad",
      "Editar status de pedidos": "/Pedidos",
      "Datos de clientes": "/gestionClientes/DatosClientes",
      "Editar clientes": "/gestionClientes/EditarClientes",
      "Reportes": "/Reportes",
      "Métricas": "/Reportes/Metricas",
      "Ventas": "/Reportes/Ventas",
      "Chat": "/Reportes/Chat",
    };
    router.push(routes[submenuItem]);
    setOpenMenu(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-6"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      {/* Barra de navegación superior */}
      <div className="w-full bg-white bg-opacity-80 backdrop-blur-md border-b-2 border-[#762114] px-4 py-3 flex flex-wrap justify-between items-center shadow-md fixed top-0 left-0 z-50">
        <div className="flex flex-wrap gap-2 items-center">
          {menuItems.map((item, index) => (
            <div key={index} className="relative">
              <button
                onClick={() => toggleMenu(index)}
                className="text-[#F5F1F1] font-semibold py-2 px-4 bg-[#762114] rounded-md hover:bg-[#DC9C5C] transition-all text-sm sm:text-base whitespace-nowrap"
              >
                {item.title}
              </button>
              {openMenu === index && item.submenu.length > 0 && (
                <div className="absolute left-0 mt-1 bg-[#8C9560] p-2 rounded-md shadow-lg z-10 min-w-full">
                  {item.submenu.map((sub, subIndex) => (
                    <p
                      key={subIndex}
                      className="text-[#F5F1F1] py-1 px-4 hover:underline cursor-pointer text-sm sm:text-base whitespace-nowrap"
                      onClick={() => handleSubmenuClick(sub)}
                    >
                      {sub}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botones destacados */}
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            onClick={goToClientMenu}
            className="bg-gradient-to-r from-[#9FBF69] to-[#7D8D4E] text-white py-2 px-4 rounded-lg font-bold shadow hover:brightness-110 transition-all text-sm sm:text-base"
          >
            Menú Cliente
          </button>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-[#A93226] to-[#78281F] text-white py-2 px-4 rounded-lg font-bold shadow hover:brightness-110 transition-all text-sm sm:text-base"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Espacio para que no quede cubierto por la barra */}
      <div className="h-24" />

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#7B2710] mb-4 sm:mb-8 text-center px-4">
        Menú Administrador
      </h1>
    </div>
  );
}
