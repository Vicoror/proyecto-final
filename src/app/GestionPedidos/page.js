"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft, Search, Eye, Edit, ChevronDown, ChevronUp, X } from "lucide-react";

export default function GestionPedidos() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [empresaEnvio, setEmpresaEnvio] = useState("");
  const [numGuia, setNumGuia] = useState("");
  const [mensajeCorreo, setMensajeCorreo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorEmpresa, setErrorEmpresa] = useState("");
  const [errorNumGuia, setErrorNumGuia] = useState(""); 
  const [errorMensajeCorreo, setErrorMensajeCorreo] = useState(""); 


  // Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    } else {
      cargarPedidos();
    }
  }, []);

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      const response = await fetch('/api/gestionPedidos');
      const data = await response.json();
      if (response.ok) {
        setPedidos(data.pedidos);
      } else {
        console.error("Error al cargar pedidos:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };

  const pedidosFiltrados = pedidos.filter(pedido => 
    pedido.codigo_pedido.toLowerCase().includes(terminoBusqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(pedidosFiltrados.length / 30);
  const inicio = (paginaActual - 1) * 30;
  const fin = inicio + 30;
  const pedidosPaginados = pedidosFiltrados.slice(inicio, fin);

  const verPedido = async (id) => {
    try {
      const response = await fetch(`/api/gestionPedidos?id=${id}`);
      const data = await response.json();
      if (response.ok) {
        setPedidoSeleccionado(data.pedido);
      } else {
        console.error("Error al cargar detalles del pedido:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const cambiarEstado = async () => {
    try {
      const response = await fetch('/api/gestionPedidos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: cambiandoEstado.id,
          estado: nuevoEstado,
          empresa_envio: empresaEnvio,
          num_guia: numGuia,
          mensaje: mensajeCorreo
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Actualizar estado local
        const pedidosActualizados = pedidos.map(pedido => 
          pedido.id === cambiandoEstado.id ? {...pedido, estado: nuevoEstado, empresa_envio: empresaEnvio, num_guia: numGuia} : pedido
        );
        setPedidos(pedidosActualizados);
        setCambiandoEstado(null);
        setNuevoEstado("");
        setEmpresaEnvio("");
        setNumGuia("");
        setMensajeCorreo("");
        alert('Estado actualizado correctamente');
      } else {
        console.error("Error al cambiar estado:", data.error);
        alert('Error al actualizar el estado: ' + data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert('Error al conectar con el servidor');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerColorEstado = (estado) => {
    switch(estado) {
      case 'pendiente': return 'bg-yellow-200 text-yellow-800';
      case 'confirmado': return 'bg-blue-200 text-blue-800';
      case 'en_proceso': return 'bg-purple-200 text-purple-800';
      case 'enviado': return 'bg-yellow-200 text-yellow-800';
      case 'entregado': return 'bg-green-200 text-green-800';
      case 'cancelado': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

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
        
        {/* Sección de gestión de pedidos */}
        <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] p-4 md:p-6">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Gestión de Pedidos</h2>
          
          {/* Buscador */}
          <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por número de pedido..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C9560] focus:border-[#8C9560]"
                value={terminoBusqueda}
                onChange={(e) => {
                  const valor = e.target.value;
                  if (
                    valor.length <= 20 &&
                    /^[a-zA-Z0-9\s-]*$/.test(valor)
                  ) {
                    setTerminoBusqueda(valor);
                  }
                }}
              />
            </div>

          
          {/* Tabla de pedidos */}
          {cargando ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7B2710]"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-[#8C9560] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Número de Pedido</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Correo</th>
                      <th className="px-4 py-3 text-left">Dirección</th>
                      <th className="px-4 py-3 text-left">Teléfonos</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pedidosPaginados.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{pedido.codigo_pedido}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorEstado(pedido.estado)}`}>
                            {pedido.estado.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">{pedido.nombre_cliente}</td>
                        <td className="px-4 py-3">{pedido.correo_cliente}</td>
                        <td className="px-4 py-3">
                          {pedido.direccion_completa || 'No disponible'}
                        </td>
                        <td className="px-4 py-3">
                          <div>Principal: {pedido.telefono_principal || 'N/A'}</div>
                          <div>Secundario: {pedido.telefono_secundario || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 flex space-x-2">
                          <button 
                            onClick={() => verPedido(pedido.id)}
                            title="Detalles del pedido"
                            className="p-2 bg-[#8C9560] text-white rounded-lg hover:bg-[#7B2710] transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              setCambiandoEstado(pedido);
                              setNuevoEstado(pedido.estado);
                            }}
                            title="Cambiar estado de pedido"
                            className="p-2 bg-[#DC9C5C] text-white rounded-lg hover:bg-[#7B2710] transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className={`px-4 py-2 rounded-lg ${paginaActual === 1 ? 'bg-gray-300' : 'bg-[#8C9560] text-white hover:bg-[#7B2710]'}`}
                  >
                    Anterior
                  </button>
                  
                  <span className="text-[#7B2710]">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  
                  <button
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className={`px-4 py-2 rounded-lg ${paginaActual === totalPaginas ? 'bg-gray-300' : 'bg-[#8C9560] text-white hover:bg-[#7B2710]'}`}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Modal para ver detalles del pedido */}
          {pedidoSeleccionado && (
  <div className="fixed inset-0 bg-[#7B2710] bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b">
        <h3 className="text-xl font-bold text-[#7B2710]">Detalles del Pedido</h3>
        <button onClick={() => setPedidoSeleccionado(null)}>
          <X size={24} />
        </button>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-semibold text-[#8C9560]">Información del Pedido</h4>
            <p><span className="font-medium">Fecha:</span> {formatearFecha(pedidoSeleccionado.fecha_creacion)}</p>
            <p><span className="font-medium">Método de pago:</span> {pedidoSeleccionado.metodo_pago}</p>
            <p><span className="font-medium">Tipo de envío:</span> {pedidoSeleccionado.tipo_envio}</p>
            <p><span className="font-medium">Precio envío:</span> ${pedidoSeleccionado.precio_envio}</p>
            <p><span className="font-medium">Subtotal:</span> ${pedidoSeleccionado.subtotal}</p>
            <p><span className="font-medium">Total:</span> ${pedidoSeleccionado.total}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-[#8C9560]">Información de Envío</h4>
            {pedidoSeleccionado.empresa_envio && (
              <>
                <p><span className="font-medium">Empresa:</span> {pedidoSeleccionado.empresa_envio}</p>
                <p><span className="font-medium">N° de guía:</span> {pedidoSeleccionado.num_guia}</p>
              </>
            )}
            <p><span className="font-medium">Dirección:</span> {pedidoSeleccionado.direccion_completa || 'No disponible'}</p>
          </div>
        </div>
        
        <h4 className="font-semibold text-[#8C9560] mb-4">Productos</h4>
        <div className="space-y-4">
  {pedidoSeleccionado.items && pedidoSeleccionado.items.map((item, index) => {
    const materiales = item.materiales || {};
    
    const tieneMateriales = 
      (materiales.hilo !== null && materiales.hilo !== undefined) ||
      (materiales.metale !== null && materiales.metale !== undefined) ||
      (materiales.piedra !== null && materiales.piedra !== undefined);
    
    return (
      <div key={index} className="flex items-start gap-4 border border-gray-200 rounded-lg p-4">
        {/* Imagen del producto */}
        <img
          src={item.imagen_principal || "/placeholder.jpg"}
          alt={item.nombre_producto}
          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          onError={(e) => {
            e.target.src = "/placeholder.jpg";
          }}
        />
        
        <div className="flex-1">
          <h5 className="font-medium text-[#7B2710]">{item.nombre_producto}</h5>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Cantidad:</span> {item.cantidad}
            </div>
            <div>
              <span className="font-medium">Precio unitario:</span> ${item.precio_unitario}
            </div>
            <div>
              <span className="font-medium">Tipo:</span> {item.tipo_producto}
            </div>
            
            {/* 🔹 MOSTRAR TALLA SI ES ANILLO */}
            {item.categoria === 'Anillos' && item.talla && (
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full border border-blue-200">
                  💍 Anillo Talla: {item.talla}
                </span>
              </div>
            )}
          </div>

          {/* Materiales - SOLO para productos personalizados */}
          {item.tipo_producto === 'personalizado' && (
            <div className="mt-4 p-4 bg-[#F5F1F1] rounded-lg">
              <h6 className="font-semibold text-[#7B2710] mb-3">Materiales utilizados:</h6>
              
              {tieneMateriales ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hilo */}
                  {materiales.hilo !== null && materiales.hilo !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-[#7B2710]">
                      {materiales.hilo.imagen && (
                        <img
                          src={materiales.hilo.imagen}
                          alt={materiales.hilo.color || 'Hilo'}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => e.target.src = "/placeholder.jpg"}
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">Hilo</p>
                        <p className="text-sm">{materiales.hilo.color || 'Sin especificar'}</p>
                      </div>
                    </div>
                  )}

                  {/* Metale */}
                  {materiales.metale !== null && materiales.metale !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-[#7B2710]">
                      {materiales.metale.imagen && (
                        <img
                          src={materiales.metale.imagen}
                          alt={materiales.metale.nombre || 'Metal'}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => e.target.src = "/placeholder.jpg"}
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">Metal</p>
                        <p className="text-sm">{materiales.metale.nombre || 'Sin especificar'}</p>
                      </div>
                    </div>
                  )}

                  {/* Piedra */}
                  {materiales.piedra !== null && materiales.piedra !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-[#7B2710]">
                      {materiales.piedra.imagen && (
                        <img
                          src={materiales.piedra.imagen}
                          alt={materiales.piedra.nombre || 'Piedra'}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => e.target.src = "/placeholder.jpg"}
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">Piedra</p>
                        <p className="text-sm">{materiales.piedra.nombre || 'Sin especificar'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-white rounded border border-[#7B2710]">
                  <p className="text-sm text-center text-gray-600">
                    No se especificaron materiales para este producto personalizado
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Indicador de producto personalizado */}
          {item.tipo_producto === 'personalizado' && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#DC9C5C] opacity-50"></div>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full border">
                ✨ Personalizado
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#DC9C5C] opacity-50"></div>
            </div>
          )}
        </div>
      </div>
    );
  })}
</div>
      </div>
      
      <div className="p-6 border-t flex justify-end">
        <button 
          onClick={() => setPedidoSeleccionado(null)}
          className="px-4 py-2 bg-[#7B2710] text-white rounded-lg hover:bg-[#8C9560] transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}

      {/* Modal para cambiar estado */}
      {cambiandoEstado && (
        <div className="fixed inset-0 bg-[#7B2710] bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-[#7B2710]">Cambiar Estado del Pedido</h3>
              <button onClick={() => setCambiandoEstado(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado actual</label>
                <div className={`px-3 py-2 rounded-lg ${obtenerColorEstado(cambiandoEstado.estado)}`}>
                  {cambiandoEstado.estado.replace('_', ' ')}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo estado</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => {
                    if (nuevoEstado !== 'cancelado') { // Solo permitir cambio si NO está cancelado
                      setNuevoEstado(e.target.value);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C9560] focus:border-[#8C9560]"
                  disabled={nuevoEstado === 'cancelado'} // opcional: deshabilitar visualmente el select
                >
                  <option value="en_proceso">En proceso</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {(nuevoEstado === 'enviado' || nuevoEstado === 'entregado' || nuevoEstado === 'cancelado') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje para el cliente (opcional)
                  </label>
                  <textarea
                    value={mensajeCorreo}
                    onChange={(e) => {
                      const valor = e.target.value;
                      const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,!?¡¿:;()\-'"@#$%&*=+/\n\r]*$/;

                      if (valor === "" || regex.test(valor)) {
                        if (valor.length <= 500) {
                          setMensajeCorreo(valor);
                          setErrorMensajeCorreo(""); // <-- agregado
                        } else {
                          setErrorMensajeCorreo("Máximo 500 caracteres"); // <-- agregado
                        }
                      } else {
                        setErrorMensajeCorreo("Caracter no permitido"); // <-- agregado
                      }
                    }}
                    rows={3}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#8C9560] focus:border-[#8C9560] ${
                      errorMensajeCorreo ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Este mensaje se enviará por correo al cliente..."
                    maxLength={500}
                  />
                  {errorMensajeCorreo && ( // <-- agregado
                    <p className="text-red-500 text-sm mt-1">{errorMensajeCorreo}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {mensajeCorreo.length}/500 caracteres
                  </p>
                </div>
              )}

              {nuevoEstado === 'enviado' && (
                <>
                  {/* Empresa de envío */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa de envío</label>
                    <input
                      type="text"
                      value={empresaEnvio}
                      onChange={(e) => {
                        const valor = e.target.value;
                        const regex = /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]*$/;

                        if (valor === "" || regex.test(valor)) {
                          if (valor.length <= 20) {
                            setEmpresaEnvio(valor);
                            setErrorEmpresa(""); // <-- agregado
                          } else {
                            setErrorEmpresa("Máximo 20 caracteres"); // <-- agregado
                          }
                        } else {
                          setErrorEmpresa("Solo se permiten letras, números, espacios y acentos"); // <-- agregado
                        }
                      }}
                      className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#8C9560] focus:border-[#8C9560] ${
                        errorEmpresa ? "border-red-500" : "border-gray-300"
                      }`}
                      maxLength={20}
                      placeholder="Solo letras, números y espacios"
                    />
                    {errorEmpresa && ( // <-- agregado
                      <p className="text-red-500 text-sm mt-1">{errorEmpresa}</p>
                    )}
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {empresaEnvio.length}/20 caracteres
                      </p>
                    </div>
                  </div>

                  {/* Número de guía */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de guía</label>
                    <input
                      type="text"
                      value={numGuia}
                      onChange={(e) => {
                        const valor = e.target.value;
                        const regex = /^[a-zA-Z0-9\-_]*$/; // letras, números, guion medio y bajo

                        if (valor === "" || regex.test(valor)) {
                          if (valor.length <= 30) {
                            setNumGuia(valor);
                            setErrorNumGuia(""); // <-- agregado
                          } else {
                            setErrorNumGuia("Máximo 30 caracteres"); // <-- agregado
                          }
                        } else {
                          setErrorNumGuia("Solo letras, números, - y _"); // <-- agregado
                        }
                      }}
                      className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#8C9560] focus:border-[#8C9560] ${
                        errorNumGuia ? "border-red-500" : "border-gray-300"
                      }`}
                      maxLength={30}
                      placeholder="Ej: ABC123-456_DEF"
                    />
                    {errorNumGuia && ( // <-- agregado
                      <p className="text-red-500 text-sm mt-1">{errorNumGuia}</p>
                    )}
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {numGuia.length}/30 caracteres
                      </p>
                    </div>
                  </div>
                </>
              )}

            </div>
            
            <div className="p-6 border-t flex justify-end space-x-3">
              <button 
                onClick={() => setCambiandoEstado(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={cambiarEstado}
                className="px-4 py-2 bg-[#7B2710] text-white rounded-lg hover:bg-[#8C9560] transition-colors"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}