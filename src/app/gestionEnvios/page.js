"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PaginaBase() {
  const router = useRouter();
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    } else {
      fetchEnvios();
    }
  }, []);

  const fetchEnvios = async () => {
    try {
      const response = await fetch('/api/envios');
      const data = await response.json();
      if (response.ok) {
        // Si no hay datos, inicializar con valores por defecto
        if (data.length === 0) {
          const defaultEnvios = Array(5).fill().map((_, i) => ({
            id_envio: i + 1,
            descripcion_envio: '',
            precio_envio: 0,
            activar_envio: false
          }));
          setEnvios(defaultEnvios);
        } else {
          setEnvios(data);
        }
      } else {
        throw new Error(data.message || 'Error al obtener envíos');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDescripcionChange = (index, value) => {
    // Validar solo letras, números, espacios, acentos, puntuación básica y paréntesis
    const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,;:¿?¡!()]*$/;
    
    if (value.length <= 150 && (regex.test(value) || value === '')) {
      const newEnvios = [...envios];
      newEnvios[index].descripcion_envio = value;
      setEnvios(newEnvios);
    }
  };

  const handlePrecioChange = (index, value) => {
    // Validar que sea número entre 0 y 500
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 500 && value.length <= 3) {
      const newEnvios = [...envios];
      newEnvios[index].precio_envio = numValue;
      setEnvios(newEnvios);
    } else if (value === '') {
      const newEnvios = [...envios];
      newEnvios[index].precio_envio = "";
      setEnvios(newEnvios);
    }
  };

  const handleToggleActivo = (index) => {
    const newEnvios = [...envios];
    newEnvios[index].activar_envio = !newEnvios[index].activar_envio;
    setEnvios(newEnvios);
  };

  const handleSubmit = async (index) => {
    const loadingToast = toast.loading('Guardando cambios...');
    
    try {
      const envioToUpdate = envios[index];
      const response = await fetch(`/api/envios?id=${envioToUpdate.id_envio}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envioToUpdate),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al actualizar');

      // Actualizar el estado con los datos devueltos por el servidor
      const newEnvios = [...envios];
      newEnvios[index] = data.data;
      setEnvios(newEnvios);

      toast.success('Cambios guardados correctamente', {
        id: loadingToast,
      });
    } catch (error) {
      toast.error(error.message, {
        id: loadingToast,
      });
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
        
        {/* Sección de editar publicidad expandida */}
        <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Gestión de envios</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Cargando...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {envios.map((envio, index) => (
                <div key={envio.id_envio} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción del envío {envio.id_envio} (máx. 150 caracteres)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#762114]"
                      rows="3"
                      value={envio.descripcion_envio}
                      onChange={(e) => handleDescripcionChange(index, e.target.value)}
                      maxLength="150"
                    />
                    <p className="text-xs text-gray-500 text-right">
                      {envio.descripcion_envio.length}/150 caracteres
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 items-center mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio (0-500 MXN)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2">$</span>
                        <input
                          type="number"
                          className="pl-8 w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#762114]"
                          value={envio.precio_envio}
                          onChange={(e) => handlePrecioChange(index, e.target.value)}
                          min="0"
                          max="500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={envio.activar_envio}
                          onChange={() => handleToggleActivo(index)}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#762114]/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#762114]"></div>
                        <span className="ms-3 text-sm font-medium text-gray-700">
                          {envio.activar_envio ? 'Activado' : 'Desactivado'}
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleSubmit(index)}
                    className="px-4 py-2 bg-[#762114] text-white rounded-md hover:bg-[#5a1a10] transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}