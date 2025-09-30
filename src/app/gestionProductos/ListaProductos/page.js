"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiDownload, FiEdit, FiAlertTriangle, FiSearch, FiX, FiSettings } from "react-icons/fi";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { toast } from "react-toastify";
import { Popover } from '@headlessui/react';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft } from "lucide-react";

const ProductList = () => {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [newStockValue, setNewStockValue] = useState("");
  const [newPriceValue, setNewPriceValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, []);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = '/api/ListaProductos';
        if (categoriaFiltro) {
          url += `?categoria=${encodeURIComponent(categoriaFiltro)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const result = await response.json();
        const data = result?.data || result;

          if (!Array.isArray(data)) throw new Error("Formato de datos inválido");

          // Normalizar stock: si es null o inválido, poner 0; si es >50 poner 50
          const dataConStockSeguro = data.map(p => ({
            ...p,
            stock: (p.stock === null || p.stock === undefined || isNaN(p.stock))
              ? 0
              : Math.min(Math.max(Number(p.stock), 0), 50), // mantener stock real, con límites 0-50
          }));
          setProductos(dataConStockSeguro);
          setProductosFiltrados(dataConStockSeguro);
          checkLowStock(dataConStockSeguro);
      } catch (error) {
        console.error("Error al obtener productos:", error);
        setError(error.message);
        setProductos([]);
        setProductosFiltrados([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, [categoriaFiltro]);

  // Filtrar productos según término de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setProductosFiltrados(productos);
      setShowSuggestions(false);
      return;
    }

    const filtered = productos.filter(producto => {
      const idMatch = producto.id_productos?.toString().includes(searchTerm) || 
                      producto.id?.toString().includes(searchTerm);
      const nameMatch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      return idMatch || nameMatch;
    });
    
    setProductosFiltrados(filtered);
    
    // Mostrar sugerencias si hay al menos 3 caracteres
    if (searchTerm.length >= 3) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm, productos]);

  const checkLowStock = (products) => {
    products.forEach(product => {
      if (product.stock === 0) {
        toast.warning(`¡Atención! El producto "${product.nombre}" está agotado.`);
      } else if (product.stock <= 5) {
        toast.warning(`¡Atención! El producto "${product.nombre}" tiene stock bajo (${product.stock}).`);
      }
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    
    // Validar: solo números, letras y espacios, máximo 25 caracteres
    if (value === '' || /^[a-zA-Z0-9\s]{0,25}$/.test(value)) {
      // Eliminar caracteres peligrosos como <, >, etc.
      const safeValue = value.replace(/[<>{}[\]\\]/g, '');
      setSearchTerm(safeValue);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setShowSuggestions(false);
  };

  const selectSuggestion = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const exportToPDF = async () => {
    if (!productosFiltrados.length) return toast.error("No hay datos para exportar");

    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable').then(mod => mod.default);

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Lista de Productos', 14, 20);
      if (categoriaFiltro) doc.text(`Filtrado por: ${categoriaFiltro}`, 14, 30);
      if (searchTerm) doc.text(`Búsqueda: ${searchTerm}`, 14, 40);

      const headers = [['ID', 'Nombre', 'Precio', 'Stock', 'Categoría', 'Estado']];
      const data = productosFiltrados.map(p => [
        p.id_productos || p.id,
        p.nombre,
        `$${Number(p.precio).toFixed(2)}`,
        p.stock,
        p.categoria,
        p.activo ? 'Activo' : 'Inactivo'
      ]);

      autoTable(doc, {
        head: headers,
        body: data,
        startY: searchTerm ? 50 : 40,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [118, 33, 20], textColor: [245, 241, 241] }
      });

      doc.save(`productos_${categoriaFiltro || 'todos'}_${searchTerm || ''}.pdf`);
      toast.success("PDF exportado correctamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al exportar el PDF");
    }
  };

  const handleEditStock = (product) => {
    setEditingStock(product.id_productos || product.id);
    setNewStockValue(product.stock ?? '');
    setEditingPrice(null); // Asegurarse de que solo se edite un campo a la vez
  };

  const handleEditPrice = (product) => {
    setEditingPrice(product.id_productos || product.id);
    setNewPriceValue(product.precio ?? '');
    setEditingStock(null); // Asegurarse de que solo se edite un campo a la vez
  };

  const handleSaveStock = async (productId) => {
      const parsedStock = parseInt(newStockValue, 10);
      if (isNaN(parsedStock) || parsedStock < 0 || parsedStock > 50) {
        toast.error("El stock debe estar entre 0 y 50");
        return;
      }

      try {
        const response = await fetch('/api/ListaProductos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: productId, stock: parsedStock })
        });

        if (!response.ok) throw new Error('Error al actualizar el stock');

        const updatedProductos = productos.map(p =>
          (p.id_productos === productId || p.id === productId)
            ? { ...p, stock: parsedStock }
            : p
        );
        setProductos(updatedProductos);
        setProductosFiltrados(updatedProductos);
        setEditingStock(null);
        toast.success("Stock actualizado correctamente");
        checkLowStock(updatedProductos);
      } catch (error) {
        console.error(error);
        toast.error("Error al actualizar el stock");
      }
    };

  const handleSavePrice = async (productId) => {
    const parsedPrice = parseFloat(newPriceValue);
    if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 5000) {
      toast.error("El precio debe ser un número entre 0 y 5000");
      return;
    }

    try {
      const response = await fetch('/api/ListaProductos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, precio: parsedPrice })
      });

      if (!response.ok) throw new Error('Error al actualizar el precio');

      const updatedProductos = productos.map(p =>
        (p.id_productos === productId || p.id === productId)
          ? { ...p, precio: parsedPrice }
          : p
      );
      setProductos(updatedProductos);
      setProductosFiltrados(updatedProductos);
      setEditingPrice(null);
      toast.success("Precio actualizado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el precio");
    }
  };

  const toggleProductStatus = async (productId) => {
    try {
      const product = productos.find(p => p.id_productos === productId || p.id === productId);
      if (!product) return;

      const response = await fetch('/api/ListaProductos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, activo: !product.activo })
      });

      if (!response.ok) throw new Error('Error al actualizar el estado');

      const updatedProductos = productos.map(p =>
        (p.id_productos === productId || p.id === productId)
          ? { ...p, activo: !p.activo }
          : p
      );
      setProductos(updatedProductos);
      setProductosFiltrados(updatedProductos);
      toast.success(`Producto ${!product.activo ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar el estado del producto");
    }
  };

  // Nueva función para activar/desactivar la personalización
  const togglePersonalizacion = async (productId) => {
    try {
      const product = productos.find(p => p.id_productos === productId || p.id === productId);
      if (!product) return;

      const response = await fetch('/api/ListaProductos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: productId, 
          activar_botn: product.activar_botn ? 0 : 1 
        })
      });

      if (!response.ok) throw new Error('Error al actualizar la personalización');

      const updatedProductos = productos.map(p =>
        (p.id_productos === productId || p.id === productId)
          ? { ...p, activar_botn: p.activar_botn ? 0 : 1 }
          : p
      );
      setProductos(updatedProductos);
      setProductosFiltrados(updatedProductos);
      toast.success(`Personalización ${product.activar_botn ? 'desactivada' : 'activada'} correctamente`);
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar el estado de personalización");
    }
  };

  const categorias = ['Anillos', 'Collares', 'Aretes', 'Pulseras', 'Brazaletes', 'Piedras'];

  const getStockClass = (stock) => {
    if (stock === 0) return 'bg-red-200 text-red-800';
    if (stock === 1) return 'bg-yellow-200 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Obtener sugerencias para el buscador
  const getSuggestions = () => {
    if (searchTerm.length < 3) return [];
    
    const suggestions = new Set();
    
    productos.forEach(producto => {
      // Sugerir IDs
      const id = producto.id_productos || producto.id;
      if (id.toString().includes(searchTerm)) {
        suggestions.add(id.toString());
      }
      
      // Sugerir nombres
      if (producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.add(producto.nombre);
      }
    });
    
    return Array.from(suggestions).slice(0, 5); // Máximo 5 sugerencias
  };

  const suggestions = getSuggestions();

  return (
    <div className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-0 relative" style={{ backgroundImage: "url('/fondo.png')" }}>
      <NavegadorAdmin />
      <div className="absolute inset-0 bg-black opacity-40"></div>

      <div className="relative top-20 z-10 w-full max-w-6xl max-w-[98vw]">
         <div className="w-full max-w-5xl mx-auto mb-4 max-w-[98vw]">
          <button onClick={() => router.back()} className="flex items-center text-white hover:text-[#F5F1F1] transition-colors">
            <ArrowLeft className="mr-2" size={30} />
            Anterior
          </button>
        </div>
        <div className="bg-[#F5F1F1] p-6 rounded-lg shadow-lg border-4 border-[#762114] ">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#7B2710]">Stock (editar stock o estado en "Acciones")</h2>
            <button onClick={exportToPDF} className="bg-[#8C9560] text-[#F5F1F1] py-2 px-4 rounded-md font-semibold hover:bg-[#DC9C5C] flex items-center gap-2">
              <FiDownload /> Exportar PDF
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#7B2710] font-semibold mb-2">Filtrar por categoría</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCategoriaFiltro("")} className={`py-2 px-4 rounded-md ${!categoriaFiltro ? 'bg-[#DC9C5C]' : 'bg-[#8C9560]'} text-[#F5F1F1]`}>Todas</button>
                {categorias.map(cat => (
                  <button key={cat} onClick={() => setCategoriaFiltro(cat)} className={`py-2 px-4 rounded-md ${categoriaFiltro === cat ? 'bg-[#DC9C5C]' : 'bg-[#8C9560]'} text-[#F5F1F1]`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <label className="block text-[#7B2710] font-semibold mb-2">Buscar por ID o nombre</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Escribe al menos 3 caracteres..."
                  className="w-full p-2 border border-[#8C9560] rounded-md pr-10"
                  maxLength={25}
                />
                {searchTerm && (
                  <button 
                    onClick={clearSearch}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={18} />
                  </button>
                )}
                <FiSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">Error: {error}</div>}

          {loading ? (
            <div className="text-center py-8 text-[#7B2710]">Cargando productos...</div>
          ) : !productosFiltrados.length ? (
            <div className="text-center py-8 text-[#7B2710]">
              {searchTerm ? `No se encontraron productos para "${searchTerm}"` : "No se encontraron productos"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#8C9560] text-[#F5F1F1]">
                    <th className="p-3 text-left">Identificador de Producto</th>
                    <th className="p-3 text-left">Nombre de Producto</th>
                    <th className="p-3 text-left">Precio</th>
                    <th className="p-3 text-left">Stock</th>
                    <th className="p-3 text-left">Categoría</th>
                    <th className="p-3 text-left">Estado</th>
                    <th className="p-3 text-left">Personalizar Producto</th>
                    <th className="p-3 text-left text-[#7B2710]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((producto) => (
                    <tr key={producto.id_productos || producto.id} className="border-b border-[#8C9560] hover:bg-[#F5F1F1]/80">
                      <td className="p-3 text-[#7B2710]">{producto.id_productos || producto.id}</td>
                      <td className="p-3 text-[#7B2710] font-medium">{producto.nombre}</td>
                      <td className="p-3 relative">
                        {editingPrice === (producto.id_productos || producto.id) ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={5000}
                              step="0.01"
                              value={newPriceValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || (/^\d*\.?\d*$/.test(val) && (val === '' || (Number(val) >= 0 && Number(val) <= 5000)))) {
                                  setNewPriceValue(val);
                                }
                              }}
                              className="w-24 p-1 border rounded"
                            />
                            <button 
                              onClick={() => handleSavePrice(producto.id_productos || producto.id)} 
                              className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span>${Number(producto.precio).toFixed(2)}</span>
                            <button 
                              onClick={() => handleEditPrice(producto)} 
                              className="text-[#8C9560] hover:text-[#DC9C5C] ml-2"
                              title="Editar precio"
                            >
                              <FiEdit size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 relative">
                      {editingStock === (producto.id_productos || producto.id) ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={newStockValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || (/^\d+$/.test(val) && Number(val) >= 0 && Number(val) <= 50)) {
                                setNewStockValue(val);
                              }
                            }}
                            className="w-20 p-1 border rounded"
                          />
                          <button onClick={() => handleSaveStock(producto.id_productos || producto.id)} className="bg-green-500 text-white px-2 py-1 rounded text-sm">Guardar</button>
                        </div>
                      ) : (
                        <div className="relative inline-flex items-center">
                          {/* 🔹 CAMBIO: Mostrar "Variable" para anillos, stock normal para otros */}
                          {producto.categoria === "Anillos" ? (
                            <div 
                              className="group relative cursor-pointer"
                              onClick={() => router.push('/gestionProductos/EditarProductos')}
                            >
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 min-w-[2.5rem] text-center">
                                Variable
                              </span>
                              {/* Tooltip al hacer hover */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-[#7B2710] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                                Clic para editar tallas
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStockClass(producto.stock)} min-w-[2.5rem] text-center`}>
                                {producto.stock}
                              </span>
                              {(producto.stock === 0 || producto.stock === 1) && (
                                <Popover className="relative">
                                  <Popover.Button className="absolute -top-1 -right-5 sm:-right-4">
                                    <FiAlertTriangle className={`text-xl animate-pulse cursor-pointer ${producto.stock === 0 ? "text-red-600" : "text-yellow-500"}`} />
                                  </Popover.Button>
                                  <Popover.Panel className="absolute z-20 mt-2 w-40 px-3 py-2 bg-white border border-gray-300 rounded shadow-lg text-sm text-gray-800 -right-10 sm:-right-8">
                                    {producto.stock === 0 ? "Sin stock disponible" : "Stock muy bajo"}
                                  </Popover.Panel>
                                </Popover>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                      <td className="p-3 text-[#7B2710]">{producto.categoria}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => togglePersonalizacion(producto.id_productos || producto.id)}
                          className={`px-2 py-1 rounded text-xs cursor-pointer transition hover:scale-105 flex items-center gap-1 ${
                            producto.activar_botn 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                          title={producto.activar_botn ? 'Desactivar personalización' : 'Activar personalización'}
                        >
                          <FiSettings size={12} />
                          {producto.activar_botn ? 'Activado' : 'Desactivado'}
                        </button>
                      </td>
                      <td className="p-3 flex gap-2">
                          {/* 🔹 OCULTAR BOTÓN EDITAR STOCK PARA ANILLOS */}
                          {producto.categoria !== "Anillos" && (
                            <button onClick={() => handleEditStock(producto)} className="text-[#8C9560] hover:text-[#DC9C5C]" title="Editar stock">
                              <FiEdit />
                            </button>
                          )}
                          <button
                            onClick={() => toggleProductStatus(producto.id_productos || producto.id)}
                            className={`px-2 py-1 rounded text-xs cursor-pointer transition hover:scale-105 ${producto.activo ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                          >
                            {producto.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;