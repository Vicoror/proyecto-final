"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft, Download, Filter, DollarSign, Calendar, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ReportesPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [mostrarTodo, setMostrarTodo] = useState(false);
  const [loading, setLoading] = useState(false);
  const reporteRef = useRef(null);

      // Calcular el total de ventas
    // Calcular el total de ventas
    const calcularTotalVentas = () => {
      if (!data || !data.ganancias) return 0;
      return data.ganancias.reduce((total, producto) => total + Number(producto.total), 0);
    };

    // Formatear moneda
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(amount);
    };

  // Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) router.replace("/login");
  }, [router]);

  // Colores de la paleta
  const COLORS = ["#7B2710", "#DC9C5C", "#8C9560", "#FF7043", "#4A6B8A", "#9C7A97", "#5C8C64", "#D99E63"];

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (!mostrarTodo && fechaInicio && fechaFin) {
        params.append("fechaInicio", fechaInicio);
        params.append("fechaFin", fechaFin);
      }
      const res = await fetch(`/api/reportes?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

const descargarPDF = async () => {
  if (!reporteRef.current) return;
  
  setLoading(true);
  try {
    // Crear un estilo temporal para sobrescribir colores oklch
    const style = document.createElement('style');
    style.textContent = `
      * {
        color: inherit !important;
        background-color: inherit !important;
        border-color: inherit !important;
        fill: inherit !important;
        stroke: inherit !important;
      }
    `;
    document.head.appendChild(style);
    
    const canvas = await html2canvas(reporteRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#F5F1F1"
    });
    
    // Eliminar el estilo temporal
    document.head.removeChild(style);
    
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("reporte.pdf");
  } catch (error) {
    console.error("Error generando PDF:", error);
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      {/* Capa oscura */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      <NavegadorAdmin />

      {/* Contenedor principal */}
      <main className="relative z-10 px-2 sm:px-4 pt-20 pb-8 w-full max-w-[99vw] mx-auto">
        {/* Flecha */}
        <div className="w-full max-w-6xl mx-auto mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-[#F5F1F1] transition-colors"
          >
            <ArrowLeft className="mr-2" size={30} />
            Anterior
          </button>
        </div>

        {/* Sección de reportes */}
        <section className="w-full max-w-6xl mx-auto bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#7B2710] p-4 md:p-6 lg:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#7B2710] mb-6 text-center">Reportes</h2>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6 p-3 bg-white rounded-lg shadow">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 w-full md:w-auto">
              <div className="mb-2 md:mb-0 flex-1">
                <label className="block text-sm text-gray-600 mb-1">Fecha inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  disabled={mostrarTodo}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="mb-2 md:mb-0 flex-1">
                <label className="block text-sm text-gray-600 mb-1">Fecha fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  disabled={mostrarTodo}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2 md:mt-0">
              <label className="flex items-center space-x-2 text-[#7B2710]">
                <input
                  type="checkbox"
                  checked={mostrarTodo}
                  onChange={() => setMostrarTodo(!mostrarTodo)}
                  className="h-4 w-4"
                />
                <span>Mostrar todo</span>
              </label>
              
              <div className="flex space-x-2">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="bg-[#DC9C5C] text-white px-4 py-2 rounded hover:bg-[#7B2710] transition flex items-center"
                >
                  <Filter size={18} className="mr-1" />
                  {loading ? "Cargando..." : "Filtrar"}
                </button>
                <button
                  onClick={descargarPDF}
                  disabled={loading || !data}
                  className="bg-[#8C9560] text-white px-4 py-2 rounded hover:bg-[#7B2710] transition flex items-center"
                >
                  <Download size={18} className="mr-1" />
                  PDF
                </button>
                <button
                  onClick={() => router.push("./Reportes/Ventas")}
                  className="bg-[#4A6B8A] text-white px-4 py-2 rounded hover:bg-[#7B2710] transition flex items-center"
                >
                  <TrendingUp size={18} className="mr-1" />
                  Ventas
                </button>
              </div>
            </div>
          </div>

            {/* AGREGAR AQUÍ EL APARTADO DE TOTAL DE VENTAS */}
            {data && data.ganancias && (
              <div className="mb-8 p-6 bg-gradient-to-r from-[#7B2710] to-[#DC9C5C] rounded-xl shadow-lg text-white text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center mb-2">
                    <DollarSign size={32} className="mr-3" />
                    <h3 className="text-2xl font-bold">Total de Ventas en el Período</h3>
                  </div>
                  <p className="text-4xl font-extrabold mt-2">
                    {formatCurrency(calcularTotalVentas())}
                  </p>
                  <div className="flex items-center mt-3 text-sm">
                    <Calendar size={16} className="mr-1" />
                    <span>
                      {mostrarTodo ? "Todos los tiempos" : `${fechaInicio} a ${fechaFin}`}
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* Gráficas */}
          <div 
            id="reportes-container" 
            ref={reporteRef}
            className="space-y-8 bg-white p-4 rounded-lg shadow"
          >
            {!data ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-center text-[#7B2710] text-lg">
                  {loading ? "Cargando datos..." : "Seleccione fechas o active 'Mostrar todo' y haga clic en Filtrar"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Top productos */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-bold text-[#7B2710] mb-4 text-center">Top Productos Vendidos</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.topProductos} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                        <XAxis dataKey="nombre_producto" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#7B2710" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Tipo de producto */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-bold text-[#7B2710] mb-4 text-center">Tipo de Producto</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={data.tipoProducto} 
                          dataKey="cantidad" 
                          nameKey="tipo_producto" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={80} 
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {data.tipoProducto.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value}`, props.payload.tipo_producto]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Categorías más vendidas */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-bold text-[#7B2710] mb-4 text-center">Categorías Más Vendidas</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.categorias} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#8C9560" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Ganancias por producto */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-bold text-[#7B2710] mb-4 text-center">Ganancias por Producto</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.ganancias} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre_producto" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, 'Ganancia']} />
                        <Line type="monotone" dataKey="total" stroke="#66BB6A" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 5. Tipo de envío */}
               <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
  <h3 className="text-lg font-bold text-[#7B2710] mb-4 text-center">Tipo de Envío</h3>
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie 
          data={data.tipoEnvio} 
          dataKey="cantidad" 
          nameKey="tipo_envio" 
          cx="50%" 
          cy="50%" 
          outerRadius={80} 
          // Eliminar etiquetas del gráfico y mostrarlas solo en la leyenda
          label={false}
        >
          {data.tipoEnvio.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
       <Tooltip 
          formatter={(value, name, props) => {
            // Calcular el total para obtener el porcentaje
            const total = data.tipoEnvio.reduce((sum, item) => sum + item.cantidad, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return [`${value} (${percentage}%)`, props.payload.tipo_envio];
          }} 
        />
        <Legend 
          formatter={(value, entry, index) => {
            const total = data.tipoEnvio.reduce((sum, item) => sum + item.cantidad, 0);
            const percentage = ((data.tipoEnvio[index].cantidad / total) * 100).toFixed(1);
            return `${value}: ${percentage}%`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
</div>

                {/* 6. Empresas de envío */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-bold text-[#7B2710] mb-4 text-center">Empresas de Envío</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.empresaEnvio} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="empresa_envio" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#FF7043" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 7. Estado de pedidos */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-bold text-[#7B2710] mb-4 text-center">Estado de Pedidos</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={data.estados} 
                          dataKey="cantidad" 
                          nameKey="estado" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={80} 
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {data.estados.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value}`, props.payload.estado]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 8. Métodos de pago */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-bold text-[#7B2710] mb-4 text-center">Métodos de Pago</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={data.metodosPago} 
                          dataKey="cantidad" 
                          nameKey="metodo_pago" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={80} 
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {data.metodosPago.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value}`, props.payload.metodo_pago]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}