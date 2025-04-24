"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiAlertTriangle, FiPlus } from "react-icons/fi";
import NavegadorAdmin from "@/components/NavegadorAdmin";


export default function GestionStock() {
  const router = useRouter();
  const [productosConStock, setProductosConStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState([]);
  const [nuevoStock, setNuevoStock] = useState({});

  // Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, []);

  useEffect(() => {
    const fetchProductosConStock = async () => {
      try {
        const response = await fetch('/api/stock');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setProductosConStock(data);
          
          // Filtrar productos con stock bajo
          const productosConAlerta = data.filter(item => 
            item.cantidad_disponible <= item.stock_minimo
          );
          setAlertas(productosConAlerta);
        }
      } catch (error) {
        console.error("Error al cargar productos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductosConStock();
  }, []);

  const actualizarStock = async (id_stock, id_productos, nuevaCantidad) => {
    try {
      const response = await fetch('/api/stock', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_stock, cantidad_disponible: nuevaCantidad }),
      });

      if (response.ok) {
        // Actualizar el estado local
        setProductosConStock(prev => 
          prev.map(item => 
            item.id_stock === id_stock 
              ? { ...item, cantidad_disponible: nuevaCantidad } 
              : item
          )
        );
      }
    } catch (error) {
      console.error("Error al actualizar stock:", error);
    }
  };

  const agregarStock = async (id_productos) => {
    try {
      const cantidad = nuevoStock[id_productos] || 0;
      if (cantidad <= 0) return;

      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id_productos, 
          cantidad_disponible: cantidad 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Actualizar el estado local
        setProductosConStock(prev => 
          prev.map(item => 
            item.id_productos === id_productos 
              ? { ...item, id_stock: data.id_stock, cantidad_disponible: cantidad } 
              : item
          )
        );
        // Limpiar el input
        setNuevoStock(prev => ({ ...prev, [id_productos]: '' }));
      }
    } catch (error) {
      console.error("Error al agregar stock:", error);
    }
  };

  const handleNuevoStockChange = (id_productos, value) => {
    setNuevoStock(prev => ({
      ...prev,
      [id_productos]: parseInt(value) || 0
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-6 relative" style={{ backgroundImage: "url('/fondo.png')" }}>
       <NavegadorAdmin />
      <div className="absolute inset-0 bg-black opacity-40"></div>
      
      <div className="relative top-15 z-10 w-full max-w-6xl">
        
        {/* Contenido principal */}
        <div className="bg-[#F5F1F1] p-6 rounded-lg shadow-lg border-4 border-[#762114]">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Stock de Productos</h2>
          
          {/* Alertas de stock bajo */}
          {alertas.length > 0 && (
            <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
              <div className="flex items-center">
                <FiAlertTriangle className="mr-2" />
                <h3 className="font-bold">Productos con stock bajo</h3>
              </div>
              <ul className="mt-2">
                {alertas.map(item => (
                  <li key={item.id_productos}>
                    {item.nombre} (ID: {item.id_productos}) - Solo {item.cantidad_disponible} unidades
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabla de productos con stock */}
          {loading ? (
            <p className="text-center py-8">Cargando productos...</p>
          ) : productosConStock.length === 0 ? (
            <p className="text-center py-8">No se encontraron productos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#8C9560] text-[#F5F1F1]">
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Producto</th>
                    <th className="p-3 text-left">Categoría</th>
                    <th className="p-3 text-left">Stock Disponible</th>
                    <th className="p-3 text-left">Nuevo Stock</th>
                    <th className="p-3 text-left">Stock Mínimo</th>
                    <th className="p-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productosConStock.map(item => (
                    <tr key={item.id_productos} className="border-b border-[#8C9560] hover:bg-[#F5F1F1]/80">
                      <td className="p-3 text-[#7B2710]">{item.id_productos}</td>
                      <td className="p-3 text-[#7B2710] font-medium">{item.nombre}</td>
                      <td className="p-3 text-[#7B2710]">{item.categoria}</td>
                      <td className="p-3 text-[#7B2710]">
                        {item.id_stock ? (
                          <input
                            type="number"
                            value={item.cantidad_disponible || 0}
                            min="0"
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value);
                              if (!isNaN(newValue)) {
                                actualizarStock(item.id_stock, item.id_productos, newValue);
                              }
                            }}
                            className="w-20 p-1 border border-[#8C9560] rounded"
                          />
                        ) : (
                          <span className="text-gray-500">Sin registro</span>
                        )}
                      </td>
                      <td className="p-3 text-[#7B2710]">
                        {!item.id_stock && (
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={nuevoStock[item.id_productos] || ''}
                              min="1"
                              onChange={(e) => handleNuevoStockChange(item.id_productos, e.target.value)}
                              className="w-20 p-1 border border-[#8C9560] rounded mr-2"
                              placeholder="Cantidad"
                            />
                            <button
                              onClick={() => agregarStock(item.id_productos)}
                              className="bg-green-600 text-white p-1 rounded hover:bg-green-700"
                              title="Agregar stock"
                            >
                              <FiPlus />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-[#7B2710]">{item.stock_minimo || '1'}</td>
                      <td className="p-3">
                        {item.id_stock && item.cantidad_disponible <= item.stock_minimo ? (
                          <span className="text-red-600 flex items-center">
                            <FiAlertTriangle className="mr-1" /> Bajo stock
                          </span>
                        ) : item.id_stock ? (
                          <span className="text-green-600">Disponible</span>
                        ) : (
                          <span className="text-yellow-600">Sin stock</span>
                        )}
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
}