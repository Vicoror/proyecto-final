import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiUser, FiLogOut, FiSearch, FiX, FiHome } from 'react-icons/fi';
import Link from 'next/link';
import IconoCarrito from './IconoCarrito';
import BotonAgregarCarrito from "@/components/BotonAgregarCarrito";
import VerProducto from "@/components/verProducto";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from 'next/navigation'; 


const categorias = ["Anillos", "Collares", "Aretes", "Pulseras", "Brazaletes", "Piedras"];

const ProductosComponent = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [anuncioIndex, setAnuncioIndex] = useState(0);
  const [productosDinamicos, setProductosDinamicos] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterface, setSelectedInterface] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [windowWidth, setWindowWidth] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [verProductoId, setVerProductoId] = useState(null);
  const { isLoggedIn, user, login, logout } = useAuth(); 
  const router = useRouter();
  

  // Efecto para manejar el cambio de tamaño de ventana
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
  const token = localStorage.getItem('authToken');
  const storedUser = localStorage.getItem('user');
  
  if (token && storedUser && !user) { // <- Verifica !user para evitar loops
    login(JSON.parse(storedUser));
  }
}, []);  // Agrega las dependencias

  // Efecto para rotar anuncios
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
        const activos = data.filter((a) => a.activo);
        setAnuncios(activos);
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

  // Función de búsqueda mejorada
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Ingrese un término de búsqueda");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    setSearchResults([]);

    try {
      const response = await fetch(`/api/productos?search=${encodeURIComponent(searchTerm)}&type=${selectedInterface}`);
      if (!response.ok) throw new Error("Error al buscar productos");

      const data = await response.json();
      const results = Array.isArray(data) ? data : [data];

      if (results.length === 0) {
        throw new Error("No se encontraron productos");
      }

      const normalizedResults = results.map(item => ({
        id: item.id || item.id_productos || item.id_productosPerso || "",
        name: item.nombre || item.name || item.nombrePerso || "",
        price: item.precio || item.price || 0,
        description: item.descripcion || item.description || "",
        category: item.categoria || item.category || "",
        active: item.activo !== undefined ? item.activo : true,
        stock: item.stock ?? 0,
        image: item.imagen || item.image || '/default-product.png'
      }));

      setSearchResults(normalizedResults);
      setSuccess(`Encontrados: ${normalizedResults.length} productos`);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuAbierto(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
    const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
        };
       const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      logout(); // Limpiar contexto de autenticación
      localStorage.removeItem('authToken'); // Limpiar token
      localStorage.removeItem('user'); // Limpiar datos de usuario (si existen)
      router.push('/'); // Redirigir al home
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  
  // 🔥 Función para manejar clic en ícono de usuario
  const handleUserIconClick = () => {
    if (isLoggedIn) {
      router.push('/Cliente'); // Redirige a Cliente si hay sesión
    } else {
      router.push('/login'); // Redirige a Login si no hay sesión
    }
  };
    return (
    <div className="bg-[#F5F1F1]">
      {/* Barra de anuncios - Fija en la parte superior */}
      <motion.div
        className="w-full py-2 text-center fixed top-0 z-50 text-[#F5F1F1]"
        style={{ backgroundColor: "rgba(140, 149, 96, 0.75)", backdropFilter: "blur(5px)" }}
        animate={{ opacity: [0, 1], x: [-50, 0] }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs sm:text-sm px-2 truncate">{anuncios[anuncioIndex]?.titulo}</p>
      </motion.div>

      {/* Header fijo y responsive */}
      <header className="fixed top-8 left-0 right-0 z-40 bg-[#F5F1F1] shadow-sm pt-2 pb-2 px-4">
        <div className="flex items-center justify-between w-full gap-2">
          {/* Menú hamburguesa solo en móvil */}
          {windowWidth <= 768 && (
            <button onClick={toggleMenu} className="text-2xl text-[#8C9560]">
              <FiMenu />
            </button>
          )}
          {/* Menú móvil */}
                {windowWidth <= 768 && menuAbierto && (
                  <motion.div
                    className="fixed top-10 left-0 h-full w-[80%] max-w-[300px] bg-[#F5F1F1] shadow-xl z-50 p-4"
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
          

          {/* Logo/Título centrado en móvil, a la izquierda en desktop */}
          <Link href="/." className={`flex items-center ${windowWidth > 768 ? 'mr-auto' : 'mx-auto'}`}>
            <h1
              className="text-4xl font-bold hover:text-[#DC9C5C] transition-colors text-[#7B2710]"
              style={{ fontFamily: "Alex Brush" }}
            >
              Bernarda Sierra
            </h1>
          </Link>

          {/* Barra de búsqueda - Oculto en móvil */}
            {windowWidth > 768 && (
            <div className="flex-1 max-w-md mx-4">
                <div className="relative flex items-center">
                <input
                    type="text"
                    placeholder="Buscar productos..."
                    className="w-full pl-10 pr-16 py-1 rounded-full border border-[#8C9560] focus:outline-none focus:ring-2 focus:ring-[#DC9C5C] text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <FiSearch className="absolute left-3 text-[#8C9560]" />
                <button
                    onClick={handleSearch}
                    className="absolute right-0 px-3 py-1 bg-[#8C9560] text-white rounded-full hover:bg-[#6c7550] transition-colors text-sm"
                >
                    Buscar
                </button>
                </div>
            </div>
            )}

          {/* Íconos de usuario y carrito - Siempre visibles */}
          <div className="flex items-center space-x-3 text-xl text-[#8C9560] ml-auto">
        {isLoggedIn ? (
          <>
            <button 
              onClick={handleUserIconClick} 
              className="hover:text-[#DC9C5C] group relative flex items-center"
              aria-label="Mi perfil"
            >
              <span className="text-sm sm:text-base font-serif mr-1">
                {user?.nombre || 'Usuario'} {/* Muestra el nombre o 'Usuario' como fallback */}
              </span>
              <FiUser className="text-xl sm:text-2xl" />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-[#DC9C5C] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Mi perfil
              </span>
            </button>
            <button 
              onClick={handleLogout} 
              className="hover:text-[#DC9C5C] group relative"
              aria-label="Cerrar sesión"
            >
              <FiLogOut className="text-xl sm:text-2xl" />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-[#DC9C5C] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Cerrar sesión
              </span>
            </button>
          </>
        ) : (
          <button 
            onClick={handleUserIconClick} 
            className="hover:text-[#DC9C5C] group relative"
            aria-label="Iniciar sesión"
          >
            <FiUser className="text-xl sm:text-2xl" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-[#DC9C5C] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Iniciar sesión
            </span>
          </button>
        )}
        <div className="hover:text-[#DC9C5C]">
          <IconoCarrito />
        </div>
      </div>
        </div>

        {/* Subtítulo y barra de búsqueda móvil */}
            <div className="flex flex-col items-center mt-1">
            <h2 className="text-sm text-[#DC9C5C]">Joyería artesanal</h2>
            
            {windowWidth <= 768 && (
                <div className="w-full mt-2">
                <div className="relative flex items-center">
                    <input
                    type="text"
                    placeholder="Buscar productos..."
                    className="w-full pl-8 pr-16 py-2 rounded-full border border-[#8C9560] focus:outline-none focus:ring-1 focus:ring-[#DC9C5C] text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    />
                    <FiSearch className="absolute left-3 text-[#8C9560]" />
                    
                    {/* Botón de búsqueda optimizado para móvil */}
                    <button
                    onClick={handleSearch}
                    className="absolute right-2 px-3 py-1 bg-[#8C9560] text-white rounded-full hover:bg-[#6c7550] active:scale-95 transition-all"
                    aria-label="Buscar productos"
                    >
                    <FiSearch className="text-sm" />
                    </button>
                </div>
                </div>
            )}
            </div>
      </header>
      {/* Contenido principal */}
      <main className="pt-32 pb-10 px-4">
        {/* Mensajes de estado */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mt-16 sm:mt-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 mt-16 sm:mt-4">
            {success}
          </div>
        )}

        {/* Lista de productos */}
        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-[#8C9560]">Buscando productos...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
            {searchResults.map((producto) => (
              <div key={producto.id} className="relative min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] max-w-[220px] bg-white p-3 md:p-4 rounded-lg shadow-lg flex flex-col justify-between transform transition-transform duration-300 hover:scale-105 flex-shrink-0 h-[260px] sm:h-[260px] md:h-[300px] lg:h-[280px]">
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
            ))}
          </div>
        ) : (
          <div className="text-center">
            
          </div>
        )}
         {verProductoId && (
                  <VerProducto idProducto={verProductoId} onClose={() => setVerProductoId(null)} />
                )}
      </main>
    </div>
  );
};

export default ProductosComponent;