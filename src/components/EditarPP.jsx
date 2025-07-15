 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditarPP() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [formEdicion, setFormEdicion] = useState(null);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [errorEdicion, setErrorEdicion] = useState("");
  const [exitoEdicion, setExitoEdicion] = useState("");
  const [metales, setMetales] = useState([]);
  const [piedras, setPiedras] = useState([]);
  const [hilos, setHilos] = useState([]);
  const [cargando, setCargando] = useState(false);


  const categorias = ['Aretes', 'Anillos', 'Dije', 'Pulsera', 'Collar', 'Cadena', 'Brazalete'];

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
    obtenerProductos();
    obtenerMateriales();
  }, []);

  const handleInputChange = (e) => {
  const { name, value, files, type, checked } = e.target;

  if (name === "nombreModelo") {
    const cleaned = value.replace(/[^\wñÑáéíóúÁÉÍÓÚ()% ]/g, "").slice(0, 100);
    setFormEdicion(prev => ({ ...prev, nombreModelo: cleaned }));
  } else if (name === "PrecioManoObra") {
    const cleanValue = value.replace(/[^\d.]/g, "");
    setFormEdicion(prev => ({ ...prev, PrecioManoObra: cleanValue }));
  } else if (name === "tiempoEntrega") {
    const cleanValue = value.replace(/[^\d]/g, "").slice(0, 2);
    setFormEdicion(prev => ({ ...prev, tiempoEntrega: cleanValue }));
  } else if (name === "nuevaImagen") {
    const file = files[0];
    if (!file?.type.startsWith("image/")) {
      alert("El archivo debe ser una imagen (JPG, PNG, etc.)");
      return;
    }
    setFormEdicion(prev => ({ ...prev, nuevaImagen: file }));
  } else if (type === "checkbox") {
    setFormEdicion(prev => ({ ...prev, [name]: checked }));
  } else {
    setFormEdicion(prev => ({ ...prev, [name]: value }));
  }
};

const guardarEdicion = async () => {
  try {
    // Crear objeto con todos los datos
    const datosActualizacion = {
      id_ProPer: formEdicion.id_ProPer,
      nombreModelo: formEdicion.nombreModelo,
      categoria: formEdicion.categoria,
      tiempoEntrega: formEdicion.tiempoEntrega,
      PrecioManoObra: formEdicion.PrecioManoObra,
      Activar: formEdicion.Activar,
      ImagenPP: formEdicion.ImagenPP,
      metales: formEdicion.metales.map(m => ({
        id: m.id,
        gramos: m.gramos,
        ActivarM: m.ActivarM
      })),
      piedras: formEdicion.piedras.map(p => ({
        id: p.id,
        gramos: p.gramos,
        ActivarP: p.ActivarP
      })),
      hilos: formEdicion.hilos.map(h => ({
        id: h.id,
        metros: h.metros,
        ActivarH: h.ActivarH
      }))
    };

    // Si hay nueva imagen, manejarla aparte
    let formData = new FormData();
    let usaFormData = false;
    
    if (formEdicion.nuevaImagen) {
      usaFormData = true;
      formData.append("imagen", formEdicion.nuevaImagen);
      formData.append("datos", JSON.stringify(datosActualizacion));
    }

    const res = await fetch("/api/productosPersonalizados/editarPP", {
      method: "PUT",
      headers: usaFormData ? {} : { "Content-Type": "application/json" },
      body: usaFormData ? formData : JSON.stringify(datosActualizacion)
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || "Error al actualizar producto");
    }
    
    setExitoEdicion("Producto actualizado correctamente");
    setErrorEdicion("");
    
  } catch (error) {
    console.error("Error al guardar:", error);
    setErrorEdicion(error.message);
    setExitoEdicion("");
  }
};

  const obtenerMateriales = async () => {
  try {
    const res = await fetch('/api/productosPersonalizados/editarPP?mode=materiales');
    const data = await res.json();
    setMetales(data.metales || []);
    setPiedras(data.piedras || []);
    setHilos(data.hilos || []);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
  }
};

  const obtenerProductos = async () => {
  try {
    const res = await fetch('/api/productosPersonalizados/editarPP');
    const data = await res.json();
    setProductos(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    setProductos([]);
  }
};

  const filtrarProductos = (texto) => {
    if (!texto.trim()) {
      setFiltrados([]);
      setErrorBusqueda("Escribe un nombre para buscar");
      return;
    }
    
    const textoLower = texto.toLowerCase();
    const resultado = productos.filter((p) =>
      p.nombreModelo.toLowerCase().includes(textoLower)
    );
    
    if (resultado.length === 0) {
      setErrorBusqueda("No se encontraron coincidencias");
    } else {
      setErrorBusqueda("");
    }
    
    setFiltrados(resultado);
  };

  const manejarCambioBusqueda = async (texto) => {
  try {
    if (texto.trim().length >= 3) {
      const res = await fetch(`/api/productosPersonalizados/editarPP/?termino=${encodeURIComponent(texto)}`);
      const resultados = await res.json();
      setFiltrados(resultados);
      setErrorBusqueda(resultados.length === 0 ? "No se encontraron coincidencias" : "");
    }
  } catch (error) {
    console.error("Error en búsqueda:", error);
    setErrorBusqueda("Error al realizar la búsqueda");
  }
};

  // Reemplaza todas las instancias de toggleMaterial con esta función:
const manejarListaConGramos = (tipo, id, valor, esCheckbox = false) => {
  setFormEdicion(prev => {
    const campo = tipo === 'hilos' ? 'metros' : 'gramos';
    const activarField = tipo === 'metales' ? 'ActivarM' : 
                       tipo === 'piedras' ? 'ActivarP' : 'ActivarH';

    // Si es un checkbox (activar/desactivar)
    if (esCheckbox) {
      const existe = prev[tipo].some(item => item.id === id);
      
      if (existe) {
        return {
          ...prev,
          [tipo]: prev[tipo].map(item => 
            item.id === id ? { ...item, [activarField]: valor } : item
          )
        };
      } else {
        const nuevoMaterial = {
          id,
          nombre: (tipo === 'metales' ? metales : 
                 tipo === 'piedras' ? piedras : hilos)
                .find(m => m.id === id)?.nombre || '',
          [campo]: tipo === 'hilos' ? 1 : 0, // Valor por defecto
          [activarField]: true
        };
        return {
          ...prev,
          [tipo]: [...prev[tipo], nuevoMaterial]
        };
      }
    } 
    // Si es un cambio de valor (gramos/metros)
    else {
      return {
        ...prev,
        [tipo]: prev[tipo].map(item => 
          item.id === id ? { ...item, [campo]: valor } : item
        )
      };
    }
  });
};
 const seleccionarProducto = async (producto) => {
  try {
    setCargando(true);
    setErrorEdicion("");
    
    const res = await fetch(`/api/productosPersonalizados/editarPP/?id=${producto.id_ProPer}`);
    const productoCompleto = await res.json();
    
    if (!res.ok) throw new Error(productoCompleto.error || 'Error al cargar producto');

    setFormEdicion({
      id_ProPer: productoCompleto.id_ProPer,
      nombreModelo: productoCompleto.nombreModelo,
      categoria: productoCompleto.categoria,
      tiempoEntrega: productoCompleto.tiempoEntrega,
      PrecioManoObra: productoCompleto.PrecioManoObra,
      Activar: productoCompleto.Activar === 1,
      ImagenPP: productoCompleto.ImagenPP,
      metales: productoCompleto.metales.map(m => ({
        id: m.id,
        nombre: m.nombre,
        gramos: m.gramos,
        ActivarM: m.activo === 1
      })),
      piedras: productoCompleto.piedras.map(p => ({
        id: p.id,
        nombre: p.nombre,
        gramos: p.gramos,
        ActivarP: p.activo === 1
      })),
      hilos: productoCompleto.hilos.map(h => ({
        id: h.id,
        nombre: h.nombre,
        metros: h.metros,
        ActivarH: h.activo === 1,
        valor: h.metros
      })),
      nuevaImagen: null
    });

    setProductoSeleccionado(producto);
    setFiltrados([]);
    setBusqueda("");
    
    document.getElementById('formulario-edicion')?.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error("Error al cargar producto:", error);
    setErrorEdicion(error.message);
  } finally {
    setCargando(false);
  }
};
  // Resto de las funciones (manejarCambioMaterial, guardarEdicion, etc.)...

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 z-0" />
      
      <div className="relative z-10 px-2 sm:px-0  pb-8 w-full max-w-[99.5vw] mx-auto">
        <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Editar Productos Personalizados</h2>

          {/* BUSCADOR */}
          
          <div className="mb-6">
            <label className="block font-semibold text-[#7B2710] mb-2">
              Buscar producto por nombre
            </label>
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                maxLength={30}
                onChange={(e) => {
                  const nuevoTexto = e.target.value;
                  setBusqueda(nuevoTexto);
                  
                  // Validación en tiempo real
                  if (nuevoTexto.length >= 30) {
                    setErrorBusqueda("Máximo 30 caracteres permitidos");
                  } else if (nuevoTexto.trim().length > 0 && nuevoTexto.trim().length < 3) {
                    setErrorBusqueda("Mínimo 3 caracteres requeridos");
                    setFiltrados([]);
                  } else {
                    setErrorBusqueda("");
                    manejarCambioBusqueda(nuevoTexto); // Llamada a la función de búsqueda
                  }
                }}
                placeholder="Escribe el nombre del producto..."
                className="w-full p-3 pl-4 border border-[#8C9560] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#762114]"
              />
              {busqueda && (
                <div className="absolute right-10 top-3 flex items-center">
                  <span className="text-xs text-gray-500 mr-2">
                    {busqueda.length}/30
                  </span>
                  <button
                    onClick={() => {
                      setBusqueda("");
                      setFiltrados([]);
                      setErrorBusqueda("");
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            {errorBusqueda && (
              <p className="text-red-500 mt-2 text-sm">{errorBusqueda}</p>
            )}
          </div>

          {/* LISTA DE RESULTADOS */}
          {filtrados.length > 0 && (
          <div className="mb-8 bg-white rounded-lg border border-[#762114] overflow-hidden">
            <h3 className="bg-[#762114] text-white p-3 font-semibold">
              Resultados de búsqueda
            </h3>
            <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
              {filtrados.map((producto) => (
                <li
                  key={producto.id_ProPer}
                  className="p-3 hover:bg-[#EADDD7] cursor-pointer transition-colors flex justify-between items-center"
                  onClick={() => seleccionarProducto(producto)}
                >
                  <div>
                    <div className="font-medium text-[#333]">{producto.nombreModelo}</div>
                    <div className="text-sm text-gray-600">{producto.categoria}</div>
                  </div>
                  <div className="text-xs bg-[#762114] text-white px-2 py-1 rounded-full">
                    Editar
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

          {productoSeleccionado && formEdicion && (
            <form className="space-y-4">
              <div>
                <label className="block font-semibold text-[#7B2710]">ID Producto</label>
                <input
                  name="id_ProPer"
                  value={formEdicion.id_ProPer}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded border"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block font-semibold text-[#7B2710]">Nombre del modelo</label>
                <input
                  name="nombreModelo"
                  value={formEdicion.nombreModelo}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded border"
                  placeholder="Ej. Pulsera Maya"
                  maxLength={35}
                />
              </div>

              <div>
                <label className="block font-semibold text-[#7B2710]">Categoría</label>
                <select
                  name="categoria"
                  value={formEdicion.categoria}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded border"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* 🔩 Metales */}
            <div className="mb-6">
              <label className="block font-semibold text-[#7B2710] mb-2">Metales</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {metales.map((metal) => {
                  const materialSeleccionado = formEdicion?.metales?.find(m => m.id === metal.id) || {};
                  const estaActivo = materialSeleccionado?.ActivarM ?? false;
                  
                  return (
                    <div key={metal.id} className={`p-3 rounded-lg border-2 ${estaActivo ? "bg-[#EADDD7] border-[#7B2710]" : "bg-white border-gray-300"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={estaActivo}
                            onChange={(e) => manejarListaConGramos("metales", metal.id, e.target.checked, true)}
                            className="accent-[#7B2710] w-5 h-5"
                          />
                          <span className="font-medium">
                            {metal.nombre || `Metal ID: ${metal.id}`}
                          </span>
                        </div>
                        
                        {estaActivo && (
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={materialSeleccionado?.gramos || ''}
                            onChange={(e) => manejarListaConGramos("metales", metal.id, parseFloat(e.target.value))}
                            className="w-20 p-1 border rounded"
                            placeholder="Gramos"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

              {/* 💎 Piedras */}
              
              <div>
                <label className="block font-semibold text-[#7B2710] mb-2">Piedras</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {piedras.map((p) => {
                    const materialSeleccionado = formEdicion?.piedras?.find(item => item.id === p.id) || {};
                    const estaActivo = materialSeleccionado?.ActivarP ?? false;
                    const valorActual = materialSeleccionado?.gramos || '';

                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          estaActivo ? "bg-[#EADDD7] border-[#7B2710]" : "bg-white border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <input
                            type="checkbox"
                            className="accent-[#7B2710] w-5 h-5"
                            checked={estaActivo}
                            onChange={(e) => manejarListaConGramos("piedras", p.id, e.target.checked, true)}
                          />
                          <span className="text-[#333] font-semibold">{p.nombre}</span>
                        </div>

                        {estaActivo && (
                          <input
                            type="number"
                            placeholder="Gramos"
                            min="0.1"
                            step="0.1"
                            value={valorActual}
                            onChange={(e) => manejarListaConGramos("piedras", p.id, parseFloat(e.target.value))}
                            className="w-24 p-1 border rounded"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 🧵 Hilos - Versión protegida */}
              <div>
                <label className="block font-semibold text-[#7B2710] mb-2">Hilos (metros)</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {hilos.map((h) => {
                    const materialSeleccionado = formEdicion?.hilos?.find(item => item.id === h.id) || {};
                    const estaActivo = materialSeleccionado?.ActivarH ?? false;
                    const valorActual = materialSeleccionado?.metros || '';

                    return (
                      <label
                        key={h.id}
                        className={`flex items-center justify-between gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          estaActivo ? "bg-[#EADDD7] border-[#7B2710]" : "bg-white border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <input
                            type="checkbox"
                            className="accent-[#7B2710] w-5 h-5"
                            checked={estaActivo}
                            onChange={(e) => manejarListaConGramos("hilos", h.id, e.target.checked, true)}
                          />
                          <span className="text-[#333] font-semibold">{h.nombre}</span>
                        </div>

                        {estaActivo && (
                          <input
                            type="number"
                            placeholder="Metros"
                            min="0.1"
                            step="0.1"
                            value={valorActual}
                            onChange={(e) => manejarListaConGramos("hilos", h.id, parseFloat(e.target.value))}
                            className="w-24 p-1 border rounded"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#7B2710]">Tiempo de entrega (días)</label>
                <input
                  type="number"
                  name="tiempoEntrega"
                  value={formEdicion.tiempoEntrega}
                  onChange={handleInputChange}
                  min="1"
                  max="30"
                  className="w-full p-2 rounded border"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#7B2710]">Precio mano de obra</label>
                <input
                  type="number"
                  name="PrecioManoObra"
                  value={formEdicion.PrecioManoObra}
                  onChange={handleInputChange}
                  min="0"
                  max="5000"
                  className="w-full p-2 rounded border"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="font-semibold text-[#7B2710]">¿Activar producto?</label>
                <input
                  type="checkbox"
                  name="Activar"
                  checked={formEdicion.Activar}
                  onChange={handleInputChange}
                  className="w-5 h-5"
                />
              </div>

              <div>
                    <label className="block font-semibold text-[#7B2710]">Imagen del producto</label>
                    <input 
                        type="file" 
                        name="nuevaImagen"  // Cambiado para diferenciar de la imagen existente
                        onChange={handleInputChange} 
                        className="w-full p-2 border rounded"
                        accept="image/*"  // Asegura que solo se seleccionen imágenes
                    />
                    
                    {formEdicion?.ImagenPP && (  // Usar ImagenPP en lugar de imagen
                        <div className="mt-2">
                        <p className="text-sm text-gray-600">Imagen actual:</p>
                        <img 
                            src={formEdicion.ImagenPP}  // Usar la URL completa
                            alt="Imagen actual del producto" 
                            className="h-20 object-contain"
                        />
                        </div>
                    )}
                </div>

              {errorEdicion && <p className="text-red-600">{errorEdicion}</p>}
              {exitoEdicion && <p className="text-green-600">{exitoEdicion}</p>}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={guardarEdicion}
                  className="bg-[#7B2710] text-white font-semibold py-2 px-4 rounded hover:bg-[#5c1d0a]"
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProductoSeleccionado(null);
                    setFormEdicion(null);
                  }}
                  className="bg-[#8C9560] text-white font-semibold py-2 px-4 rounded hover:bg-[#DC9C5C]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}