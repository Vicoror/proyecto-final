"use client";

import { useState, useEffect } from "react";
import { FiUser, FiShoppingCart, FiMenu, FiX, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Presentacion from "@/components/Presentacion";

const categorias = ["Anillos", "Collares", "Aretes", "Pulseras", "Brazaletes", "Piedras"];

// Nuevas imágenes de presentación
const imagenesPresentacion = {
  carrusel: [
    "/img1.jpg",
    "/img2.jpg",
    "/img3.jpg",
    "/img4.jpg",
    "/img5.jpg",
  ],
  seccionMedia: {
    tipo: "video", // o "imagen"
    src: "/video.mp4" // o "/imagenMedia.jpg"
  },
  imagenFinal: "/imgFinal.jpg"
};

const productos = {
  Anillos: [
    { nombre: "Anillo de Plata", precio: "500", imagen: "/anillo1.jpg" },
 
  ],
  Collares: [
    { nombre: "Collar de Cuarzo Rosa", precio: "950", imagen: "/collar1.jpg" },

  ],
  Aretes: [
    { nombre: "Aretes de Cuarzo", precio: "600", imagen: "/arete1.jpg" },
  
  ],
  Pulseras: [
    { nombre: "Pulsera de Cuarzo", precio: "550", imagen: "/pulsera1.jpg" },
   
  ],
  Brazaletes: [
    { nombre: "Brazalete de Plata", precio: "1200", imagen: "/brazalete1.jpg" },
    
  ],
  Piedras: [
    { nombre: "Amatista", precio: "1200", imagen: "/brazalete1.jpg" },
 
  ]
 // ... (resto de los productos permanece igual)
};

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};


export default function Home() {
  const [anuncios, setAnuncios] = useState([]);
  const [anuncioIndex, setAnuncioIndex] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isButtonGlowing, setIsButtonGlowing] = useState(false);

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        const res = await fetch('/api/anuncios');
        const data = await res.json();
        setAnuncios(data);
      } catch (error) {
        console.error("Error cargando anuncios", error);
      }
    };
  
    fetchAnuncios();
  }, []);
  
  useEffect(() => {
    const fetchAnuncios = async () => {
      const res = await fetch("/api/anuncios");
      const data = await res.json();
      // Solo anuncios activos
      const activos = data.filter((a) => a.activo);
      setAnuncios(activos);
    };
  
    fetchAnuncios();
  }, []);

  const [productosDinamicos, setProductosDinamicos] = useState(null);
   // Nuevo efecto para cargar productos dinámicos
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
        // Si hay error, usa los productos estáticos
        setProductosDinamicos(productos);
      }
    };

    cargarProductos();
  }, []);

    // Función para determinar qué productos mostrar
    const obtenerProductosAMostrar = () => {
      // Si hay productos dinámicos y no están vacíos, úsalos
      if (productosDinamicos && Object.keys(productosDinamicos).length > 0) {
        return productosDinamicos;
      }
      // Si no, usa los productos estáticos
      return productos;
    };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
        if (window.innerWidth > 768) {
          setIsMenuOpen(false);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (anuncios.length === 0) return; // Evitar si no hay anuncios aún
  
    const interval = setInterval(() => {
      setAnuncioIndex((prevIndex) => (prevIndex + 1) % anuncios.length);
    }, 3000);
  
    return () => clearInterval(interval);
  }, [anuncios]); 

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handlePersonalizarClick = () => {
    // Efecto de brillo al hacer click
    setIsButtonGlowing(true);
    
    // Redirección después de 1 segundo (para que se vea el efecto de brillo)
    setTimeout(() => {
      setIsButtonGlowing(false);
      router.push('/productosPersonalizados'); // Redirige a la página de productos personalizados
    }, 1000);
  };

  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F5F1F1] text-[#762114]">
      {/* Barra de anuncios */}
      <motion.div
        className="w-full py-2 text-center fixed top-0 z-50 text-[#F5F1F1]"
        style={{ backgroundColor: "rgba(140, 149, 96, 0.75)", backdropFilter: "blur(5px)" }}
        animate={{ opacity: [0, 1], x: [-50, 0] }}
        transition={{ duration: 0.5 }}
      >
        {anuncios[anuncioIndex]?.titulo}
      </motion.div>

      {/* Encabezado */}
      <header className="flex justify-between items-center p-5 pt-14">
        <div className="flex items-center">
          {windowWidth <= 768 && (
            <button 
              onClick={toggleMenu}
              className="mr-4 text-2xl text-[#8C9560]"
            >
              {isMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          )}
          <h1 className="text-4xl md:text-6xl font-bold" style={{ fontFamily: "Alex Brush" }}>Bernarda Sierra</h1>
        </div>
        
        <div className="flex items-center space-x-6 text-xl">
          <Link href="/login" className="flex items-center text-[#8C9560] cursor-pointer hover:text-[#DC9C5C]">
            <FiUser className="ml-2" />
          </Link>
          <button className="flex items-center text-[#8C9560] hover:text-[#DC9C5C]">
            <FiShoppingCart size={24} />
          </button>
        </div>
      </header>
      
      <h2 className="text-2xl text-[#DC9C5C] mt-0 pl-10 md:pl-10">Joyería artesanal</h2>

      {/* Menú de categorías */}
      {windowWidth > 768 ? (
        <nav className="flex justify-center space-x-6 mt--10 text-lg font-semibold" >
          {categorias.map((categoria) => (
            <button
              key={categoria}
              className="cursor-pointer hover:text-[#DC9C5C]"
              onClick={() => scrollToSection(categoria)}
            >
              {categoria}
            </button>
          ))}
        </nav>
      ) : (
        <motion.nav
          className={`fixed top-0 left-0 w-full h-full bg-[#F5F1F1] z-40 pt-20 ${isMenuOpen ? 'block' : 'hidden'}`}
          initial={{ x: '-100%' }}
          animate={{ x: isMenuOpen ? 0 : '-100%' }}
          transition={{ type: 'tween', ease: 'easeInOut' }}
        >
          <div className="flex flex-col items-center space-y-6 text-xl font-semibold p-6" >
            {categorias.map((categoria) => (
              <button
                key={categoria}
                className="cursor-pointer hover:text-[#DC9C5C] py-2 " 
                onClick={() => scrollToSection(categoria)}
              >
                {categoria}
              </button>
            ))}
          </div>
        </motion.nav>
      )}

      <Presentacion />

      {/* Nueva sección de presentación */}
      <section className="mt-8 px-4 md:px-8">

        {/* Botón de personalización */}
        <div className="text-center my-10">
          <motion.button
            onClick={handlePersonalizarClick}
            className={`relative px-8 py-4 bg-[#762114] text-white rounded-full text-lg font-bold shadow-lg flex items-center mx-auto ${isButtonGlowing ? 'animate-glow' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Personalizar mi joya
            <FiArrowRight className="ml-2" />
            {/* Efecto de brillo */}
            {isButtonGlowing && (
              <motion.span 
                className="absolute inset-0 rounded-full bg-[#DC9C5C] opacity-0 "
                animate={{ opacity: [0, 0.5, 0], scale: [1, 1.2, 1.5] }}
                transition={{ duration: 1 }}
              />
            )}
          </motion.button>
        </div>
      </section>

          {/* Secciones de productos modificadas */}
          {Object.entries(obtenerProductosAMostrar()).map(([categoria, items]) => {
          // Función para truncar texto
          const truncateText = (text, maxLength) => {
            if (!text) return '';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
          };

          return (
            <section id={categoria} key={categoria} className="mt-10 px-4 md:px-6">
              <h2 className="text-4xl font-bold text-[#7B2710] mb-4"  style={{ fontFamily: "Alex Brush" }}>{categoria } </h2>
              <div className="flex overflow-x-auto space-x-4 md:space-x-6 p-2 md:p-4">
                {items.map((producto, index) => (
                  <div 
                    key={producto.id || index} 
                    className="min-w-[180px] md:min-w-[220px] bg-white p-3 md:p-4 rounded-lg shadow-lg flex flex-col"
                    style={{ height: "340px" }} // Altura fija
          >
            <img 
              src={producto.imagen || producto.image || '/placeholder.jpg'} 
              alt={producto.nombre || producto.name} 
              className="w-full h-32 md:h-40 object-cover rounded-lg" 
            />
            <div className="mt-3 flex-grow flex flex-col">
              <h3 
                className="text-md md:text-lg font-semibold text-center" 
                title={producto.nombre || producto.name} // Mostrar texto completo al hacer hover
              >
                {truncateText(producto.nombre || producto.name, 30)} {/* Ajusta 30 según necesidad */}
              </h3>
              <p className="text-[#DC9C5C] font-bold text-center mt-1">
                ${producto.precio || producto.price}
              </p>
              {(producto.descripcion || producto.description) && (
                <p 
                  className="text-sm text-gray-600 mt-2 text-center flex-grow"
                  title={producto.descripcion || producto.description} // Mostrar texto completo al hacer hover
                >
                  {truncateText(producto.descripcion || producto.description, 20)} {/* Ajusta 100 según necesidad */}
                </p>
              )}
            </div>
            <div className="mt-3 flex justify-center">
              <button className="bg-[#762114] text-white py-2 px-6 rounded-lg hover:bg-[#DC9C5C] transition-colors w-full max-w-[180px]">
                Agregar al carrito
              </button>
            </div>
          </div> 
            ))}
            </div>
          </section>
        );
      })}
  
      {/* Estilos para la animación de brillo */}
      <style jsx>{`
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