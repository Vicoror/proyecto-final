"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft, Upload, X, Eye } from "lucide-react";

function isE164(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function PaginaBase() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [defaultMessage, setDefaultMessage] = useState("");
  const [helpEmail, setHelpEmail] = useState("");
  const [terminos, setTerminos] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  // Nuevos estados para la foto de tallas
  const [fotoTallasAnillos, setFotoTallasAnillos] = useState("");
  const [previewFoto, setPreviewFoto] = useState("");
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, [router]);

  // Cargar configuración inicial
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/whatsapp-config", { cache: "no-store" });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setPhone(data?.phone_e164 || "");
        setDefaultMessage(data?.default_message || "");
        setHelpEmail(data?.help || "");
        setTerminos(data?.terminos || "");
        setFotoTallasAnillos(data?.foto_tallas_anillos || "");
        setPreviewFoto(data?.foto_tallas_anillos || "");
      } catch (err) {
        console.error("Error cargando configuración de WhatsApp:", err);
      }
    })();
  }, []);

  // Validaciones para archivos de imagen
  const validarArchivo = (file) => {
    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (!extensionesPermitidas.includes(extension)) {
      setStatus("Solo se permiten archivos JPG, JPEG, PNG, WEBP o GIF");
      return false;
    }
    
    if (file.size > maxSize) {
      setStatus("El archivo no puede ser mayor a 2MB");
      return false;
    }
    
    return true;
  };

 // En tu componente, reemplaza la función manejarSubidaFoto por:

// En tu componente, modifica el manejo del preview:
const manejarSubidaFoto = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!validarArchivo(file)) {
    e.target.value = "";
    return;
  }

  setUploadingFoto(true);
  setStatus("");

  try {
    // Crear preview temporal local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewFoto(e.target.result); // Preview temporal
    };
    reader.readAsDataURL(file);

    // Subir a Cloudinary
    const formData = new FormData();
    formData.append('foto_tallas_anillos', file);

    const res = await fetch('/api/whatsapp-config', {
      method: 'PATCH',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error al subir la foto');
    }

    const data = await res.json();
    
    // IMPORTANTE: Actualizar con la URL real de Cloudinary
    setFotoTallasAnillos(data.url);
    setPreviewFoto(data.url); // Reemplazar preview temporal con URL real
    setStatus("Foto subida correctamente");

  } catch (error) {
    console.error("Error subiendo foto:", error);
    setStatus(error.message || "Error al subir la foto");
    setPreviewFoto("");
    setFotoTallasAnillos("");
  } finally {
    setUploadingFoto(false);
    e.target.value = "";
  }
};

// Y la función eliminarFoto por:
const eliminarFoto = async () => {
  try {
    const res = await fetch('/api/whatsapp-config', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: fotoTallasAnillos }) // Necesitarías guardar el public_id también
    });

    if (!res.ok) throw new Error('Error al eliminar la foto');

    setFotoTallasAnillos("");
    setPreviewFoto("");
    setStatus("Foto eliminada correctamente");
  } catch (error) {
    console.error("Error eliminando foto:", error);
    setStatus("Error al eliminar la foto");
  }
};

  const onSave = async (e) => {
    e.preventDefault();
    setStatus("");

    const trimmedPhone = (phone || "").trim();
    const trimmedEmail = (helpEmail || "").trim();
    const trimmedTerminos = (terminos || "").trim();

    // Validaciones existentes (sin modificar)
    if (!isE164(trimmedPhone)) {
      setStatus("El teléfono debe estar en formato E.164, ej. +5215512345678");
      return;
    }

    if (trimmedEmail.length > 65) {
      setStatus("El correo de ayuda no puede superar 65 caracteres");
      return;
    }

    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setStatus("El correo de ayuda no es válido");
      return;
    }

    if (trimmedTerminos.length === 0) {
      setStatus("El campo de términos no puede estar vacío");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/whatsapp-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_e164: trimmedPhone,
          default_message: (defaultMessage || "").trim(),
          help: trimmedEmail || null,
          terminos: trimmedTerminos,
          foto_tallas_anillos: fotoTallasAnillos, // Nuevo campo
          updated_by: "admin",
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");
      setStatus("Guardado ✔");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo guardar");
    } finally {
      setSaving(false);
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
            aria-label="Volver"
          >
            <ArrowLeft className="mr-2" size={30} />
            Anterior
          </button>
        </div>

        <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">
            Configurar Chat de WhatsApp
          </h2>

          <form onSubmit={onSave} className="space-y-4">
            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono (E.164)</label>
              <input
                type="text"
                className="w-full rounded-xl border border-[#7B2710] p-2"
                placeholder="+5215512345678"
                value={phone}
                onChange={(e) => {
                  const cleanedValue = e.target.value
                    .replace(/[^0-9+]/g, "")
                    .replace(/(?!^)\+/g, "")
                    .slice(0, 16);
                  setPhone(cleanedValue);
                }}
                aria-label="Teléfono en formato E.164"
              />
              <p className="text-xs text-gray-600 mt-1">
                {phone.length} / 16 caracteres - Ejemplo México móvil: +52155XXXXXXXX
              </p>
            </div>

            {/* Mensaje por defecto */}
            <div>
              <label className="block text-sm font-medium mb-1">Mensaje por defecto</label>
              <textarea
                className="w-full rounded-xl border border-[#7B2710] p-2"
                rows={3}
                placeholder="Hola, me interesa..."
                value={defaultMessage}
                onChange={(e) => {
                  const sanitizedValue = e.target.value.replace(/[<>{}[\]]/g, "");
                  if (sanitizedValue.length <= 100) {
                    setDefaultMessage(sanitizedValue);
                  } else {
                    setDefaultMessage(sanitizedValue.slice(0, 100));
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">{defaultMessage.length} / 100 caracteres</p>
            </div>

            {/* Correo de ayuda */}
            <div>
                <label className="block text-sm font-medium mb-1">Correo de ayuda</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-[#7B2710] p-2"
                  value={helpEmail}
                  placeholder="correo@ejemplo.com"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '').slice(0, 65);
                    setHelpEmail(value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ') e.preventDefault();
                  }}
                />
                
                {!helpEmail && defaultMessage && (
                  <p className="text-xs text-gray-400 mt-1">{defaultMessage}</p>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  {helpEmail && !isValidEmail(helpEmail) && "Correo no válido"}{" "}
                </p>
                
                <p className="text-xs text-gray-500 mt-1">{helpEmail.length} / 65 caracteres</p>
              </div>

            {/* Términos y condiciones */}
            <div>
              <label className="block text-sm font-medium mb-1">Términos y condiciones</label>
              <textarea
                className="w-full rounded-xl border border-[#7B2710] p-2"
                rows={5}
                placeholder="Escribe los términos y condiciones..."
                value={terminos}
                onChange={(e) => {
                  let sanitized = e.target.value.replace(/[<>{}[\]]/g, "");
                  if (sanitized.length > 5000) sanitized = sanitized.slice(0, 5000);
                  setTerminos(sanitized);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">{terminos.length} / 5000 caracteres</p>
              {terminos.trim().length === 0 && <p className="text-red-500 text-xs mt-1">El campo no puede estar vacío</p>}
            </div>

            {/* NUEVO: Foto de Tallas de Anillos */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Foto de Tallas de Anillos
              </label>
              
              {/* Preview de la foto */}
              {/* En tu JSX, mejora el preview: */}
              {previewFoto && (
                <div className="mb-3 relative inline-block">
                  <div className="relative group">
                    <img 
                      src={previewFoto} 
                      alt="Preview de tallas de anillos"
                      className="w-32 h-32 object-cover rounded-lg border border-[#7B2710] bg-gray-100"
                      onError={(e) => {
                        console.error('Error cargando imagen:', previewFoto);
                        e.target.style.display = 'none';
                      }}
                      onLoad={(e) => {
                        console.log('Imagen cargada correctamente');
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                      <button
                        type="button"
                        onClick={eliminarFoto}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  {/* Debug info */}
                  <p className="text-xs text-gray-500 mt-1 truncate max-w-32">
                    {previewFoto.includes('data:') ? 'Preview temporal' : 'Imagen guardada'}
                  </p>
                </div>
              )}

              {/* Input para subir archivo */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 bg-white border border-[#7B2710] rounded-xl px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload size={18} />
                  {uploadingFoto ? "Subiendo..." : "Seleccionar Foto"}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    onChange={manejarSubidaFoto}
                    disabled={uploadingFoto}
                    className="hidden"
                  />
                </label>
                
                {fotoTallasAnillos && (
                  <span className="text-sm text-green-600">✓ Foto cargada</span>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-1">
                Formatos permitidos: JPG, JPEG, PNG, WEBP, GIF | Máx. 2MB
              </p>
            </div>

            {/* Botón guardar */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || uploadingFoto}
                className="rounded-xl border border-[#7B2710] px-4 py-2 hover:bg-[#8C9560] disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>

            {status && <div className="text-sm mt-2">{status}</div>}
          </form>
        </section>
      </main>
    </div>
  );
}