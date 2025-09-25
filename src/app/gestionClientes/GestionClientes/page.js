"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft, Search, Edit2, ShoppingCart, Eye, EyeOff } from "lucide-react";
import ListaPedidosUsuario from "@/components/ListaPedidosUsuario";

export default function GestionUsuarios() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarCompras, setMostrarCompras] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    } else {
      cargarUsuarios();
    }
  }, []);

  // Cargar usuarios desde la API
  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const response = await fetch('/api/gestionUsuarios');
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
        setUsuariosFiltrados(data);
      } else {
        console.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  // Filtrar usuarios por correo
  useEffect(() => {
    if (terminoBusqueda === "") {
      setUsuariosFiltrados(usuarios);
    } else {
      const filtrados = usuarios.filter(usuario => 
        usuario.correo.toLowerCase().includes(terminoBusqueda.toLowerCase())
      );
      setUsuariosFiltrados(filtrados);
    }
  }, [terminoBusqueda, usuarios]);

  // Cambiar tipo de usuario
  const cambiarTipoUsuario = async (idCliente, nuevoRol) => {
    try {
      const response = await fetch('/api/gestionUsuarios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id_cliente: idCliente, 
          rol: nuevoRol 
        }),
      });

      if (response.ok) {
        // Actualizar la lista de usuarios
        cargarUsuarios();
      } else {
        console.error('Error al cambiar el tipo de usuario');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Alternar estado de activación del usuario
  const toggleActivarUsuario = async (idCliente, estadoActual) => {
    try {
      const response = await fetch('/api/gestionUsuarios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id_cliente: idCliente, 
          activar_usuario: estadoActual ? 0 : 1 
        }),
      });

      if (response.ok) {
        // Actualizar la lista de usuarios
        cargarUsuarios();
      } else {
        console.error('Error al cambiar el estado del usuario');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

        {/* Sección de gestión de usuarios */}
        <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] p-4 md:p-8">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Gestión de Clientes</h2>
          
          {/* Buscador */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-[#7B2710]" />
            </div>
            <input
              type="text"
              placeholder="Buscar por correo electrónico"
              className="w-full pl-10 pr-4 py-2 border border-[#8C9560] rounded-lg focus:ring-2 focus:ring-[#DC9C5C] focus:border-[#DC9C5C]"
              value={terminoBusqueda}
                onChange={(e) => {
                  const valor = e.target.value;
                  if (
                    valor.length <= 20 &&
                    /^[a-zA-Z0-9\s@.]*$/.test(valor)
                  ) {
                    setTerminoBusqueda(valor);
                  }
                }}
            />
          </div>

          {/* Lista de usuarios */}
          {cargando ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7B2710]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-[#8C9560] text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">Clave</th>
                    <th className="py-3 px-4 text-left">Nombre</th>
                    <th className="py-3 px-4 text-left">Correo</th>
                    <th className="py-3 px-4 text-left">Tipo</th>
                    <th className="py-3 px-4 text-left">Fecha Registro</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usuariosFiltrados.slice(0, 30).map((usuario) => (
                    <tr key={usuario.id_cliente} className="hover:bg-[#f9f5f5]">
                      <td className="py-3 px-4">{usuario.id_cliente}</td>
                      <td className="py-3 px-4">{usuario.nombre} {usuario.apellidos}</td>
                      <td className="py-3 px-4">{usuario.correo}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          usuario.rol === 'admin' 
                            ? 'bg-[#7B2710] text-white' 
                            : 'bg-[#DC9C5C] text-[#7B2710]'
                        }`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="py-3 px-4">{formatearFecha(usuario.fecha_registro)}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                          {/* Cambiar tipo de usuario */}
                          <button
                            onClick={() => cambiarTipoUsuario(
                              usuario.id_cliente, 
                              usuario.rol === 'admin' ? 'cliente' : 'admin'
                            )}
                            className="flex items-center text-[#7B2710] hover:text-[#8C9560] transition-colors"
                            title="Cambiar tipo de usuario"
                          >
                            <Edit2 size={16} className="mr-1" />
                            <span className="hidden sm:inline">Tipo</span>
                          </button>
                          
                          {/* Ver compras */}
                          <button
                            onClick={() => {
                              setUsuarioSeleccionado(usuario);
                              setMostrarCompras(true);
                            }}
                            className="flex items-center text-[#7B2710] hover:text-[#8C9560] transition-colors"
                            title="Ver compras"
                          >
                            <ShoppingCart size={16} className="mr-1" />
                            <span className="hidden sm:inline">Compras</span>
                          </button>
                          
                          {/* Activar/Desactivar usuario */}
                          <button
                            onClick={() => toggleActivarUsuario(usuario.id_cliente, usuario.activar_usuario)}
                            className={`flex items-center ${
                              usuario.activar_usuario 
                                ? 'text-green-600 hover:text-red-600' 
                                : 'text-red-600 hover:text-green-600'
                            } transition-colors`}
                            title={usuario.activar_usuario ? "Desactivar usuario" : "Activar usuario"}
                          >
                            {usuario.activar_usuario ? (
                              <>
                                <Eye size={16} className="mr-1" />
                                <span className="hidden sm:inline">Activo</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={16} className="mr-1" />
                                <span className="hidden sm:inline">Inactivo</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {usuariosFiltrados.length === 0 && (
                <div className="text-center py-8 text-[#7B2710]">
                  No se encontraron usuarios
                </div>
              )}
            </div>
          )}
        </section>

        {/* Modal para ver compras del usuario */}
        {mostrarCompras && usuarioSeleccionado && (
          <div className="fixed inset-0 bg-[#8C9560] flex items-center justify-center z-50 p-4" 
      
          >
            
            <div className="bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] mt-36 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#7B2710]">
                  Compras de {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellidos}
                </h3>
                <button 
                  onClick={() => setMostrarCompras(false)}
                  className="text-[#7B2710] hover:text-[#8C9560]"
                >
                  ✕
                </button>
              </div>
              
              <ListaPedidosUsuario idCliente={usuarioSeleccionado.id_cliente} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}