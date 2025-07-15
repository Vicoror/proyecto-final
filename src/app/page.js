"use client";

import { useState, useEffect } from "react";
import { FiUser, FiShoppingBag, FiMenu, FiX, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Publicidad from "@/components/Publicidad";
import VerProducto from "@/components/verProducto";


const categorias = ["Anillos", "Collares", "Aretes", "Pulseras", "Brazaletes", "Piedras"];

const productos = {
  Anillos: [{ nombre: "Anillo de Plata", precio: "500", imagen: "/anillo1.jpg", descripcion: "Anillo artesanal hecho a mano en plata 925" }],
  Collares: [{ nombre: "Collar de Cuarzo Rosa", precio: "950", imagen: "/collar1.jpg", descripcion: "Pieza única con energía amorosa" }],
  Aretes: [{ nombre: "Aretes de Cuarzo", precio: "600", imagen: "/arete1.jpg", descripcion: "Cristales energéticos de alta vibración" }],
  Pulseras: [{ nombre: "Pulsera de Cuarzo", precio: "550", imagen: "/pulsera1.jpg", descripcion: "Hecho con cuarzo natural y cordón ajustable" }],
  Brazaletes: [{ nombre: "Brazalete de Plata", precio: "1200", imagen: "/brazalete1.jpg", descripcion: "Diseño elegante con acabados finos" }],
  Piedras: [{ nombre: "Amatista", precio: "1200", imagen: "/brazalete1.jpg", descripcion: "Piedra espiritual para protección y calma" }]
};

const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
};


export default function Home() {
  const [anuncios, setAnuncios] = useState([]);
  const [anuncioIndex, setAnuncioIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isButtonGlowing, setIsButtonGlowing] = useState(false);
  const [productosDinamicos, setProductosDinamicos] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [items, setItems] = useState([]);
  const [verProductoId, setVerProductoId] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const router = useRouter();
 

  const handleProductoClick = (id) => {
  setProductoSeleccionado(id);
  setMostrarModal(true);
};

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        const res = await fetch('/api/anuncios');
        const data = await res.json();
        const activos = data.filter((a) => a.activo);
        setAnuncios(activos);
      } catch (error) {
        console.error("Error cargando anuncios", error);
      }
    };
    fetchAnuncios();
  }, []);

    useEffect(() => {
      const obtenerPublicidad = async () => {
        try {
          const res = await fetch("/api/publicidad");

          const texto = await res.text(); // 🔍 primero obtenemos el texto crudo
          console.log("🧾 Respuesta cruda:", texto);

          const data = JSON.parse(texto); // intentamos convertirlo manualmente
          setItems(data);
        } catch (err) {
          console.error("❌ Error al obtener publicidad:", err);
        }
      };
      obtenerPublicidad();
    }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetch('/api/productos');
        if (response.ok) {
          const data = await response.json();
          setProductosDinamicos(data);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
        setProductosDinamicos(productos);
      }
    };
    cargarProductos();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
        if (window.innerWidth > 768) setIsMenuOpen(false);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (anuncios.length === 0) return;
    const interval = setInterval(() => {
      setAnuncioIndex((prevIndex) => (prevIndex + 1) % anuncios.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [anuncios]);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handlePersonalizarClick = () => {
    setIsButtonGlowing(true);
    setTimeout(() => {
      setIsButtonGlowing(false);
      router.push('/productosPersonalizados');
    }, 1000);
  };

  const obtenerProductosAMostrar = () => {
    return productosDinamicos && Object.keys(productosDinamicos).length > 0
      ? productosDinamicos
      : productos;
  };

  return (
    <div className="min-h-screen bg-[#F5F1F1] text-[#762114] relative">
      {/* Barra de anuncios */}
      <motion.div
        className="w-full py-2 text-center fixed top-0 z-50 text-[#F5F1F1]"
        style={{ backgroundColor: "rgba(140, 149, 96, 0.75)", backdropFilter: "blur(5px)" }}
        animate={{ opacity: [0, 1], x: [-50, 0] }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs sm:text-sm px-2 truncate">{anuncios[anuncioIndex]?.titulo}</p>
      </motion.div>

      {/* Header */}
      <header className="p-4 pt-14 md:p-5 flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex justify-between items-center w-full md:w-auto">
          {windowWidth <= 768 && (
            <button onClick={toggleMenu} className="text-2xl text-[#8C9560]">
              <FiMenu />
            </button>
          )}
          <div className="text-center pt-0 sm:pt-12">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-5xl font-bold" style={{ fontFamily: "Alex Brush" }}>
              Bernarda Sierra
            </h1>
            <h2 className="text-lg sm:text-xl text-[#DC9C5C] mt-1">
              Joyería artesanal
            </h2>
          </div>

          <div className="flex space-x-3 text-lg md:hidden">
            <Link href="/login" className="text-[#8C9560] hover:text-[#DC9C5C]">
              <FiUser />
            </Link>
            <button className="text-[#8C9560] hover:text-[#DC9C5C]">
              <FiShoppingBag />
            </button>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-4 text-xl">
          <Link href="/login" className="text-[#8C9560] hover:text-[#DC9C5C]">
            <FiUser />
          </Link>
          <button className="text-[#8C9560] hover:text-[#DC9C5C]">
            <FiShoppingBag />
          </button>
        </div>
      </header>

      {/* Navegación desktop */}
      {windowWidth > 768 && (
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 mt-4 text-sm sm:text-base md:text-lg font-semibold border-y border-[#8C956060] py-2 px-2">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              onClick={() => scrollToSection(categoria)}
              className="hover:text-[#DC9C5C] px-2 py-1"
            >
              {categoria}
            </button>
          ))}
        </nav>
      )}

      {/* Menú móvil */}
      {windowWidth <= 768 && isMenuOpen && (
        <motion.div
          className="fixed top-0 left-0 h-full w-[80%] max-w-[300px] bg-[#F5F1F1] shadow-xl z-50 p-4"
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          transition={{ type: 'tween', ease: 'easeInOut' }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Categorías</h3>
            <button onClick={toggleMenu} className="text-2xl text-[#8C9560]">
              <FiX />
            </button>
          </div>
          <div className="flex flex-col space-y-3 text-base font-medium">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                onClick={() => scrollToSection(categoria)}
                className="hover:text-[#DC9C5C] text-left py-2"
              >
                {categoria}
              </button>
            ))}
          </div>
        </motion.div>
      )}

        <main className="p-4">
        <Publicidad items={items} />
       </main>

      {/* Botón de personalización */}
      <div className="text-center my-8 md:my-10 px-4">
        <motion.button
          onClick={handlePersonalizarClick}
          className={`relative px-6 py-3 md:px-8 md:py-4 bg-[#762114] text-white rounded-full text-base md:text-lg font-bold shadow-lg flex items-center mx-auto ${isButtonGlowing ? 'animate-glow' : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Personalizar mi joya <FiArrowRight className="ml-2" />
          {isButtonGlowing && (
            <motion.span 
              className="absolute inset-0 rounded-full bg-[#DC9C5C] opacity-0"
              animate={{ opacity: [0, 0.5, 0], scale: [1, 1.2, 1.5] }}
              transition={{ duration: 1 }}
            />
          )}
        </motion.button>
      </div>

     {/* Sección de productos */}
      {Object.entries(obtenerProductosAMostrar()).map(([categoria, items]) => (
        <section
          id={categoria}
          key={categoria}
          className="mt-8 md:mt-12 px-3 sm:px-4 md:px-6 border-t border-[#8C956020] pt-4 md:pt-6 relative z-0"
        >
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#7B2710] mb-2 text-center sm:text-left"
            style={{ fontFamily: "Alex Brush" }}
          >
            {categoria}
          </h2>
          <hr className="mb-3 md:mb-4 border-t border-[#8C956040]" />
          <div className="flex overflow-x-auto pb-4 space-x-3 sm:space-x-4 md:space-x-6 p-2 md:p-4 relative z-0 scrollbar-hide">
            {items.map((producto, index) => (
              <div
                  key={producto.id || index}
                  className="relative min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] max-w-[220px] bg-white p-3 md:p-4 rounded-lg shadow-lg flex flex-col justify-between transform transition-transform duration-300 hover:scale-105 flex-shrink-0 h-[260px] sm:h-[260px] md:h-[300px] lg:h-[280px]"
                >
                <img
                  src={producto.image || "/placeholder.jpg"}
                  alt={producto.name}
                  onClick={() => setVerProductoId(producto.id)} // nuevo
                  className="w-full h-36 object-cover object-center rounded-lg transition-transform duration-300 hover:scale-105"
                />
                <div className="flex-grow flex flex-col justify-between mt-2">
                  <div className="relative group">
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold text-center cursor-pointer line-clamp-2">
                      {truncateText(producto.name, 18)}
                    </h3>
                    <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-max max-w-[200px] px-2 py-1 bg-white border border-gray-200 shadow-lg rounded-md text-xs text-gray-800 opacity-0 pointer-events-none transition-all duration-150 group-hover:opacity-100">
                      {producto.name}
                    </div>
                  </div>
                  <p className="text-[#DC9C5C] font-bold text-center text-sm sm:text-base mt-1">
                    ${producto.price}
                  </p>
                </div>
                <div className="flex justify-center mt-3">
                  <button className="bg-[#762114] text-white py-1 sm:py-2 px-4 sm:px-6 rounded-lg hover:bg-[#DC9C5C] transition-colors w-full max-w-[160px] sm:max-w-[180px] text-xs sm:text-sm">
                    Agregar al carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        
      ))}
      {verProductoId && (
          <VerProducto idProducto={verProductoId} onClose={() => setVerProductoId(null)} />
        )}

      {/* Footer */}
      <footer className="mt-12 px-4 md:px-6 py-6 bg-[#8C9560] text-white text-center text-xs sm:text-sm">
        <p>&copy; {new Date().getFullYear()} Bernarda Sierra. Todos los derechos reservados.</p>
        <p className="mt-1 sm:mt-2">Sitio web desarrollado con ❤️ y dedicación.</p>
      </footer>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes glow {
          0% { box-shadow: 0 0 5px rgba(220, 156, 92, 0.5); }
          50% { box-shadow: 0 0 20px rgba(220, 156, 92, 0.9); }
          100% { box-shadow: 0 0 5px rgba(220, 156, 92, 0.5); }
        }
        .animate-glow {
          animation: glow 1.5s infinite;
        }
      `}</style>
    </div>
    
  );
}