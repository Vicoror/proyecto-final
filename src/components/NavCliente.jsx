import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiUser, FiLogOut, FiSearch, FiX, FiSettings } from 'react-icons/fi';
import Link from 'next/link';
import IconoCarrito from './IconoCarrito';
import BotonAgregarCarrito from "@/components/BotonAgregarCarrito";
import VerProducto from "@/components/verProducto";
import { useAuth } from "@/components/AuthContext";
import { useRouter, usePathname } from 'next/navigation'; 

const categorias = ["Anillos", "Collares", "Aretes", "Pulseras", "Brazaletes", "Piedras"];

const ProductosComponent = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [anuncioIndex, setAnuncioIndex] = useState(0);
  const [productosDinamicos, setProductosDinamicos] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [windowWidth, setWindowWidth] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [verProductoId, setVerProductoId] = useState(null);
  const { isLoggedIn, user, login, logout } = useAuth(); 
  const router = useRouter();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const pathname = usePathname(); // Obtiene la ruta actual
  const isHome = pathname === '/'; // Solo es la página principal
  const headerRef = useRef(null);
  const anunciosRef = useRef(null);
  const [contentPadding, setContentPadding] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
  const updatePadding = () => {
    const headerHeight = headerRef.current?.offsetHeight || 0;
    const anunciosHeight = anunciosRef.current?.offsetHeight || 0;
    setContentPadding(headerHeight + anunciosHeight + 10); // +10px de respiro
  };

    updatePadding();
    window.addEventListener("resize", updatePadding);
    return () => window.removeEventListener("resize", updatePadding);
  }, []);

  // Resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
  const checkScreen = () => setIsMobile(window.innerWidth < 768);
  checkScreen(); // checar en el primer render (ya en cliente)
  window.addEventListener("resize", checkScreen);
  return () => window.removeEventListener("resize", checkScreen);
}, []);

  // Mantener sesión
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser && !user) {
      login(JSON.parse(storedUser));
    }
  }, []);

  // Rotar anuncios
  useEffect(() => {
    if (anuncios.length > 1) {
      const interval = setInterval(() => {
        setAnuncioIndex((prev) => (prev + 1) % anuncios.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [anuncios]);

  // Cargar anuncios
  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        const res = await fetch('/api/anuncios');
        const data = await res.json();
        setAnuncios(data.filter((a) => a.activo));
      } catch (error) {
        console.error("Error cargando anuncios", error);
      }
    };
    fetchAnuncios();
  }, []);

  // Cargar productos iniciales
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetch('/api/productos');
        if (response.ok) {
          const data = await response.json();
          setProductosDinamicos(data);
          setSearchResults(data);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
        setProductosDinamicos([]);
        setSearchResults([]);
      }
    };
    cargarProductos();
  }, []);

  // Sugerencias
  const fetchSuggestions = async (term) => {
  if (!term.trim()) {
    setSuggestions([]);
    return;
  }
  try {
    const response = await fetch(`/api/productos?search=${encodeURIComponent(term)}&suggestions=true`);
    if (response.ok) {
      const data = await response.json();

      // Filtrar solo productos activos
      const activos = data.filter((p) => p.activo);

      setSuggestions(activos.slice(0, 5)); // solo 5 sugerencias activos
    }
  } catch (error) {
    console.error("Error obteniendo sugerencias:", error);
    setSuggestions([]);
  }
};

  // Buscar
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Ingrese un término de búsqueda");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");
    setShowSuggestions(false);
    try {
      const response = await fetch(`/api/productos?search=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error("Error al buscar productos");
      const data = await response.json();
      const results = Array.isArray(data) ? data : [data];
      
      // 🔹 FILTRAR SOLO PRODUCTOS ACTIVOS
      const productosActivos = results.filter(producto => 
        producto.activo === 1 || producto.estado === 1 || producto.status === 1
      );
      
      if (productosActivos.length === 0) throw new Error("No se encontraron productos activos");
      
      setSearchResults(productosActivos);
      setSuccess(`Encontrados: ${productosActivos.length} productos`);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Validar entrada
  const handleSearchChange = (e) => {
  const value = e.target.value;
  if (/^[a-zA-Z0-9\s]*$/.test(value) && value.length <= 20) {
    setSearchTerm(value);
    fetchSuggestions(value); // <-- aquí llamas a la función
    setShowSuggestions(true);
  }
};


  const toggleMenu = () => setMenuAbierto((prev) => !prev);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuAbierto(false);
    setActiveCategory(id);
  };

  const handleKeyPress = (e) => e.key === 'Enter' && handleSearch();

  const truncateText = (text, maxLength) =>
    !text ? '' : text.length <= maxLength ? text : text.substring(0, maxLength) + '...';

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      logout();
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserIconClick = () => {
    router.push(isLoggedIn ? '/Cliente' : '/login');
  };

  const selectSuggestion = (suggestion) => {
    setSearchTerm(suggestion.nombre);
    setShowSuggestions(false);
    handleSearch();
  };

  return (
    <div className="bg-[#F5F1F1]">
      {/* 🔔 Barra de anuncios */}
      <motion.div
        ref={anunciosRef}
        className="w-full py-2 text-center fixed top-0 z-50 text-[#F5F1F1]"
        style={{ backgroundColor: "rgba(140, 149, 96, 0.75)", backdropFilter: "blur(5px)" }}
        animate={{ opacity: [0, 1], x: [-50, 0] }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs sm:text-sm px-2 truncate">{anuncios[anuncioIndex]?.titulo}</p>
      </motion.div>

      {/* 🔝 Header */}
      <header
       ref={headerRef}
       className="fixed top-8 left-0 right-0 z-40 bg-[#F5F1F1] shadow-sm pt-2 pb-2 px-4">
  <div className="flex items-center justify-between w-full gap-2 flex-wrap">
    {/* Menú hamburguesa */}
    {isHome && windowWidth <= 768 && (
      <button onClick={toggleMenu} className="text-2xl text-[#8C9560] order-1">
        <FiMenu />
      </button>
    )}

    {isHome && windowWidth <= 768 && menuAbierto && (
      <motion.div
        className="fixed top-0 left-0 h-full w-[80%] max-w-[300px] bg-[#F5F1F1] shadow-xl z-50 p-4"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "tween", ease: "easeInOut" }}
      >
        {/* Botón de cerrar */}
        <div className="flex justify-end pt-10">
          <button onClick={toggleMenu} className="text-2xl text-[#8C9560]">
            <FiX />
          </button>
        </div>

        {/* Botones de categorías */}
        <div className="flex flex-col space-y-3 text-base font-medium">
          {categorias.map((categoria) => (
            
            <button
              key={categoria}
              onClick={() => {
                const element = document.getElementById(`section-${categoria}`);
                if (element) {
                  const headerOffset = 100;
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                  window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                  toggleMenu();
                }
              }}
              className={`hover:text-[#DC9C5C] text-left py-2 px-2 rounded ${
                activeCategory === categoria ? "bg-[#8C9560] text-white" : ""
              }`}
            >
              {categoria}
            </button>
          ))}
        </div>
      </motion.div>
    )}

    {/* Logo - en desktop queda alineado a la izquierda; en móvil ocupa toda la fila y se centra */}
    <div
      className={`${
        windowWidth > 768
          ? "flex items-center mr-auto order-1 w-auto"
          : "w-full order-3 flex justify-center mt-0"
      }`}
    >
      <Link href="/.">
      <h1
        className="text-4xl md:text-5xl lg:text-5xl font-bold hover:text-[#DC9C5C] text-[#7B2710] transition-colors whitespace-nowrap text-center"
        style={{ fontFamily: "Alex Brush" }}
      >
        Bernarda Sierra
      </h1>
</Link>

    </div>

    {/* Buscador Desktop */}
    {windowWidth > 768 && (
      <div className="flex-1 max-w-md mx-4 relative order-2" ref={searchRef}>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-16 py-1 rounded-full border border-[#8C9560] focus:outline-none focus:ring-2 focus:ring-[#DC9C5C] text-sm"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            maxLength={20}
          />
          <FiSearch className="absolute left-3 text-[#8C9560]" />
          <button
            onClick={handleSearch}
            className="absolute right-0 px-3 py-1 bg-[#8C9560] text-white rounded-full hover:bg-[#6c7550] transition-colors text-sm"
          >
            Buscar
          </button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 z-50 max-h-60 overflow-y-auto">
            {suggestions
              .filter(producto => producto.activo === 1) // 🔹 FILTRAR SOLO ACTIVOS
              .map((s) => (
                <div
                  key={s.id_productos}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => selectSuggestion(s)}
                >
                  {s.nombre}
                </div>
              ))}
          </div>
        )}
      </div>
    )}

    {/* User + Carrito */}
<div className="flex items-center space-x-3 text-xl text-[#8C9560] ml-auto order-2 md:order-3">
  {isLoggedIn ? (
    <>
      {/* Botón perfil */}
      <button
        onClick={handleUserIconClick}
        className="hover:text-[#DC9C5C] group relative flex items-center"
        aria-label="Mi perfil"
      >
        <span className="text-sm sm:text-base font-serif mr-1">
          {user?.nombre || "Usuario"}
        </span>
        <FiUser className="text-xl sm:text-2xl" />
        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                         bg-[#DC9C5C] text-white text-xs px-2 py-1 rounded 
                         opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Mi perfil
        </span>
      </button>

      {/* Botón cerrar sesión */}
      <button
        onClick={handleLogout}
        className="hover:text-[#DC9C5C] group relative flex items-center"
        aria-label="Cerrar sesión"
      >
        <FiLogOut className="text-xl sm:text-2xl" />
        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                         bg-[#DC9C5C] text-white text-xs px-2 py-1 rounded 
                         opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Cerrar sesión
        </span>
      </button>

      {/* Botón admin*/}
      {user?.rol === "admin" && (
        <Link
          href="/Admin"
          className="flex items-center gap-2 bg-[#8C9560] text-white px-4 py-2 rounded-full hover:bg-[#6c7550]"
          aria-label="Admin"
        >
          <FiSettings className="text-xl" />
          {/* Este texto solo aparece en pantallas medianas hacia arriba */}
          <span className="hidden md:inline">Menú Admin</span>
        </Link>
      )}

    </>
  ) : (
    /* Botón iniciar sesión */
    <button
      onClick={handleUserIconClick}
      className="hover:text-[#DC9C5C] group relative flex items-center"
      aria-label="Iniciar sesión"
    >
      <FiUser className="text-xl sm:text-2xl" />
      <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                       bg-[#DC9C5C] text-white text-xs px-2 py-1 rounded 
                       opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Iniciar sesión
      </span>
    </button>
  )}

  {/* Carrito */}
  <div className="hover:text-[#DC9C5C] group relative flex items-center">
    <IconoCarrito className="text-xl sm:text-2xl" />
    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                     bg-[#DC9C5C] text-white text-xs px-2 py-1 rounded 
                     opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      Carrito
    </span>
  </div>
</div>
</div>

  {/* Subtítulo y buscador móvil */}
  <div className="flex flex-col items-center mt-1">
   <h2 className="text-sm md:text-base lg:text-xl text-[#DC9C5C]">Joyería artesanal</h2>
    {windowWidth <= 768 && (
      <div className="w-full mt-2 relative" ref={searchRef}>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full pl-8 pr-16 py-2 rounded-full border border-[#8C9560] focus:outline-none focus:ring-1 focus:ring-[#DC9C5C] text-sm"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            maxLength={20}
          />
          <FiSearch className="absolute left-3 text-[#8C9560]" />
          <button
            onClick={handleSearch}
            className="absolute right-2 px-3 py-1 bg-[#8C9560] text-white rounded-full hover:bg-[#6c7550] active:scale-95 transition-all"
            aria-label="Buscar productos"
          >
            <FiSearch className="text-sm" />
          </button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 z-50 max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <div
                key={s.id_productos}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => selectSuggestion(s)}
              >
                {s.nombre}
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
</header>


      {/* 📦 Contenido principal */}
      <main
        style={{
          paddingTop: isMobile ? `${contentPadding}px` : "130px", // dinámico en móvil, fijo en desktop
        }}
        className="pt-20 pb-0 px-4">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
        {isLoading ? (
          <div className="text-center py-10"><p className="text-[#8C9560]">Buscando productos...</p></div>
        ) : searchResults.length > 0 ? (
          <div className={`${windowWidth <= 768 ? 'flex overflow-x-auto space-x-4 pb-4' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10'}`}>
            {searchResults.map((producto) => {
  // Preparar stock seleccionado si es anillo
  const stockSeleccionado =
    producto?.categoria === "Anillos"
      ? producto.stockTallas?.[0] || { stock: producto.stock, id_stock: null, talla: "" }
      : null;

  // Preparar objeto para el carrito
  const productoCarrito = {
    id: producto.id_productos,
    name: producto.nombre,
    price: producto.precio,
    description: producto.descripcion,
    image: producto.imagen,
    image2: producto.imagen2,
    image3: producto.imagen3,
    categoria: producto.categoria,
    talla: stockSeleccionado?.talla,
    stock:
      producto.categoria === "Anillos"
        ? stockSeleccionado.stock
        : producto.stock,
    id_stock: stockSeleccionado?.id_stock || null,
    uniqueId:
      producto.categoria === "Anillos"
        ? `${producto.id_productos}-${stockSeleccionado?.id_stock || 0}-${stockSeleccionado?.talla || ""}`
        : String(producto.id_productos),
  };

  return (
    <div
      key={producto.id_productos}
      className={`${
        windowWidth <= 768 ? "min-w-[160px]" : ""
      } relative bg-white p-3 md:p-4 rounded-lg shadow-lg flex flex-col justify-between transform transition-transform hover:scale-105`}
    >
      <img
        src={producto.imagen || "/placeholder.jpg"}
        alt={producto.nombre}
        onClick={() => setVerProductoId(producto.id_productos)}
        className="w-full h-36 object-contain bg-gray-100 rounded-lg hover:scale-105 cursor-pointer transition-transform"
      />
      <div className="flex-grow flex flex-col justify-between mt-2">
        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-center line-clamp-2">
          {truncateText(producto.nombre, 18)}
        </h3>
        <p className="text-[#DC9C5C] font-bold text-center text-sm sm:text-base mt-1">
          ${producto.precio}
        </p>
        <BotonAgregarCarrito producto={productoCarrito} />
      </div>
    </div>
  );
})}
          </div>
        ) : null  
         }
        {verProductoId && (
          <VerProducto idProducto={verProductoId} onClose={() => setVerProductoId(null)} />
        )}
      </main>
    </div>
  );
};

export default ProductosComponent;
