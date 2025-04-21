"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

const menuItems = [
  { title: "Gestión de productos", submenu: ["Agregar productos", "Editar productos", "Lista de productos", "Stock"] },
  { title: "Publicidad", submenu: ["Agregar Publicidad", "Editar Publicidad"] },
  { title: "Pedidos", submenu: ["Editar status de pedidos"] },
  { title: "Gestión de clientes", submenu: ["Datos de clientes", "Editar clientes"] },
  { title: "Reportes", submenu: ["Reportes", "Métricas", "Ventas", "Chat"] },
];


export default function NavegadorAdmin() {
  const [openMenu, setOpenMenu] = useState(null);
  const [submenuHover, setSubmenuHover] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [focusedMainIndex, setFocusedMainIndex] = useState(0);
  const [focusedSubIndex, setFocusedSubIndex] = useState(-1);
  const router = useRouter();
  const mainMenuRefs = useRef([]);
  const subMenuRefs = useRef([]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.replace("/login");
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
    setSubmenuHover(false);
  };

  const handleKeyDown = (e) => {
    if (openMenu !== null && menuItems[openMenu].submenu.length > 0) {
      if (e.key === "ArrowDown") {
        setFocusedSubIndex((prev) => (prev + 1) % menuItems[openMenu].submenu.length);
      } else if (e.key === "ArrowUp") {
        setFocusedSubIndex((prev) => (prev - 1 + menuItems[openMenu].submenu.length) % menuItems[openMenu].submenu.length);
      } else if (e.key === "ArrowLeft") {
        setOpenMenu((prev) => (prev - 1 + menuItems.length) % menuItems.length);
        setFocusedSubIndex(-1);
      } else if (e.key === "ArrowRight") {
        setOpenMenu((prev) => (prev + 1) % menuItems.length);
        setFocusedSubIndex(-1);
      } else if (e.key === "Enter" && focusedSubIndex >= 0) {
        handleSubmenuClick(menuItems[openMenu].submenu[focusedSubIndex]);
      }
    } else {
      if (e.key === "ArrowRight") {
        setFocusedMainIndex((prev) => (prev + 1) % menuItems.length);
      } else if (e.key === "ArrowLeft") {
        setFocusedMainIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === "Enter") {
        setOpenMenu(focusedMainIndex);
        setFocusedSubIndex(0);
      }
    }
  };

  useEffect(() => {
    if (focusedSubIndex === -1 && mainMenuRefs.current[focusedMainIndex]) {
      mainMenuRefs.current[focusedMainIndex].focus();
    } else if (subMenuRefs.current[focusedSubIndex]) {
      subMenuRefs.current[focusedSubIndex].focus();
    }
  }, [focusedMainIndex, focusedSubIndex, openMenu]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusedMainIndex, focusedSubIndex, openMenu]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const showSubmenu = (index) => {
    setOpenMenu(index);
    setFocusedMainIndex(index);
  };

  const hideSubmenu = () => {
    if (!submenuHover) {
      setOpenMenu(null);
      setFocusedSubIndex(-1);
    }
  };

  return (
    <nav className="bg-[#F5F1F1] border-b-2 border-[#762114] px-4 py-3 shadow-md fixed top-0 left-0 w-full z-50">
      <div className="flex justify-between items-center">
        <button
          className="text-[#762114] lg:hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={30} /> : <Menu size={30} />}
        </button>

        <div className={`lg:flex ${isMobileMenuOpen ? "block" : "hidden"} w-full lg:w-auto animate-fade-in`}>
          <div className="flex flex-col lg:flex-row gap-2 mt-3 lg:mt-0">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => showSubmenu(index)}
                onMouseLeave={hideSubmenu}
              >
                <button
                  ref={(el) => (mainMenuRefs.current[index] = el)}
                  className="text-white font-semibold py-2 px-4 bg-[#762114] rounded-md hover:bg-[#DC9C5C] transition-all text-sm sm:text-base whitespace-nowrap focus:outline-none"
                >
                  {item.title}
                </button>
                {openMenu === index && item.submenu.length > 0 && (
                  <div
                    className="absolute left-0 mt-1 bg-[#8C9560] p-2 rounded-md shadow-lg z-10 min-w-full transition-all duration-300 transform animate-slide-down"
                    onMouseEnter={() => setSubmenuHover(true)}
                    onMouseLeave={() => {
                      setSubmenuHover(false);
                      hideSubmenu();
                    }}
                  >
                    {item.submenu.map((sub, subIndex) => (
                      <p
                      key={subIndex}
                      ref={(el) => (subMenuRefs.current[subIndex] = el)}
                      className={`text-[#F5F1F1] py-1 px-4 cursor-pointer text-sm sm:text-base whitespace-nowrap focus:outline-none hover:underline ${
                        focusedSubIndex === subIndex ? "bg-[#DC9C5C] text-[#762114] rounded-md" : ""
                      }`}
                      tabIndex={0}
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
        </div>

        <div className="hidden lg:flex gap-2">
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
    </nav>
    
  );
  
}
