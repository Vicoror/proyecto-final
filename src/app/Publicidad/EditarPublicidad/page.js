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
    imagen2: null,
    enlace2: "",
    imagen3: null,
    enlace3: "",
    imagen4: null,
    enlace4: "",
    imagen5: null,
    enlace5: "",
    video: null,
    enlaceVideo: "",
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

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
      return;
    }

    const obtenerPublicidad = async () => {
      try {
        const res = await fetch("/api/publicidad");
        const data = await res.json();

        const nuevosInputs = {
          imagen1: null,
          enlace1: "",
          imagen2: null,
          enlace2: "",
          imagen3: null,
          enlace3: "",
          imagen4: null,
          enlace4: "",
          imagen5: null,
          enlace5: "",
          video: null,
          enlaceVideo: "",
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
            nuevosInputs.previews[`imagen${i}`] = item.url;
            i++;
          } else if (item.tipo === "video") {
            nuevosInputs.enlaceVideo = item.enlace || "";
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

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setInputs((prev) => ({ ...prev, [name]: files[0] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);

    const form = new FormData();

    Object.entries(inputs).forEach(([key, value]) => {
      if (value) form.append(key, value);
    });

    try {
      await axios.put("/api/publicidad", form);
      setMensaje("✅ Publicidad actualizada correctamente.");
    } catch (err) {
      console.error(err);
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
              <div key={n} className="flex flex-col gap-2">
                <label className="text-[#762114] font-semibold">Imagen {n}</label>
                <input
                  type="file"
                  name={`imagen${n}`}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="border border-gray-300 rounded p-2 bg-white"
                />
                <input
                  type="text"
                  name={`enlace${n}`}
                  value={inputs[`enlace${n}`]}
                  onChange={handleInputChange}
                  placeholder="Enlace (opcional)"
                  className="border border-gray-300 rounded p-2 bg-white"
                />
                {inputs.previews?.[`imagen${n}`] && (
                  <img
                    src={inputs.previews[`imagen${n}`]}
                    alt={`Imagen ${n}`}
                    className="w-full max-w-[150px] h-auto border border-gray-400 rounded-md mt-2"
                  />
                )}
              </div>
            ))}

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[#762114] font-semibold">Video</label>
              <input
                type="file"
                name="video"
                accept="video/*"
                onChange={handleFileChange}
                className="border border-gray-300 rounded p-2 bg-white"
              />
              <input
                type="text"
                name="enlaceVideo"
                value={inputs.enlaceVideo}
                onChange={handleInputChange}
                placeholder="Enlace del video (opcional)"
                className="border border-gray-300 rounded p-2 bg-white"
              />
              {inputs.previews?.video && (
                <video
                  src={inputs.previews.video}
                  controls
                  className="w-full max-w-md h-auto border border-gray-400 rounded-md mt-2"
                />
              )}
            </div>

            <div className="md:col-span-2 flex flex-col items-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#7B2710] text-white px-6 py-2 rounded-lg hover:bg-[#5e1d0a] transition-all"
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
