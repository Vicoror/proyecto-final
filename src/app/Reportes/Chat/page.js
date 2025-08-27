"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft } from "lucide-react";

function isE164(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export default function PaginaBase() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [defaultMessage, setDefaultMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  // Protección de ruta
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/whatsapp-config", { cache: "no-store" });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setPhone(data?.phone_e164 || "");
        setDefaultMessage(data?.default_message || "");
      } catch (err) {
        console.error("Error cargando configuración de WhatsApp:", err);
      }
    })();
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setStatus("");

    const trimmedPhone = (phone || "").trim();

    if (!isE164(trimmedPhone)) {
      setStatus("El teléfono debe estar en formato E.164, ej. +5215512345678");
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
      {/* Capa oscura para mejorar contraste */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      <NavegadorAdmin />

      {/* Contenedor principal con márgenes y padding ajustados */}
      <main className="relative z-10 px-2 sm:px-0 pt-20 pb-8 w-full max-w-[99.5vw] mx-auto">
        {/* Flecha de retroceso posicionada debajo del navegador */}
        <div className="w-full max-w-5xl mx-auto mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-[#F5F1F1] transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="mr-2" size={30} />
            Anterior
          </button>
        </div>

        {/* Sección de editar chat */}
        <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Configurar Chat de WhatsApp</h2>

          <form onSubmit={onSave} className="space-y-4">
            <div>
            <label className="block text-sm font-medium mb-1">Teléfono (E.164)</label>
            <input
              type="text"
              className="w-full rounded-xl border border-[#7B2710] p-2"
              placeholder="+5215512345678"
              value={phone}
              onChange={(e) => {
                // Permitir solo números y el signo + al inicio
                const cleanedValue = e.target.value
                  .replace(/[^0-9+]/g, '') // Eliminar todo excepto números y +
                  .replace(/(?!^)\+/g, '') // Eliminar todos los + que no estén al inicio
                  .slice(0, 16); // Limitar a 16 caracteres
                
                setPhone(cleanedValue);
              }}
              aria-label="Teléfono en formato E.164"
            />
            <p className="text-xs text-gray-600 mt-1">
              {phone.length} / 16 caracteres - Ejemplo México móvil: +52155XXXXXXXX
            </p>
          </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mensaje por defecto (opcional)</label>
              <textarea
                className="w-full rounded-xl border border-[#7B2710] p-2"
                rows={3}
                placeholder="Hola, me interesa..."
                value={defaultMessage}
                onChange={(e) => {
                  // Restringir caracteres especiales peligrosos
                  const sanitizedValue = e.target.value.replace(/[<>{}[\]]/g, '');
                  
                  // Limitar a 100 caracteres
                  if (sanitizedValue.length <= 100) {
                    setDefaultMessage(sanitizedValue);
                  } else {
                    // Si supera 100 caracteres, mantener solo los primeros 100
                    setDefaultMessage(sanitizedValue.slice(0, 100));
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                {defaultMessage.length} / 100 caracteres
              </p>
            </div>

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
