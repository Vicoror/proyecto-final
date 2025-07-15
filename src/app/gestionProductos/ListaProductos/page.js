"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiDownload, FiEdit, FiAlertTriangle } from "react-icons/fi";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { toast } from "react-toastify";
import { Popover } from '@headlessui/react';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft } from "lucide-react";

const ProductList = () => {
  const [productos, setProductos] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [newStockValue, setNewStockValue] = useState("");
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
          checkLowStock(dataConStockSeguro);
      } catch (error) {
        console.error("Error al obtener productos:", error);
        setError(error.message);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, [categoriaFiltro]);

  const checkLowStock = (products) => {
    products.forEach(product => {
      if (product.stock === 0) {
        toast.warning(`¡Atención! El producto "${product.nombre}" está agotado.`);
      } else if (product.stock <= 5) {
        toast.warning(`¡Atención! El producto "${product.nombre}" tiene stock bajo (${product.stock}).`);
      }
    });
  };

  const exportToPDF = async () => {
    if (!productos.length) return toast.error("No hay datos para exportar");

    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable').then(mod => mod.default);

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Lista de Productos', 14, 20);
      if (categoriaFiltro) doc.text(`Filtrado por: ${categoriaFiltro}`, 14, 30);

      const headers = [['ID', 'Nombre', 'Precio', 'Stock', 'Categoría', 'Estado']];
      const data = productos.map(p => [
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
        startY: 40,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [118, 33, 20], textColor: [245, 241, 241] }
      });

      doc.save(`productos_${categoriaFiltro || 'todos'}.pdf`);
      toast.success("PDF exportado correctamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al exportar el PDF");
    }
  };

  const handleEditStock = (product) => {
    setEditingStock(product.id_productos || product.id);
    setNewStockValue(product.stock ?? '');
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
        setEditingStock(null);
        toast.success("Stock actualizado correctamente");
        checkLowStock(updatedProductos);
      } catch (error) {
        console.error(error);
        toast.error("Error al actualizar el stock");
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
      toast.success(`Producto ${!product.activo ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar el estado del producto");
    }
  };

  const categorias = ['Anillos', 'Collares', 'Aretes', 'Pulseras', 'Brazaletes', 'Piedras'];

  const getStockClass = (stock) => {
    if (stock === 0) return 'bg-red-200 text-red-800';
    if (stock === 1) return 'bg-yellow-200 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

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

          <div className="mb-6">
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

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">Error: {error}</div>}

          {loading ? (
            <div className="text-center py-8 text-[#7B2710]">Cargando productos...</div>
          ) : !productos.length ? (
            <div className="text-center py-8 text-[#7B2710]">No se encontraron productos</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#8C9560] text-[#F5F1F1]">
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Precio</th>
                    <th className="p-3 text-left">Stock</th>
                    <th className="p-3 text-left">Categoría</th>
                    <th className="p-3 text-left">Estado</th>
                    <th className="p-3 text-left text-[#7B2710]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id_productos || producto.id} className="border-b border-[#8C9560] hover:bg-[#F5F1F1]/80">
                      <td className="p-3 text-[#7B2710]">{producto.id_productos || producto.id}</td>
                      <td className="p-3 text-[#7B2710] font-medium">{producto.nombre}</td>
                      <td className="p-3 text-[#7B2710]">${Number(producto.precio).toFixed(2)}</td>
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
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-[#7B2710]">{producto.categoria}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => handleEditStock(producto)} className="text-[#8C9560] hover:text-[#DC9C5C]" title="Editar stock">
                          <FiEdit />
                        </button>
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