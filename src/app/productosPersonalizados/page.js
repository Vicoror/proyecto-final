"use client";

import { useEffect, useState } from "react";
import { FiUser, FiHome } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import BotonAgregarCarrito from "@/components/BotonAgregarCarrito";
import IconoCarrito from "@/components/IconoCarrito";


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

            // Inicia en 0 en lugar de incluir PrecioManoObra directamente
        let total = 0; 

        // Suma el precio base (que ya incluye mano de obra internamente)
        if (modeloSeleccionado.PrecioManoObra) {
          total += parseFloat(modeloSeleccionado.PrecioManoObra) || 0;
        }

    // Calcular precio para cada material seleccionado
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

  const aumentarCantidad = (tipo) => {
    setMaterialesSeleccionados(prev => {
      const material = prev[tipo];
      if (!material) return prev;
      
      const nuevoMaterial = { ...material };
      
      if (tipo === 'hilo') {
        nuevoMaterial.metros = (nuevoMaterial.metros || 1) + 1;
      } else {
        nuevoMaterial.gramos = (nuevoMaterial.gramos || 1) + 1;
      }
      
      return {
        ...prev,
        [tipo]: nuevoMaterial
      };
    });
  };

  const disminuirCantidad = (tipo) => {
    setMaterialesSeleccionados(prev => {
      const material = prev[tipo];
      if (!material) return prev;
      
      const nuevoMaterial = { ...material };
      
      if (tipo === 'hilo') {
        nuevoMaterial.metros = Math.max(1, (nuevoMaterial.metros || 1) - 1);
      } else {
        nuevoMaterial.gramos = Math.max(1, (nuevoMaterial.gramos || 1) - 1);
      }
      
      return {
        ...prev,
        [tipo]: nuevoMaterial
      };
    });
  };

  const modelosFiltrados = categoriaSeleccionada
    ? modelos.filter(m => m.categoria === categoriaSeleccionada)
    : modelos;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4 sm:p-6 relative"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      <div className="absolute inset-0 bg-white opacity-70"></div>

      <div className="relative z-10">
        <header className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center">
            <h1
              className="text-3xl md:text-4xl font-bold text-[#7B2710]"
              style={{ fontFamily: "Alex Brush" }}
            >
              Bernarda Sierra
            </h1>
            <FiHome className="ml-2 text-[#7B2710] text-2xl" />
          </Link>

          {/* Alineación de íconos */}
          <div className="flex items-center gap-4">
            <div className="relative group">
            <Link href="/login" className="text-[#7B2710] hover:text-[#DC9C5C] flex items-center">
              <FiUser className="text-2xl" />
            </Link>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#DC9C5C] text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              Iniciar sesión
            </div>
            </div>
            {/* IconoCarrito también alineado */}
            <div className="flex items-center text-[#7B2710] hover:text-[#DC9C5C]">
              <IconoCarrito />
            </div>
          </div>
        </header>



        <div className="bg-[#F5F1F1] p-6 rounded-2xl shadow-xl space-y-6 border-5 border-[#7B2710]">
          <h2 className="text-xl font-semibold text-[#7B2710]">1. Selecciona una categoría</h2>
          <select
            className="w-full p-2 border rounded"
            value={categoriaSeleccionada}
            onChange={e => setCategoriaSeleccionada(e.target.value)}
          >
            
            {categorias.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <h2 className="text-xl font-semibold text-[#7B2710]">2. Escoge un modelo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modelosFiltrados.map(m => (
              <div
                key={m.id_ProPer}
                className={`border p-2 rounded cursor-pointer ${
                  modeloSeleccionado?.id_ProPer === m.id_ProPer ? 'border-[#DC9C5C]' : 'border-gray-300'
                }`}
                onClick={() => {
                  setModeloSeleccionado(m);
                  setIdModeloSeleccionado(m.id_ProPer);
                }}
              >
                <img src={m.ImagenPP} alt={m.nombreModelo} className="w-full h-32 object-cover rounded" />
                <p className="text-center text-sm mt-2">{m.nombreModelo}</p>
              </div>
            ))}
          </div>
              <><h2 className="text-xl font-semibold text-[#7B2710]">
                  3. Selecciona los materiales
              </h2></>
          {/* 3. Materiales personalizados */}
          {modeloSeleccionado && (
            <>
              {['metales', 'hilos', 'piedras'].map(tipo => {
                const lista = materiales[tipo];
                const tipoSimple = tipo.replace(/s$/, ''); // Convierte "metales" a "metal", etc.
                const seleccionado = materialesSeleccionados[tipoSimple];

                return (
                      
                  Array.isArray(lista) && lista.length > 0 && (
                    <div key={tipo}>
                      <h3 className="mt-4 mb-2 capitalize text-[#5b1c0e] text-lg">
                        {tipo} {seleccionado && `- Seleccionado: ${seleccionado.nombre || seleccionado.color}`}
                      </h3>
                      {!seleccionado ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {lista.map((mat) => (
                            <div
                              key={mat.id}
                              onClick={() => seleccionarMaterial(tipoSimple, mat)}
                              className="border p-2 rounded shadow hover:shadow-md transition cursor-pointer hover:bg-gray-100"
                            >
                              <img
                                src={mat.imagen}
                                alt={mat.nombre || mat.color}
                                className="w-full h-24 object-cover rounded"
                              />
                              <p className="text-center text-sm mt-1 text-gray-800">
                                {mat.nombre || mat.color}
                              </p>
                              <p className="text-center text-xs text-gray-600 mt-1">
                                Precio: ${tipo === 'hilos' ? 
                                  ((mat.precioH || 0) / 10).toFixed(2) + '/m' : 
                                  ((mat.precioM || mat.precioP || 0) / 10).toFixed(2) + '/g'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow">
                          <div className="flex items-center">
                            <img 
                              src={seleccionado.imagen} 
                              alt={seleccionado.nombre || seleccionado.color} 
                              className="w-16 h-16 object-cover rounded mr-3"
                            />
                            <div>
                              <p className="font-medium">{seleccionado.nombre || seleccionado.color}</p>
              
                            </div>
                          </div>
          
                          <button 
                            onClick={() => seleccionarMaterial(tipoSimple, null)}
                            className="ml-4 text-red-500 hover:text-red-700"
                          >
                            Cambiar
                          </button>
                        </div>
                      )}
                    </div>
                  )  
                  
                );
              })}
            </>
          )}

          {/* Precio y tiempo de entrega */}
          <div className="mt-6 p-4 bg-[#fffaf5] border border-[#DC9C5C] rounded">
            <p className="text-lg font-bold text-[#7B2710]">
              Precio Total: ${precioTotal.toFixed(2)}
            </p>
            {modeloSeleccionado && (
              <p className="text-[#7B2710] font-semibold">
                Tiempo estimado de entrega: {modeloSeleccionado.tiempoEntrega} días
              </p>
            )}
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
              cantidad: cantidad // aquí se envía la cantidad seleccionada
            }}
            deshabilitado={!modeloSeleccionado || !materialesSeleccionados.metal}
          />


          

          <p className="mt-6 text-center text-[#7B2710] font-medium">
            Si no encuentras lo que buscas, contáctanos por WhatsApp y cotizamos el modelo que necesitas.
          </p>
        </div>
      </div>
    </div>
  );
}