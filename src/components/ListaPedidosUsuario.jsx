"use client";

import { useState, useEffect } from "react";
import { FiShoppingBag, FiEye, FiCalendar, FiDollarSign, FiTruck } from "react-icons/fi";

const ListaPedidosUsuario = ({ idCliente }) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  useEffect(() => {
    if (idCliente) {
      fetchPedidosCliente();
    }
  }, [idCliente]);

  const fetchPedidosCliente = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/pedidos/${idCliente}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setPedidos(data.pedidos || []);
      } else {
        setPedidos([]);
      }
    } catch (err) {
      console.error("❌ Error fetching pedidos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(precio || 0);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#762114] mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando pedidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar pedidos</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchPedidosCliente}
            className="bg-[#762114] text-white px-4 py-2 rounded-lg hover:bg-[#8C2710]"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
          <FiShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No tienes pedidos</h3>
          <p className="text-gray-600">Aún no has realizado ninguna compra.</p>
        </div>
      </div>
    );
  }

  if (pedidoSeleccionado) {
    return (
      <div>
        <button 
          onClick={() => setPedidoSeleccionado(null)}
          className="mb-6 text-[#762114] hover:underline flex items-center"
        >
          ← Volver a la lista de pedidos
        </button>
        <DetallePedido pedido={pedidoSeleccionado} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {pedidos.map((pedido) => (
        <div key={pedido.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg text-[#7B2710]">Pedido: {pedido.codigo_pedido}</h3>
              <p className="text-gray-600 text-sm">
                <FiCalendar className="inline mr-1" />
                {formatFecha(pedido.fecha_creacion)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                pedido.estado === 'entregado' ? 'bg-green-100 text-green-800' :
                pedido.estado === 'enviado' ? 'bg-blue-100 text-blue-800' :
                pedido.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
                pedido.estado === 'confirmado' ? 'bg-purple-100 text-purple-800' :
                pedido.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {pedido.estado.replace('_', ' ').toUpperCase()}
              </span>
              
              <span className="text-lg font-bold text-[#762114]">
                {formatPrecio(pedido.total)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">
                <FiTruck className="inline mr-1" />
                Envío: {pedido.tipo_envio || 'No especificado'}
              </p>
              <p className="text-sm text-gray-600">
                <FiDollarSign className="inline mr-1" />
                Pago: {pedido.metodo_pago || 'No especificado'}
              </p>
            </div>
            
            <div>
              <p className="text-sm">
                Productos: <strong>{pedido.productos?.length || 0}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setPedidoSeleccionado(pedido)}
            className="bg-[#762114] text-white px-4 py-2 rounded-lg hover:bg-[#8C2710] flex items-center gap-2"
          >
            <FiEye size={16} />
            Ver Detalles
          </button>
        </div>
      ))}
    </div>
  );
};

// Componente para mostrar detalles de un pedido individual
const DetallePedido = ({ pedido }) => {
  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(precio || 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Detalles del Pedido: {pedido.codigo_pedido}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 ">
        <div className="bg-[#F5F1F1]  p-4 rounded-lg">
          <h3 className="font-semibold mb-3 text-[#7B2710]">Información del Pedido</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Estado:</strong> {pedido.estado}</p>
            <p><strong>Fecha de compra:</strong> {new Date(pedido.fecha_creacion).toLocaleDateString()}</p>
            <p><strong>Método de pago:</strong> {pedido.metodo_pago}</p>
            <p><strong>Tipo de envío:</strong> {pedido.tipo_envio}</p>
          </div>
        </div>

        <div className="bg-[#F5F1F1] p-4 rounded-lg ">
          <h3 className="font-semibold mb-3 text-[#7B2710]">Totales</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Subtotal:</strong> {formatPrecio(pedido.subtotal)}</p>
            <p><strong>Envío:</strong> {formatPrecio(pedido.precio_envio)}</p>
            <p><strong>Total:</strong> {formatPrecio(pedido.total)}</p>
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-4 text-[#7B2710]">Productos</h3>
      <div className="space-y-4">
  {pedido.productos?.map((producto, index) => {
    const materiales = producto.materiales || {};
    
    return (
      <div key={index} className="flex items-start gap-4 border border-gray-200 rounded-lg p-4">
        {/* Imagen del producto */}
        <img
          src={producto.imagen_principal || "/placeholder.jpg"}
          alt={producto.nombre_producto}
          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          onError={(e) => {
            e.target.src = "/placeholder.jpg";
          }}
        />
        
        <div className="flex-1">
          <h4 className="font-semibold text-lg text-[#7B2710]">{producto.nombre_producto}</h4>
          
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Cantidad:</span> {producto.cantidad}
            </div>
            <div>
              <span className="font-medium">Precio unitario:</span> {formatPrecio(producto.precio_unitario)}
            </div>
            {/* 🔹 MOSTRAR TALLA SI ES ANILLO */}
            {producto.categoria === 'Anillos' && producto.talla && (
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full border border-blue-200">
                  💍 Anillo Talla: {producto.talla}
                </span>
              </div>
            )}
          </div>

          {/* Materiales - NUEVA ESTRUCTURA */}
          {(materiales.hilo || materiales.metal || materiales.metale || materiales.piedra) && (
            <div className="mt-4 p-4 bg-[#F5F1F1]  rounded-lg">
              <h5 className="font-semibold text-[#7B2710] mb-3">Materiales utilizados:</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hilo */}
                {materiales.hilo && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded border border-[#7B2710] ">
                    <img
                      src={materiales.hilo.imagen}
                      alt={materiales.hilo.color}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => e.target.src = "/placeholder.jpg"}
                    />
                    <div>
                      <p className="text-sm">Hilo: {materiales.hilo.color}</p>
                    </div>
                  </div>
                )}

                {/* Metale (por si hay typo) */}
                {materiales.metale && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded border border-[#7B2710]">
                    <img
                      src={materiales.metale.imagen}
                      alt={materiales.metale.nombre}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => e.target.src = "/placeholder.jpg"}
                    />
                    <div>
                      <p className="text-sm">Metal: {materiales.metale.nombre}</p>
                    </div>
                  </div>
                )}

                {/* Piedra */}
                {materiales.piedra && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded border border-[#7B2710]">
                    <img
                      src={materiales.piedra.imagen}
                      alt={materiales.piedra.nombre}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => e.target.src = "/placeholder.jpg"}
                    />
                    <div>
                      <p className="text-sm">Piedra: {materiales.piedra.nombre}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información adicional */}
          {producto.tipo_producto === 'personalizado' && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#DC9C5C] opacity-50"></div>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium  px-2 py-1 rounded-full border">
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
  );
};

export default ListaPedidosUsuario;