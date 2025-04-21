"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiDownload } from "react-icons/fi";
import NavegadorAdmin from "@/components/NavegadorAdmin";

export default function ListaProductos() {
  const [productos, setProductos] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

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
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        // Asegurarnos que recibimos un array válido
        if (result && Array.isArray(result.data)) {
          setProductos(result.data);
        } else if (Array.isArray(result)) {
          setProductos(result);
        } else {
          throw new Error("Formato de datos inválido");
        }
      } catch (error) {
        console.error("Error al obtener productos:", error);
        setError(error.message);
        setProductos([]); // Asegurar array vacío en caso de error
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, [categoriaFiltro]);

  const exportToPDF = async () => {
    if (!Array.isArray(productos) || productos.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    try {
      // Importación dinámica para evitar problemas con SSR
      const { jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable').then(mod => mod.default);
      
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Lista de Productos', 14, 20);
      
      if (categoriaFiltro) {
        doc.setFontSize(12);
        doc.text(`Filtrado por: ${categoriaFiltro}`, 14, 30);
      }
      
      const headers = [['ID', 'Nombre', 'Precio', 'Categoría', 'Estado']];
      const data = productos.map(p => [
        p.id_productos || p.id || '',
        p.nombre || '',
        `$${Number(p.precio || 0).toFixed(2)}`,
        p.categoria || '',
        p.activo ? 'Activo' : 'Inactivo'
      ]);
      
      // Usar autoTable importado
      autoTable(doc, {
        head: headers,
        body: data,
        startY: 40,
        styles: { fontSize: 10 },
        headStyles: {
          fillColor: [118, 33, 20],
          textColor: [245, 241, 241]
        }
      });
      
      doc.save(`productos_${categoriaFiltro || 'todos'}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al exportar el PDF");
    }
  };

  const categorias = ['Anillos', 'Collares', 'Aretes', 'Pulseras', 'Brazaletes', 'Piedras'];

  return (
    <div className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-6 relative" style={{ backgroundImage: "url('/fondo.png')" }}>
      <NavegadorAdmin />
      <div className="absolute inset-0 bg-black opacity-40"></div>
      
      <div className="relative top-15 z-10 w-full max-w-6xl">

        {/* Contenido principal */}
        <div className="bg-[#F5F1F1] p-6 rounded-lg shadow-lg border-4 border-[#762114]">
          {/* Encabezado */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#7B2710]">Lista de Productos</h2>
            <button onClick={exportToPDF} className="bg-[#8C9560] text-[#F5F1F1] py-2 px-4 rounded-md font-semibold hover:bg-[#DC9C5C] transition-all flex items-center gap-2">
              <FiDownload /> Exportar PDF
            </button>
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <label className="block text-[#7B2710] font-semibold mb-2">Filtrar por categoría</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoriaFiltro("")}
                className={`py-2 px-4 rounded-md ${!categoriaFiltro ? 'bg-[#DC9C5C] text-[#F5F1F1]' : 'bg-[#8C9560] text-[#F5F1F1]'}`}
              >
                Todas
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaFiltro(cat)}
                  className={`py-2 px-4 rounded-md ${categoriaFiltro === cat ? 'bg-[#DC9C5C] text-[#F5F1F1]' : 'bg-[#8C9560] text-[#F5F1F1]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error: {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <p className="text-[#7B2710]">Cargando productos...</p>
            </div>
          ) : !Array.isArray(productos) || productos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#7B2710]">No se encontraron productos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#8C9560] text-[#F5F1F1]">
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Precio</th>
                    <th className="p-3 text-left">Categoría</th>
                    <th className="p-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id_productos || producto.id} className="border-b border-[#8C9560] hover:bg-[#F5F1F1]/80">
                      <td className="p-3 text-[#7B2710]">{producto.id_productos || producto.id}</td>
                      <td className="p-3 text-[#7B2710] font-medium">{producto.nombre}</td>
                      <td className="p-3 text-[#7B2710]">${Number(producto.precio).toFixed(2)}</td>
                      <td className="p-3 text-[#7B2710]">{producto.categoria}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </span>
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