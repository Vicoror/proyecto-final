"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft } from "lucide-react";

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
      } catch (err) {
        console.error("Error cargando configuración de WhatsApp:", err);
      }
    })();
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setStatus("");

    const trimmedPhone = (phone || "").trim();
    const trimmedEmail = (helpEmail || "").trim();
    const trimmedTerminos = (terminos || "").trim();

    // Validaciones
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
                  value={helpEmail} // valor editable por el usuario
                  placeholder="correo@ejemplo.com"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '').slice(0, 65); // sin espacios, max 65
                    setHelpEmail(value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ') e.preventDefault(); // evita espacios
                  }}
                />
                
                {/* Mensaje por defecto si el input está vacío */}
                {!helpEmail && defaultMessage && (
                  <p className="text-xs text-gray-400 mt-1">{defaultMessage}</p>
                )}

                {/* Validaciones */}
                <p className="text-xs text-gray-500 mt-1">
                  {helpEmail && !isValidEmail(helpEmail) && "Correo no válido"}{" "}
                </p>
                
                {/* Contador de caracteres */}
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

            {/* Botón guardar */}
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl border border-[#7B2710] px-4 py-2 hover:bg-[#8C9560] disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>

            {status && <div className="text-sm mt-2">{status}</div>}
          </form>
        </section>
      </main>
    </div>
  );
}
