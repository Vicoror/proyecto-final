"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft } from "lucide-react";
import axios from "axios";

export default function PaginaBase() {
  const router = useRouter();

  const [inputs, setInputs] = useState({
    imagen1: null,
    enlace1: "",
    activar1: false,
    fechaInicio1: "",
    fechaFin1: "",
    imagen2: null,
    enlace2: "",
    activar2: false,
    fechaInicio2: "",
    fechaFin2: "",
    imagen3: null,
    enlace3: "",
    activar3: false,
    fechaInicio3: "",
    fechaFin3: "",
    imagen4: null,
    enlace4: "",
    activar4: false,
    fechaInicio4: "",
    fechaFin4: "",
    imagen5: null,
    enlace5: "",
    activar5: false,
    fechaInicio5: "",
    fechaFin5: "",
    video: null,
    enlaceVideo: "",
    activarVideo: false,
    fechaInicioVideo: "",
    fechaFinVideo: "",
    previews: {
      imagen1: null,
      imagen2: null,
      imagen3: null,
      imagen4: null,
      imagen5: null,
      video: null,
    },
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [erroresArchivos, setErroresArchivos] = useState({
    imagen1: "",
    imagen2: "",
    imagen3: "",
    imagen4: "",
    imagen5: "",
    video: ""
  });

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
      return;
    }

    const obtenerPublicidad = async () => {
      try {
        const res = await fetch("/api/publicidad?admin=1");
        const data = await res.json();

        const nuevosInputs = {
          imagen1: null,
          enlace1: "",
          activar1: false,
          fechaInicio1: "",
          fechaFin1: "",
          imagen2: null,
          enlace2: "",
          activar2: false,
          fechaInicio2: "",
          fechaFin2: "",
          imagen3: null,
          enlace3: "",
          activar3: false,
          fechaInicio3: "",
          fechaFin3: "",
          imagen4: null,
          enlace4: "",
          activar4: false,
          fechaInicio4: "",
          fechaFin4: "",
          imagen5: null,
          enlace5: "",
          activar5: false,
          fechaInicio5: "",
          fechaFin5: "",
          video: null,
          enlaceVideo: "",
          activarVideo: false,
          fechaInicioVideo: "",
          fechaFinVideo: "",
          previews: {
            imagen1: null,
            imagen2: null,
            imagen3: null,
            imagen4: null,
            imagen5: null,
            video: null,
          },
        };

        let i = 1;
    data.forEach((item) => {
      if (item.tipo === "imagen" && i <= 5) {
        nuevosInputs[`enlace${i}`] = item.enlace || "";
        // Conversión robusta a booleano
        nuevosInputs[`activar${i}`] = Boolean(Number(item.activar));
        nuevosInputs[`fechaInicio${i}`] = item.fechaInicio ? item.fechaInicio.split('T')[0] : "";
        nuevosInputs[`fechaFin${i}`] = item.fechaFin ? item.fechaFin.split('T')[0] : "";
        nuevosInputs.previews[`imagen${i}`] = item.url;
        i++;
      } else if (item.tipo === "video") {
        nuevosInputs.enlaceVideo = item.enlace || "";
        nuevosInputs.activarVideo = Boolean(Number(item.activar));
        nuevosInputs.fechaInicioVideo = item.fechaInicio ? item.fechaInicio.split('T')[0] : "";
        nuevosInputs.fechaFinVideo = item.fechaFin ? item.fechaFin.split('T')[0] : "";
        nuevosInputs.previews.video = item.url;
      }
    });

    setInputs(nuevosInputs);
  } catch (err) {
    console.error("Error al obtener publicidad", err);
  }
};

    obtenerPublicidad();
  }, [router]);

  const validarArchivo = (file, tipoEsperado, campo) => {
    if (!file) return true;
    
    const tiposImagen = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const tiposVideo = ['video/mp4', 'video/webm', 'video/ogg'];
    
    const tiposPermitidos = tipoEsperado === 'imagen' ? tiposImagen : tiposVideo;
    
    if (!tiposPermitidos.includes(file.type)) {
      setErroresArchivos(prev => ({
        ...prev,
        [campo]: `Formato no válido. Por favor suba un archivo ${tipoEsperado === 'imagen' ? 'de imagen (JPEG, PNG, GIF, WEBP)' : 'de video (MP4, WEBM, OGG)'}`
      }));
      return false;
    }
    
    setErroresArchivos(prev => ({
      ...prev,
      [campo]: ""
    }));
    return true;
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      const tipoEsperado = name === 'video' ? 'video' : 'imagen';
      if (!validarArchivo(file, tipoEsperado, name)) {
        return;
      }
    }

    setInputs((prev) => ({ 
      ...prev, 
      [name]: file,
      previews: {
        ...prev.previews,
        [name]: file ? URL.createObjectURL(file) : prev.previews[name]
      }
    }));
  };

  const sanitizarEnlace = (enlace) => {
    return enlace.replace(/[<>"'`]/g, "");
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('enlace')) {
      if (value.length > 60) {
        setMensaje("❌ El enlace no puede exceder 60 caracteres");
        return;
      }
      
      const enlaceSanitizado = sanitizarEnlace(value);
      setInputs((prev) => ({ 
        ...prev, 
        [name]: enlaceSanitizado 
      }));
    } else if (name.startsWith('activar')) {
      setInputs((prev) => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setInputs((prev) => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
    
    setMensaje("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);

    // Validar formatos de archivo antes de enviar
    let archivosValidos = true;
    
    for (let i = 1; i <= 5; i++) {
      const campo = `imagen${i}`;
      if (inputs[campo] && !validarArchivo(inputs[campo], 'imagen', campo)) {
        archivosValidos = false;
      }
    }
    
    if (inputs.video && !validarArchivo(inputs.video, 'video', 'video')) {
      archivosValidos = false;
    }
    
    if (!archivosValidos) {
      setLoading(false);
      return;
    }

    const form = new FormData();

    // Agregar todos los campos al FormData
    Object.entries(inputs).forEach(([key, value]) => {
      if (value !== null && value !== undefined && key !== 'previews') {
        if (key.startsWith('activar')) {
          form.append(key, value ? '1' : '0');
        } else if (value instanceof File) {
          form.append(key, value);
        } else {
          form.append(key, value);
        }
      }
    });

    try {
      const response = await axios.put("/api/publicidad", form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Actualizar las previews con las URLs devueltas por el servidor
      if (response.data && response.data.urls) {
        setInputs(prev => ({
          ...prev,
          previews: {
            ...prev.previews,
            ...response.data.urls
          }
        }));
      }
      
      setMensaje("✅ Publicidad actualizada correctamente.");
    } catch (err) {
      console.error("Error al actualizar publicidad:", err.response?.data || err.message);
      setMensaje("❌ Error al actualizar la publicidad.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div
    className="min-h-screen bg-cover bg-center bg-no-repeat relative"
    style={{ backgroundImage: "url('/fondo.png')" }}
  >
    <div className="absolute inset-0 bg-black/50 z-0" />
    <NavegadorAdmin />
    <main className="relative z-10 px-2 sm:px-0 pt-20 pb-8 w-full max-w-[99.5vw] mx-auto">
      <div className="w-full max-w-[99.5vw] max-w-5xl mx-auto mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-white hover:text-[#F5F1F1] transition-colors"
        >
          <ArrowLeft className="mr-2" size={30} />
          Anterior
        </button>
      </div>

      <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Editar Publicidad</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex flex-col gap-2 border border-gray-300 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <label className="text-[#762114] font-semibold">Imagen {n}</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`activar${n}`}
                    name={`activar${n}`}
                    checked={inputs[`activar${n}`]}
                    onChange={handleInputChange}
                    className="mr-2 h-5 w-5"
                  />
                  <label htmlFor={`activar${n}`} className="text-sm">Activar</label>
                </div>
              </div>

              {inputs[`activar${n}`] && inputs.previews?.[`imagen${n}`] && (
                <div className="mb-2">
                  <img
                    src={inputs.previews[`imagen${n}`]}
                    alt={`Vista previa imagen ${n}`}
                    className="w-full max-w-[150px] h-auto border border-gray-300 rounded-md"
                  />
                </div>
              )}

              <input
                type="file"
                name={`imagen${n}`}
                accept="image/*"
                onChange={handleFileChange}
                className="border border-gray-300 rounded p-2 bg-white text-sm"
              />
              {erroresArchivos[`imagen${n}`] && (
                <p className="text-red-500 text-xs">{erroresArchivos[`imagen${n}`]}</p>
              )}
              <input
                type="text"
                name={`enlace${n}`}
                value={inputs[`enlace${n}`]}
                onChange={handleInputChange}
                placeholder="Enlace (opcional, max 60 caracteres)"
                maxLength={60}
                className="border border-gray-300 rounded p-2 bg-white text-sm"
              />
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    name={`fechaInicio${n}`}
                    value={inputs[`fechaInicio${n}`]}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 bg-white w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    name={`fechaFin${n}`}
                    value={inputs[`fechaFin${n}`]}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 bg-white w-full text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-2 md:col-span-2 border border-gray-300 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <label className="text-[#762114] font-semibold">Video</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activarVideo"
                  name="activarVideo"
                  checked={inputs.activarVideo}
                  onChange={handleInputChange}
                  className="mr-2 h-5 w-5"
                />
                <label htmlFor="activarVideo" className="text-sm">Activar</label>
              </div>
            </div>

            {inputs.activarVideo && inputs.previews?.video && (
              <div className="mb-2">
                <video
                  src={inputs.previews.video}
                  controls
                  className="w-full max-w-md h-auto border border-gray-300 rounded-md"
                />
              </div>
            )}

            <input
              type="file"
              name="video"
              accept="video/*"
              onChange={handleFileChange}
              className="border border-gray-300 rounded p-2 bg-white text-sm"
            />
            {erroresArchivos.video && (
              <p className="text-red-500 text-xs">{erroresArchivos.video}</p>
            )}
            <input
              type="text"
              name="enlaceVideo"
              value={inputs.enlaceVideo}
              onChange={handleInputChange}
              placeholder="Enlace del video (opcional, max 60 caracteres)"
              maxLength={60}
              className="border border-gray-300 rounded p-2 bg-white text-sm"
            />
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  name="fechaInicioVideo"
                  value={inputs.fechaInicioVideo}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded p-2 bg-white w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  name="fechaFinVideo"
                  value={inputs.fechaFinVideo}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded p-2 bg-white w-full text-sm"
                />
              </div>
            </div>
          </div>
            
          <div className="md:col-span-2 flex flex-col items-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#7B2710] text-white px-6 py-2 rounded-lg hover:bg-[#5e1d0a] transition-all disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
            {mensaje && (
              <p className="mt-4 text-center text-sm text-[#7B2710] font-semibold">{mensaje}</p>
            )}
          </div>
        </form>
      </section>
    </main>
  </div>
);
 }