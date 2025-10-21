"use client";

import { useEffect, useState } from "react";
import { FiUser, FiHome, FiChevronDown, FiCheck, FiX } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import BotonAgregarCarrito from "@/components/BotonAgregarCarrito";
import IconoCarrito from "@/components/IconoCarrito";
import NavCliente from "@/components/NavCliente";

export default function PersonalizarJoyas() {
  const router = useRouter();
  const [cantidad, setCantidad] = useState(1);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("null");
  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [idModeloSeleccionado, setIdModeloSeleccionado] = useState(null);
  const [materiales, setMateriales] = useState({ metales: [], hilos: [], piedras: [] });
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState({
    metal: null,
    piedra: null,
    hilo: null
  });
  const [precioTotal, setPrecioTotal] = useState(0);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  // Agrega estos estados a tu componente
  const [tallasAnillos, setTallasAnillos] = useState([]);
  const [tallaSeleccionada, setTallaSeleccionada] = useState("");
  const [mostrarGuiaTallas, setMostrarGuiaTallas] = useState(false);
  const [fotoTallas, setFotoTallas] = useState("");

  // Carga modelos al iniciar
  useEffect(() => {
    axios.get("/api/productosPersonalizados/frontproducperso/product_perso")
      .then(res => {
        if (Array.isArray(res.data)) {
          const activos = res.data.filter(p => p.Activar);
          setCategorias([...new Set(activos.map(p => p.categoria))]);
          setModelos(activos);
        } else {
          console.error("Respuesta inesperada:", res.data);
        }
      })
      .catch(err => {
        console.error("Error al obtener productos personalizados:", err);
      });
  }, []);

   useEffect(() => {
          fetch('/api/whatsapp-config')
            .then(res => res.json())
            .then(data => setFotoTallas(data.foto_tallas_anillos || ""))
            .catch(err => console.error('Error:', err));
        }, []);

  useEffect(() => {
  // Cargar tallas de anillos desde la API
  const cargarTallasAnillos = async () => {
    try {
      const res = await fetch('/api/tallas_anillos');
      const data = await res.json();
      setTallasAnillos(data);
    } catch (error) {
      console.error('Error cargando tallas:', error);
    }
  };
  
  cargarTallasAnillos();
}, []);

  // Carga materiales al seleccionar modelo
  useEffect(() => {
    if (!idModeloSeleccionado) return;

    axios.get(`/api/productosPersonalizados/frontproducperso/materiales_front?id=${idModeloSeleccionado}`)
      .then(res => {
        setMateriales(res.data);
        // Resetear selecciones al cambiar modelo
        setMaterialesSeleccionados({ metal: null, piedra: null, hilo: null });
      })
      .catch(console.error);
  }, [idModeloSeleccionado]);

  // Cálculo automático del precio total
  useEffect(() => {
    if (!modeloSeleccionado) return;

    let total = 0; 

    if (modeloSeleccionado.PrecioManoObra) {
      total += parseFloat(modeloSeleccionado.PrecioManoObra) || 0;
    }

    Object.entries(materialesSeleccionados).forEach(([tipo, material]) => {
      if (!material) return;
      
      if (tipo === 'hilo') {
        total += ((material.precioH || 0) * (material.metros || 1)) / 10;
      } else {
        total += ((material.precioM || material.precioP || 0) * (material.gramos || 1)) / 10;
      }
    });

    setPrecioTotal(total);
  }, [materialesSeleccionados, modeloSeleccionado]);

  const seleccionarMaterial = (tipo, material) => {
    setMaterialesSeleccionados(prev => ({
      ...prev,
      [tipo]: material
    }));
  };

  const modelosFiltrados = categoriaSeleccionada && categoriaSeleccionada !== "null"
    ? modelos.filter(m => m.categoria === categoriaSeleccionada)
    : modelos;

  return (
     <>
    <NavCliente />
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4 sm:p-6 relative"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      <div className="absolute inset-0 bg-white opacity-70"></div>

      <div className="relative z-10">

        <div className="bg-[#F5F1F1] p-6 rounded-2xl shadow-xl space-y-6 border-4 border-[#7B2710]">
        {/* 1. Selecciona una categoría - DROPDOWN CORREGIDO */}
<div>
  <h2 className="text-xl font-semibold text-[#7B2710] mb-3">1. Selecciona una categoría</h2>
  <div className="relative">
    <button 
      className="w-full bg-white p-3 rounded-lg border border-gray-300 flex justify-between items-center hover:border-[#DC9C5C] transition-colors"
      onClick={() => setDropdownAbierto(!dropdownAbierto)}
    >
      <span className={categoriaSeleccionada === "null" ? "text-gray-400" : "text-gray-800"}>
        {categoriaSeleccionada === "null" ? "Elegir categoría" : categoriaSeleccionada}
      </span>
      <FiChevronDown className={`transform transition-transform ${dropdownAbierto ? 'rotate-180' : ''}`} />
    </button>
    
    {dropdownAbierto && (
      <>
        {/* Overlay para cerrar al hacer clic fuera */}
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setDropdownAbierto(false)}
        />
        
        {/* Lista de categorías */}
        <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
          {categorias.map(c => (
            <button
              key={c}
              className="w-full p-3 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
              onClick={() => {
                setCategoriaSeleccionada(c);
                setDropdownAbierto(false);
                setModeloSeleccionado(null);
                setIdModeloSeleccionado(null);
              }}
            >
              <div className="flex items-center justify-between">
                <span>{c}</span>
                {categoriaSeleccionada === c && (
                  <FiCheck className="text-[#DC9C5C]" />
                )}
              </div>
            </button>
          ))}
        </div>
      </>
    )}
  </div>

  {/* 🔹 COMPONENTE DE TALLAS PARA ANILLOS */}
  {categoriaSeleccionada === "Anillos" && (
    <div className="mt-4">
      <label className="block text-[#7B2710] font-semibold mb-2">
        Selecciona talla
      </label>
      <div className="flex items-center gap-2">
        <select
          value={tallaSeleccionada || ""}
          onChange={(e) => setTallaSeleccionada(e.target.value)}
          className="w-full p-2 border border-[#8C9560] rounded-md"
        >
          <option value="">Selecciona una talla</option>
          {tallasAnillos.map((talla) => (
            <option key={talla.id_talla} value={talla.talla}>
              Talla {talla.talla}
            </option>
          ))}
        </select>
        
        <button
          type="button"
          onClick={() => setMostrarGuiaTallas(true)}
          className="px-3 py-2 bg-[#8C9560] text-white text-sm rounded hover:bg-[#DC9C5C] transition whitespace-nowrap"
        >
          Ver tallas
        </button>
      </div>
      
      {/* Modal guía de tallas */}
      {mostrarGuiaTallas && (
            <div className="fixed inset-0 flex justify-center items-center z-50 pointer-events-none">
              <div className="relative z-10 pointer-events-auto">
                <button
                  onClick={() => setMostrarGuiaTallas(false)}
                  className="absolute -top-8 -right-8 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg text-gray-700 hover:text-red-500 text-lg border border-gray-300"
                >
                  ×
                </button>
                <img
                  src={fotoTallas || "/ruta-imagen-tallas-default.png"}
                  alt="Guía de tallas"
                  className="max-w-[280px] max-h-[350px] object-contain rounded-lg shadow-xl border border-gray-200"
                />
              </div>
            </div>
          )}
    </div>
  )}
</div>

{/* 🔹 CONDICIÓN PARA MOSTRAR "ESCOGE UN MODELO" SOLO CUANDO SE CUMPLAN LOS REQUISITOS */}
{(categoriaSeleccionada && categoriaSeleccionada !== "null" && 
  (categoriaSeleccionada !== "Anillos" || (categoriaSeleccionada === "Anillos" && tallaSeleccionada))) && (
  
<div> 
  <h2 className="text-xl font-semibold text-[#7B2710] mb-3">
    2. Escoge un modelo
    {categoriaSeleccionada && categoriaSeleccionada !== "null" && (
      <span className="text-sm font-normal text-gray-600 ml-2">
        (Filtrado por: {categoriaSeleccionada})
      </span>
    )}
  </h2>

  {modelosFiltrados.length > 0 ? (
    <div
      className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {modelosFiltrados.map((m) => (
        <div key={m.id_ProPer} className="relative flex items-center">
          {/* 📦 Tarjeta del modelo */}
          <div
            className={`snap-start flex-shrink-0 w-28 sm:w-32 md:w-40 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-110 ${
              modeloSeleccionado?.id_ProPer === m.id_ProPer
                ? "border-[#DC9C5C] shadow-lg"
                : "border-gray-300 hover:border-[#DC9C5C]"
            }`}
            onClick={() => {
              setModeloSeleccionado(m);
              setIdModeloSeleccionado(m.id_ProPer);
            }}
          >
            {/* contenedor imagen */}
            <div className="flex items-center justify-center h-26 sm:h-24 md:h-40 overflow-hidden rounded-t-xl bg-white p-2">
              <img
                src={m.ImagenPP}
                alt={m.nombreModelo}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="p-2 bg-white rounded-b-xl">
              <p className="text-center text-sm font-medium text-gray-800 truncate">
                {m.nombreModelo}
              </p>

              {modeloSeleccionado?.id_ProPer === m.id_ProPer && (
                <div className="absolute top-2 right-2 bg-[#DC9C5C] rounded-full p-1">
                  <FiCheck className="text-white text-xs" />
                </div>
              )}
            </div>
          </div>

          {/* 📝 Descripción del modelo (fuera del recuadro, a la derecha) */}
          {modeloSeleccionado?.id_ProPer === m.id_ProPer && m.descriptionPP && (
            <div className="ml-4 w-48 sm:w-56 md:w-64 bg-white border border-gray-300 rounded-lg shadow-md p-2 text-xs sm:text-sm text-gray-700">
              <p className="font-semibold text-[#7B2710] mb-1">Descripción:</p>
              <p className="whitespace-pre-wrap break-words">{m.descriptionPP}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
      <p className="text-yellow-700 font-medium">
        No hay modelos disponibles
        {categoriaSeleccionada &&
          categoriaSeleccionada !== "null" &&
          ` para la categoría "${categoriaSeleccionada}"`}
      </p>
    </div>
  )}
</div>

)}

          {/* 3. Selecciona los materiales - Solo visible cuando hay modelo seleccionado */}
          
          {modeloSeleccionado && (
            <div>
              <h2 className="text-xl font-semibold text-[#7B2710] mb-3">
                3. Selecciona los materiales
              </h2>
              
              {['metales', 'hilos', 'piedras'].map(tipo => {
                const lista = materiales[tipo];
                const tipoSimple = tipo.replace(/s$/, '');
                const seleccionado = materialesSeleccionados[tipoSimple];

                return (
                  Array.isArray(lista) && lista.length > 0 && (
                    <div key={tipo} className="mb-6">
                      <h3 className="text-lg font-semibold text-[#5b1c0e] mb-3 capitalize">
                        {tipo === 'metales' ? 'Metales' : tipo === 'hilos' ? 'Hilos' : 'Piedras'}
                      </h3>
                      
                        {!seleccionado ? (
                          <div className="flex overflow-x-auto space-x-3 pb-2">
                            {lista.map((mat) => (
                              <div
                                key={mat.id}
                                onClick={() => seleccionarMaterial(tipoSimple, mat)}
                                className="w-32 flex-shrink-0 bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[#DC9C5C]"
                              >
                                <div className="h-24 w-full mb-2 overflow-hidden rounded-lg">
                                  <img
                                    src={mat.imagen}
                                    alt={mat.nombre || mat.color}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <p className="text-center text-sm font-medium text-gray-800 truncate">
                                  {mat.nombre || mat.color}
                                </p>
                                <p className="text-center text-xs text-gray-600 mt-1">
                                  ${tipo === 'hilos' ? 
                                    ((mat.precioH || 0) / 10).toFixed(2) + '/m' : 
                                    ((mat.precioM || mat.precioP || 0) / 10).toFixed(2) + '/g'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (

                        <div className="bg-gradient-to-r from-[#fffaf5] to-[#f8f4f0] p-4 rounded-xl border border-[#DC9C5C]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 overflow-hidden rounded-lg">
                                <img 
                                  src={seleccionado.imagen} 
                                  alt={seleccionado.nombre || seleccionado.color} 
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {seleccionado.nombre || seleccionado.color}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {tipo === 'hilos' ? 'Metros: ' : 'Gramos: '}
                                  <span className="font-medium">{seleccionado.metros || seleccionado.gramos || 1}</span>
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              
                              <button 
                                  onClick={() => seleccionarMaterial(tipoSimple, null)}
                                  className="text-sm font-medium text-[#7B2710] hover:text-[#DC9C5C] px-3 py-1 rounded-lg border border-[#DC9C5C] hover:bg-[#fff7f2] transition-colors"
                                >
                                  Cambiar
                              </button>

                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                );
              })}
            </div>
          )}

          {/* Precio y tiempo de entrega - Solo visible cuando hay modelo seleccionado */}
          {modeloSeleccionado && (
            <>
              <div className="mt-6 p-4 bg-gradient-to-r from-[#fffaf5] to-[#f8f4f0] border border-[#DC9C5C] rounded-xl">
                <p className="text-lg font-bold text-[#7B2710]">
                  Precio Total: ${precioTotal.toFixed(2)}
                </p>
                <p className="text-[#7B2710] font-semibold">
                  Tiempo estimado de entrega: {modeloSeleccionado.tiempoEntrega} días
                </p>
              </div>

              <BotonAgregarCarrito
  producto={{
    id: `personalizado-${modeloSeleccionado?.id_ProPer}`,
    tipo: "personalizado",
    imagen: modeloSeleccionado?.ImagenPP,
    nombre: modeloSeleccionado?.nombreModelo,
    materiales: materialesSeleccionados,
    tiempoEntrega: modeloSeleccionado?.tiempoEntrega,
    precio: precioTotal,
    cantidad: cantidad,
    // 🔹 AGREGAR TALLA SI ES ANILLO
    categoria: categoriaSeleccionada,
    talla: categoriaSeleccionada === "Anillos" ? tallaSeleccionada : null
  }}
  deshabilitado={
    !modeloSeleccionado || 
    !materialesSeleccionados.metal ||
    // 🔹 AGREGAR VALIDACIÓN DE TALLA PARA ANILLOS
    (categoriaSeleccionada === "Anillos" && !tallaSeleccionada)
  }
   mensajeDeshabilitado={
    !modeloSeleccionado ? "Selecciona un modelo" :
    !materialesSeleccionados.metal ? "Selecciona todos los materiales" :
    (categoriaSeleccionada === "Anillos" && !tallaSeleccionada) ? "Selecciona una talla" :
    "No se puede agregar al carrito"
  }
/>
            </>
          )}

          <p className="mt-6 text-center text-[#7B2710] font-medium">
            Si no encuentras lo que buscas, contáctanos por WhatsApp y cotizamos el modelo que necesitas.
          </p>
        </div>
        
      </div>
    </div>
     </>
  );
}