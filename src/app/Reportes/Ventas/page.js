"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft, Download, Filter, Calendar, BarChart3, List } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function VentasPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [filtro, setFiltro] = useState("año");
  const [anio, setAnio] = useState("2025");
  const [mes, setMes] = useState("01");
  const [loading, setLoading] = useState(false);
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const reporteRef = useRef(null);

  // Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, []);

  // Generar años desde 2025 hasta el actual
  const generarAnios = () => {
    const anios = [];
    const anioActual = new Date().getFullYear();
    for (let i = 2025; i <= anioActual; i++) {
      anios.push(i.toString());
    }
    return anios;
  };

  // Meses para el selector
  const meses = [
    { valor: "01", nombre: "Enero" },
    { valor: "02", nombre: "Febrero" },
    { valor: "03", nombre: "Marzo" },
    { valor: "04", nombre: "Abril" },
    { valor: "05", nombre: "Mayo" },
    { valor: "06", nombre: "Junio" },
    { valor: "07", nombre: "Julio" },
    { valor: "08", nombre: "Agosto" },
    { valor: "09", nombre: "Septiembre" },
    { valor: "10", nombre: "Octubre" },
    { valor: "11", nombre: "Noviembre" },
    { valor: "12", nombre: "Diciembre" }
  ];

 const fetchData = async () => {
  setLoading(true);
  try {
    let fechaInicio, fechaFin;
    
    if (filtro === "año") {
      fechaInicio = `${anio}-01-01`;
      fechaFin = `${anio}-12-31`;
    } else {
      const ultimoDia = new Date(parseInt(anio), parseInt(mes), 0).getDate();
      fechaInicio = `${anio}-${mes}-01`;
      fechaFin = `${anio}-${mes}-${ultimoDia}`;
    }
    
    const res = await fetch(`/api/reportes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    const json = await res.json();
    
    console.log('Datos de ventas mensuales de la API:', json.ventasMensuales);
    
    // Procesar ventas mensuales para el año seleccionado
    let ventasMensualesProcesadas = [];
    if (filtro === "año" && json.ventasMensuales) {
      // Crear array con todos los meses (inicializados en 0)
      ventasMensualesProcesadas = meses.map((mesObj, index) => {
        const mesNum = index + 1;
        
        // Buscar si hay datos para este mes en la respuesta de la API
        const ventaMes = json.ventasMensuales.find(
          venta => venta.mes === mesNum && venta.anio === parseInt(anio)
        );
        
        return {
          mes: mesObj.nombre,
          total: ventaMes ? Number(ventaMes.total) : 0
        };
      });
    }
    
    setData({
      ...json,
      ventasMensuales: ventasMensualesProcesadas,
      filtro,
      anio,
      mes
    });
  } catch (error) {
    console.error("Error cargando datos:", error);
  } finally {
    setLoading(false);
  }
};

  const descargarPDF = async () => {
  if (!data || !data.ganancias) return;
  
  setLoading(true);
  try {
    const { jsPDF } = await import('jspdf');
    const autoTable = await import('jspdf-autotable').then(mod => mod.default);

    const doc = new jsPDF();
    
    // Título principal
    doc.setFontSize(18);
    doc.setTextColor(123, 39, 16);
    doc.text(
      filtro === "año" 
        ? `Reporte de Ventas - Año ${anio}`
        : `Reporte de Ventas - ${meses.find(m => m.valor === mes)?.nombre} ${anio}`, 
      14, 
      20
    );

    // Subtítulo con período
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Período: ${filtro === "año" 
        ? `Enero - Diciembre ${anio}`
        : `${meses.find(m => m.valor === mes)?.nombre} ${anio}`
      }`, 
      14, 
      30
    );

    // Total de ventas
    doc.text(`Total de Ventas: ${formatCurrency(calcularTotalVentas())}`, 14, 40);

    // Configurar datos de la tabla
    const headers = [['Producto', 'Cantidad Vendida', 'Total Ventas']];
    
    const dataRows = data.ganancias.map(producto => [
      producto.nombre_producto,
      producto.cantidad_total?.toString() || '0',
      formatCurrency(producto.total)
    ]);

    // Generar tabla
    autoTable(doc, {
      head: headers,
      body: dataRows,
      startY: 50,
      styles: { 
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: { 
        fillColor: [123, 39, 16],
        textColor: [245, 241, 241],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 241, 241]
      },
      margin: { top: 50 }
    });
    // Agregar esto después de la tabla si quieres incluir la gráfica
if (filtro === "año" && !mostrarTabla) {
  try {
    const graficaElement = document.querySelector('.recharts-wrapper');
    if (graficaElement) {
      const canvas = await html2canvas(graficaElement);
      const imgData = canvas.toDataURL('image/png');
      
      // Agregar nueva página para la gráfica
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Gráfica de Ventas Mensuales', 14, 20);
      
      // Ajustar tamaño de la imagen
      const imgWidth = 180;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      doc.addImage(imgData, 'PNG', 14, 30, imgWidth, imgHeight);
    }
  } catch (error) {
    console.log('No se pudo incluir la gráfica:', error);
  }
}
    // Guardar PDF
    doc.save(`reporte-ventas-${filtro}-${anio}${filtro === "mes" ? `-${mes}` : ''}.pdf`);
    
  } catch (error) {
    console.error("Error generando PDF:", error);
  } finally {
    setLoading(false);
  }
};


  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Calcular total de ventas
  const calcularTotalVentas = () => {
  if (!data || !data.ganancias) return 0;
  
  return data.ganancias.reduce((total, producto) => {
    const valor = Number(producto.total) || 0;
    return total + valor;
  }, 0);
};

  useEffect(() => {
    if (anio) {
      fetchData();
    }
  }, [filtro, anio, mes]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      {/* Capa oscura para mejorar contraste */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      <NavegadorAdmin />

      {/* Contenedor principal con márgenes y padding ajustados */}
      <main className="relative z-10 px-2 sm:px-0 pt-20 pb-8 w-full max-w-[99.5vw] mx-auto">
        {/* Flecha de retroceso posicionada debajo del navegador */}
        <div className="w-full max-w-[99.5vw] max-w-5xl mx-auto mb-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-[#F5F1F1] transition-colors"
          >
            <ArrowLeft className="mr-2" size={30} />
            Anterior
          </button>
        </div>
        
        {/* Sección de ventas */}
        <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Ventas</h2>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6 p-4 bg-white rounded-lg shadow">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 w-full md:w-auto">
              <div className="mb-2 md:mb-0">
                <label className="block text-sm text-gray-600 mb-1">Filtrar por</label>
                <select
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="border p-2 rounded w-full md:w-auto"
                >
                  <option value="año">Año</option>
                  <option value="mes">Mes</option>
                </select>
              </div>
              
              <div className="mb-2 md:mb-0">
                <label className="block text-sm text-gray-600 mb-1">Año</label>
                <select
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  className="border p-2 rounded w-full md:w-auto"
                >
                  {generarAnios().map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              
              {filtro === "mes" && (
                <div className="mb-2 md:mb-0">
                  <label className="block text-sm text-gray-600 mb-1">Mes</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    className="border p-2 rounded w-full md:w-auto"
                  >
                    {meses.map(m => (
                      <option key={m.valor} value={m.valor}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 mt-4 md:mt-0">
              <button
                onClick={fetchData}
                disabled={loading}
                className="bg-[#DC9C5C] text-white px-4 py-2 rounded hover:bg-[#7B2710] transition flex items-center"
              >
                <Filter size={18} className="mr-1" />
                {loading ? "Cargando..." : "Actualizar"}
              </button>
              <button
                onClick={descargarPDF}
                disabled={loading || !data}
                className="bg-[#8C9560] text-white px-4 py-2 rounded hover:bg-[#7B2710] transition flex items-center"
              >
                <Download size={18} className="mr-1" />
                PDF
              </button>
              {filtro === "año" && (
                <button
                  onClick={() => setMostrarTabla(!mostrarTabla)}
                  className="bg-[#4A6B8A] text-white px-4 py-2 rounded hover:bg-[#7B2710] transition flex items-center"
                >
                  {mostrarTabla ? <BarChart3 size={18} className="mr-1" /> : <List size={18} className="mr-1" />}
                  {mostrarTabla ? "Ver Gráfica" : "Ver Productos"}
                </button>
              )}
            </div>
          </div>

          {/* Resumen de ventas */}
          {data && (
            <div className="mb-6 p-4 bg-gradient-to-r from-[#7B2710] to-[#DC9C5C] rounded-lg shadow text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    {filtro === "año" ? `Ventas del Año ${anio}` : `Ventas de ${meses.find(m => m.valor === mes)?.nombre} ${anio}`}
                  </h3>
                  <p className="flex items-center mt-1">
                    <Calendar size={16} className="mr-1" />
                    <span>
                      {filtro === "año" 
                        ? `Período: Enero - Diciembre ${anio}`
                        : `Período: ${meses.find(m => m.valor === mes)?.nombre} ${anio}`
                      }
                    </span>
                  </p>
                </div>
                <div className="mt-2 md:mt-0">
                  <p className="text-2xl font-bold">{formatCurrency(calcularTotalVentas())}</p>
                </div>
              </div>
            </div>
          )}

          {/* Gráficas y Tablas */}
          <div ref={reporteRef} className="bg-white p-4 rounded-lg shadow">
            {!data ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-center text-[#7B2710] text-lg">
                  {loading ? "Cargando datos..." : "Seleccione un año para ver las ventas"}
                </p>
              </div>
            ) : filtro === "año" ? (
              mostrarTabla ? (
                // Tabla de productos por año
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-bold text-[#7B2710] mb-4">Productos Vendidos en {anio}</h3>
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-[#7B2710] text-white">
                        <th className="py-2 px-4 border">Producto</th>
                        <th className="py-2 px-4 border">Cantidad Vendida</th>
                        <th className="py-2 px-4 border">Total Ventas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ganancias && data.ganancias.map((producto, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="py-2 px-4 border">{producto.nombre_producto}</td>
                          <td className="py-2 px-4 border text-center">
                            {/* Necesitarías agregar cantidad a la consulta de ganancias */}
                            {producto.cantidad_total || "0"}
                          </td>
                          <td className="py-2 px-4 border text-right">{formatCurrency(producto.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Gráfica de ventas mensuales por año
                <div>
                  <h3 className="text-lg font-bold text-[#7B2710] mb-4">Ventas Mensuales - {anio}</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.ventasMensuales}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), 'Ventas']}
                        />
                        <Legend />
                        <Bar dataKey="total" fill="#7B2710" name="Ventas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )
            ) : (
              // Vista por mes - Mostrar ganancias
              <div className="overflow-x-auto">
                <h3 className="text-lg font-bold text-[#7B2710] mb-4">Productos Vendidos en {meses.find(m => m.valor === mes)?.nombre} {anio}</h3>
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-[#7B2710] text-white">
                      <th className="py-2 px-4 border">Producto</th>
                      <th className="py-2 px-4 border">Total Ventas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ganancias && data.ganancias.map((producto, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="py-2 px-4 border">{producto.nombre_producto}</td>
                        <td className="py-2 px-4 border text-right">{formatCurrency(producto.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}