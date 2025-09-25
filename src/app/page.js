"use client";

import { useState, useEffect, useRef } from "react"; // Añade useRef
import { FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Publicidad from "@/components/Publicidad";
import VerProducto from "@/components/verProducto";
import BotonAgregarCarrito from "@/components/BotonAgregarCarrito";
import NavCliente from "@/components/NavCliente";
import WhatsAppChatWidget from '@/components/WhatsAppChatWidget';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isButtonGlowing, setIsButtonGlowing] = useState(false);
  const [productosDinamicos, setProductosDinamicos] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [items, setItems] = useState([]);
  const [verProductoId, setVerProductoId] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const router = useRouter();
  
  // Añade esta referencia para las secciones
  const sectionRefs = useRef({});

  // Función scrollToSection - AÑADE ESTA FUNCIÓN
  const scrollToSection = (categoria) => {
    const element = document.getElementById(`section-${categoria}`);
    if (element) {
      // Calcula el offset considerando el header fijo si lo tienes
      const headerOffset = 100; // Ajusta este valor según la altura de tu header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Función para asignar refs - OPCIONAL si prefieres usar refs en lugar de IDs
  const setSectionRef = (categoria) => (el) => {
    sectionRefs.current[categoria] = el;
  };

  useEffect(() => {
    const obtenerPublicidad = async () => {
      try {
        const res = await fetch("/api/publicidad");
        const texto = await res.text();
        console.log("🧾 Respuesta cruda:", texto);
        const data = JSON.parse(texto);
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
    <div className="min-h-screen bg-[#F5F1F1] text-[#762114] reltive">
      <NavCliente />

      {/* Navegación desktop */}
      {windowWidth > 768 && (
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 mt-4 text-sm sm:text-base md:text-lg font-semibold border-y border-[#8C956060] py-2 px-2">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              onClick={() => scrollToSection(categoria)} // Ahora esta función está definida
              className="hover:text-[#DC9C5C] px-2 py-1"
            >
              {categoria}
            </button>
          ))}
        </nav>
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

      {/* Sección de productos - AÑADE ID A CADA SECCIÓN */}
      {Object.entries(obtenerProductosAMostrar()).map(([categoria, items]) => (
        <section
          id={`section-${categoria}`} // Añade ID único para cada sección
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
            {items.map((producto, index) => {
              return (
                <div
                  key={producto.id || index}
                  className="relative min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] max-w-[220px] bg-white p-3 md:p-4 rounded-lg shadow-lg flex flex-col justify-between transform transition-transform duration-300 hover:scale-105 flex-shrink-0 h-[260px] sm:h-[260px] md:h-[300px] lg:h-[280px]"
                >
                  <img
                    src={producto.image && producto.image.trim() !== "" ? producto.image : "/placeholder.jpg"}
                    alt={producto.name || "Producto"}
                    onClick={() => setVerProductoId(producto.id)}
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
                    <BotonAgregarCarrito producto={producto} />
                  </div>
                </div>
              );
            })}
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