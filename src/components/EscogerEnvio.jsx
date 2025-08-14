"use client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function EscogerEnvio({ onEnvioSeleccionado }) {
  const [envios, setEnvios] = useState([]);
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarTodos, setMostrarTodos] = useState(true);

  useEffect(() => {
    const fetchEnvios = async () => {
      try {
        const response = await fetch('/api/envios');
        const data = await response.json();
        
        if (response.ok) {
          // Filtrar y asegurar que precio_envio sea número
          const enviosActivos = data
            .filter(envio => envio.activar_envio)
            .map(envio => ({
              ...envio,
              precio_envio: Number(envio.precio_envio) || 0
            }));
          setEnvios(enviosActivos);
        } else {
          throw new Error(data.message || 'Error al obtener envíos');
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvios();
  }, []);

  const handleSeleccion = (envio) => {
    setEnvioSeleccionado(envio.id_envio);
    setMostrarTodos(false);
    if (onEnvioSeleccionado) {
      onEnvioSeleccionado(envio);
    }
  };

  const toggleMostrarTodos = () => {
    setMostrarTodos(!mostrarTodos);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p>Cargando opciones de envío...</p>
      </div>
    );
  }

  if (envios.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              No hay métodos de envío disponibles en este momento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="display: grid gap-3">
        {envios.map((envio) => (
          (mostrarTodos || envioSeleccionado === envio.id_envio) && (
            <div 
              key={envio.id_envio}
              onClick={() => handleSeleccion(envio)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                envioSeleccionado === envio.id_envio 
                  ? 'border-[#762114] bg-[#F5F1F1] shadow-md' 
                  : 'border-gray-300 hover:border-[#762114]/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{envio.descripcion_envio}</h4>
                </div>
                <span className="font-bold text-[#762114]">
                  ${envio.precio_envio.toFixed(2)}
                </span>
              </div>
              
              <div className="mt-4 flex items-center">
                <input
                  type="radio"
                  checked={envioSeleccionado === envio.id_envio}
                  onChange={() => handleSeleccion(envio)}
                  className="h-4 w-4 text-[#762114] border-gray-300 focus:ring-[#762114]"
                />
                <label className="ml-2 block text-sm font-medium text-gray-700">
                  Seleccionar esta opción
                </label>
              </div>
            </div>
          )
        ))}
      </div>

      {!mostrarTodos && (
        <button
          onClick={toggleMostrarTodos}
          className="mt-2 text-sm text-[#762114] font-medium hover:underline"
        >
          Mostrar todas las opciones de envío
        </button>
      )}
    </div>
  );
}