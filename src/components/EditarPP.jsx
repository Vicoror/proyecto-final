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
  const [errorImagen, setErrorImagen] = useState("");

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
      // Validación para Nombre del modelo: no caracteres especiales y longitud máxima
      const cleaned = value.replace(/[^\wñÑáéíóúÁÉÍÓÚ()% ]/g, "").slice(0, 100);
      setFormEdicion(prev => ({ ...prev, nombreModelo: cleaned }));
    } else if (name === "PrecioManoObra") {
      // Validación para Precio mano de obra: 0 a 5000
      const cleanValue = Math.min(5000, Math.max(0, parseFloat(value.replace(/[^\d.]/g, "") || " ")));
      setFormEdicion(prev => ({ ...prev, PrecioManoObra: cleanValue }));
    } else if (name === "tiempoEntrega") {
      // Validación para Tiempo de entrega: 0 a 30 días
      const cleanValue = Math.min(30, Math.max(0, parseInt(value.replace(/[^\d]/g, "") || " ")));
      setFormEdicion(prev => ({ ...prev, tiempoEntrega: cleanValue }));
   } else if (name === "nuevaImagen") {
  const file = files[0];
  setErrorImagen(""); // Resetear mensaje de error
  
  if (!file) return;

      // Lista de formatos permitidos (MIME types)
      const formatosPermitidos = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];

      // Validar tipo de archivo
      if (!formatosPermitidos.includes(file.type)) {
        setErrorImagen(`Formato no soportado. Solo se permiten: ${formatosPermitidos.map(t => t.split('/')[1].toUpperCase()).join(', ')}`);
        e.target.value = '';
        setFormEdicion(prev => ({ ...prev, nuevaImagen: null }));
        return;
      }

      // Validar tamaño máximo (ejemplo: 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        setErrorImagen("El archivo es demasiado grande (máximo 5MB permitidos)");
        e.target.value = '';
        setFormEdicion(prev => ({ ...prev, nuevaImagen: null }));
        return;
      }

      // Si pasa todas las validaciones
      setFormEdicion(prev => ({ ...prev, nuevaImagen: file }));
    }
    
    
}

  const guardarEdicion = async () => {
    try {
      // Validación adicional antes de guardar
      if (!formEdicion.nombreModelo || formEdicion.nombreModelo.length < 2) {
        throw new Error("El nombre del modelo debe tener al menos 2 caracteres");
      }

      if (!formEdicion.categoria) {
        throw new Error("Debes seleccionar una categoría");
      }

      // Validar materiales (gramos/metros entre 0 y 1000)
      const materialesInvalidos = [
        ...formEdicion.metales.filter(m => m.ActivarM && (m.gramos <= 0 || m.gramos > 1000)),
        ...formEdicion.piedras.filter(p => p.ActivarP && (p.gramos <= 0 || p.gramos > 1000)),
        ...formEdicion.hilos.filter(h => h.ActivarH && (h.metros <= 0 || h.metros > 1000))
      ];

      if (materialesInvalidos.length > 0) {
        throw new Error("Los materiales deben tener valores entre 0.1 y 1000");
      }

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
      setTimeout(() => setExitoEdicion(""), 3000);
      
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
        // Validar que el valor esté entre 0 y 1000
        const valorValidado = Math.min(1000, Math.max(0, parseFloat(valor) || 0));
        return {
          ...prev,
          [tipo]: prev[tipo].map(item => 
            item.id === id ? { ...item, [campo]: valorValidado } : item
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

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 z-0" />
      
      <div className="relative z-10 px-2 sm:px-0  pb-8 w-full max-w-[99.5vw] mx-auto">
        <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#7B2710] p-6 md:p-8">
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

                  // 1. Filtrar caracteres: solo letras, números, espacios y guiones
                  let textoFiltrado = nuevoTexto.replace(/[^a-zA-Z0-9\s\-]/g, "");

                  // 2. Evitar más de dos números iguales seguidos
                  textoFiltrado = textoFiltrado.replace(/(\d)\1{2,}/g, "$1$1");

                  // 3. Evitar más de dos letras iguales seguidas (case-insensitive)
                  textoFiltrado = textoFiltrado.replace(/([a-zA-Z])\1{2,}/g, "$1$1");

                  setBusqueda(textoFiltrado);

                  // 4. Validaciones adicionales
                  if (textoFiltrado.trim().length === 0) {
                    setErrorBusqueda("El campo no puede estar vacío o solo con espacios");
                    setFiltrados([]);
                  } else if (/^\d+$/.test(textoFiltrado.trim())) {
                    setErrorBusqueda("No se permiten solo números");
                    setFiltrados([]);
                  } else if (textoFiltrado.length > 30) {
                    setErrorBusqueda("Máximo 30 caracteres permitidos");
                    setFiltrados([]);
                  } else if (textoFiltrado.trim().length < 3) {
                    setErrorBusqueda("Mínimo 3 caracteres requeridos");
                    setFiltrados([]);
                  } else {
                    setErrorBusqueda("");
                    manejarCambioBusqueda(textoFiltrado);
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
            <form className="space-y-4" id="formulario-edicion">
              <div>
                <label className="block font-semibold text-[#7B2710]">ID Producto</label>
                <input
                  name="id_ProPer"
                  value={formEdicion.id_ProPer}
                  readOnly
                  className="w-full p-2 rounded border bg-gray-100 cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">Este campo no se puede modificar</p>
              </div>

              <div>
                <label className="block font-semibold text-[#7B2710]">Nombre del modelo</label>
                <input
                  name="nombreModelo"
                  value={formEdicion.nombreModelo}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded border"
                  placeholder="Ej. Pulsera Maya"
                  maxLength={100}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formEdicion.nombreModelo.length}/100 caracteres. No se permiten caracteres especiales.
                </p>
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
                <label className="block font-semibold text-[#7B2710] mb-2">Metales (gramos)</label>
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
                              max="1000"
                              step="0.1"
                              value={materialSeleccionado?.gramos || ''}
                              onChange={(e) => manejarListaConGramos("metales", metal.id, parseFloat(e.target.value))}
                              className="w-20 p-1 border rounded"
                              placeholder="Gramos"
                            />
                          )}
                        </div>
                        {estaActivo && (
                          <p className="text-xs text-gray-500 mt-1">Máximo 1000 gramos</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 💎 Piedras */}
              <div>
                <label className="block font-semibold text-[#7B2710] mb-2">Piedras (gramos)</label>
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
                          <div className="flex flex-col items-end">
                            <input
                              type="number"
                              placeholder="Gramos"
                              min="0.1"
                              max="1000"
                              step="0.1"
                              value={valorActual}
                              onChange={(e) => manejarListaConGramos("piedras", p.id, parseFloat(e.target.value))}
                              className="w-24 p-1 border rounded"
                            />
                            <p className="text-xs text-gray-500">Máx. 1000g</p>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 🧵 Hilos */}
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
                          <div className="flex flex-col items-end">
                            <input
                              type="number"
                              placeholder="Metros"
                              min="0.1"
                              max="1000"
                              step="0.1"
                              value={valorActual}
                              onChange={(e) => manejarListaConGramos("hilos", h.id, parseFloat(e.target.value))}
                              className="w-24 p-1 border rounded"
                            />
                            <p className="text-xs text-gray-500">Máx. 1000m</p>
                          </div>
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
                  min="0"
                  max="30"
                  className="w-full p-2 rounded border"
                />
                <p className="text-sm text-gray-500 mt-1">Mínimo 0, máximo 30 días</p>
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
                <p className="text-sm text-gray-500 mt-1">Mínimo $0, máximo $5000</p>
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
                  name="nuevaImagen"
                  onChange={handleInputChange} 
                  className="w-full p-2 border rounded"
                  accept="image/*"
                />
                <p className="text-sm text-gray-500 mt-1">Formatos permitidos: JPG, PNG, GIF, etc.</p>
                
                {formEdicion?.ImagenPP && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Imagen actual:</p>
                    <img 
                      src={formEdicion.ImagenPP}
                      alt="Imagen actual del producto" 
                      className="h-20 object-contain"
                    />
                  </div>
                )} {errorImagen && <p className="text-red-500 text-sm mt-1">{errorImagen}</p>}
              </div>

              {errorEdicion && (
                <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                  <p>{errorEdicion}</p>
                </div>
              )}
              {exitoEdicion && (
                <div className="p-3 bg-green-100 border-l-4 border-green-500 text-green-700">
                  <p>{exitoEdicion}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={guardarEdicion}
                  className="bg-[#7B2710] text-white font-semibold py-2 px-4 rounded hover:bg-[#5c1d0a]"
                  disabled={cargando}
                >
                  {cargando ? "Guardando..." : "Guardar cambios"}
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