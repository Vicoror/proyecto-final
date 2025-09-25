"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import Captcha from '@/components/Captcha';
import { useAuth } from "@/components/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [reactivateUserId, setReactivateUserId] = useState(null);
  const [reactivating, setReactivating] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!captchaToken) {
      setError("Por favor completa el CAPTCHA antes de continuar.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, type: "login", captchaToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        // ✅ NUEVO: Verificar si es error de cuenta inactiva
        if (result.cuentaInactiva) {
          setReactivateUserId(result.userId);
          setShowReactivateDialog(true);
          setError(""); // Limpiar error para mostrar el diálogo
          return;
        }
        throw new Error(result.error || "Error desconocido");
      }

      // ✅ LOGIN EXITOSO (mantener todo igual)
      login(result.user);
      localStorage.setItem("user", JSON.stringify(result.user));
      alert("Inicio de sesión exitoso!");

      if (result.user.rol === "admin") {
        router.push("/Admin");
      } else {
        router.push("/Cliente");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Reactivar cuenta
  const handleReactivateAccount = async () => {
    setReactivating(true);
    
    try {
      const response = await fetch("/api/reactivar-cuenta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: reactivateUserId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al reactivar la cuenta");
      }

      alert("¡Cuenta reactivada correctamente! Ya puedes iniciar sesión.");
      setShowReactivateDialog(false);
      setReactivateUserId(null);
      
      // Limpiar formulario
      setEmail("");
      setPassword("");
      setCaptchaToken(null);

    } catch (err) {
      setError(err.message);
    } finally {
      setReactivating(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Cancelar reactivación
  const handleCancelReactivate = () => {
    setShowReactivateDialog(false);
    setReactivateUserId(null);
    setError("La cuenta está inactiva. Contacta al administrador si deseas reactivarla.");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      <div className="bg-[#F5F1F1] p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md border-4 border-[#762114] text-center">

        {/* ✅ DIÁLOGO DE REACTIVACIÓN (NUEVO) */}
        {showReactivateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-4">
              <h3 className="text-lg font-bold text-[#7B2710] mb-3">Cuenta Inactiva</h3>
              <p className="text-gray-700 mb-4">
                Tu cuenta está actualmente inactiva. ¿Deseas reactivarla?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleReactivateAccount}
                  disabled={reactivating}
                  className="flex-1 bg-[#762114] text-white py-2 rounded-md font-serif font-bold disabled:opacity-50"
                >
                  {reactivating ? "Reactivando..." : "Sí, reactivar"}
                </button>
                <button
                  onClick={handleCancelReactivate}
                  disabled={reactivating}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-md font-serif font-bold disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ENCABEZADO (MANTENER IGUAL) */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <Link href="/" className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform group">
            <Home className="text-[#762114] w-6 h-6 group-hover:text-[#DC9C5C] cursor-pointer" />
            <span className="text-[8px] text-[#762114] mt-1 font-semibold font-serif">Inicio</span>
          </Link>

          <Link href="/" className="inline-block">
            <h1
              className="text-2xl md:text-3xl font-bold text-[#7B2710] cursor-pointer transition-all duration-300 transform hover:scale-105 hover:bg-[#DC9C5C] px-3 py-1 rounded-md"
              style={{ fontFamily: 'Alex Brush' }}
            >
              Bernarda Sierra
            </h1>
          </Link>
        </div>

        <h2 className="text-lg md:text-xl font-serif text-[#8C9560] mt-2">Iniciar sesión</h2>

        {/* FORMULARIO (MANTENER IGUAL) */}
        <form onSubmit={handleLogin} className="mt-4">
          {error && <p className="text-red-500 mb-2">{error}</p>}

          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => {
              const cleaned = e.target.value
                .replace(/\s/g, "")
                .replace(/[<>\[\]\{\},;:"']/g, "")
                .slice(0, 50);
              setEmail(cleaned);
            }}
            onKeyDown={(e) => {
              if (e.key === " ") {
                e.preventDefault();
              }
            }}
            className="block w-full p-2 border border-[#8C9560] rounded-md mb-3 text-[#762114] font-serif text-sm md:text-base"
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\s/g, "").slice(0, 30);
              setPassword(cleaned);
            }}
            className="block w-full p-2 border border-[#8C9560] rounded-md mb-4 text-[#762114] font-serif text-sm md:text-base"
            required
          />

         <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="origin-top-left scale-90 sm:scale-100">
            <Captcha onVerify={(token) => setCaptchaToken(token)} />
          </div>
        </div>



          <button
            type="submit"
            className="bg-[#762114] text-[#F5F1F1] w-full py-2 rounded-md font-serif font-bold transition-transform duration-300 transform hover:scale-105 hover:bg-[#DC9C5C] hover:shadow-lg disabled:opacity-50 text-sm md:text-base"
            disabled={loading}
          >
            {loading ? "Cargando..." : "Entrar"}
          </button>
        </form>

        {/* BOTONES ADICIONALES (MANTENER IGUAL) */}
        <p className="text-xs md:text-sm text-[#8C9560] font-serif mt-4">¿No te has registrado?</p>
        <button
          onClick={() => router.push("/register")}
          className="bg-[#DC9C5C] text-[#762114] w-full py-2 rounded-md mt-2 font-serif font-bold transition-transform duration-300 transform hover:scale-105 hover:bg-[#762114] hover:text-[#F5F1F1] hover:shadow-lg text-sm md:text-base"
        >
          Registrarse
        </button>

        <Link href="/login/RecuperarContrasena">
          <p className="text-xs md:text-sm text-[#7B2710] font-serif mt-4 cursor-pointer hover:underline">
            Recuperar Contraseña
          </p>
        </Link>
      </div>
    </div>
  );
}