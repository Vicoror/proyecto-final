"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react"; // Importamos el ícono de "Inicio"
import Captcha from '@/components/Captcha'; // Importamos el componente Captcha
import { useAuth } from "@/components/AuthContext";

export default function LoginPage() {
  // Estados para email, contraseña, errores y carga
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null); // Estado para token de CAPTCHA
  const router = useRouter();
  const { login } = useAuth();
  

  // Función que maneja el envío del formulario
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Verificamos si el CAPTCHA fue completado
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error desconocido");
      }

      const result = await response.json();
      login(result.user);

      alert("Inicio de sesión exitoso!");

      // Redirecciona según el rol del usuario
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

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      <div className="bg-[#F5F1F1] p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md border-4 border-[#762114] text-center">

        {/* Encabezado con ícono y texto de título */}
        <div className="flex items-center justify-center gap-3 mb-2">
          {/* Ícono de inicio con efecto hover y texto debajo */}
          <Link href="/" className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform group">
            <Home className="text-[#762114] w-6 h-6 group-hover:text-[#DC9C5C] cursor-pointer" />
            <span className="text-[8px] text-[#762114] mt-1 font-semibold font-serif">Inicio</span>
          </Link>

          {/* Título principal con fuente personalizada */}
          <Link href="/" className="inline-block">
            <h1
              className="text-2xl md:text-3xl font-bold text-[#7B2710] cursor-pointer transition-all duration-300 transform hover:scale-105 hover:bg-[#DC9C5C] px-3 py-1 rounded-md"
              style={{ fontFamily: 'Alex Brush' }}
            >
              Bernarda Sierra
            </h1>
          </Link>
        </div>

        {/* Subtítulo */}
        <h2 className="text-lg md:text-xl font-serif text-[#8C9560] mt-2">Iniciar sesión</h2>

        {/* Mostrar error si lo hay */}
        {error && <p className="text-red-600 font-bold mt-2 text-sm md:text-base">{error}</p>}

        {/* Formulario de login */}
        <form onSubmit={handleLogin} className="mt-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full p-2 border border-[#8C9560] rounded-md mb-3 text-[#762114] font-serif text-sm md:text-base"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full p-2 border border-[#8C9560] rounded-md mb-4 text-[#762114] font-serif text-sm md:text-base"
            required
          />

          {/* CAPTCHA aquí */}
          <Captcha onVerify={(token) => setCaptchaToken(token)} />

          <button
            type="submit"
            className="bg-[#762114] text-[#F5F1F1] w-full py-2 rounded-md font-serif font-bold transition-transform duration-300 transform hover:scale-105 hover:bg-[#DC9C5C] hover:shadow-lg disabled:opacity-50 text-sm md:text-base"
            disabled={loading}
          >
            {loading ? "Cargando..." : "Entrar"}
          </button>
        </form>

        {/* Botón de registro */}
        <p className="text-xs md:text-sm text-[#8C9560] font-serif mt-4">¿No te has registrado?</p>
        <button
          onClick={() => router.push("/register")}
          className="bg-[#DC9C5C] text-[#762114] w-full py-2 rounded-md mt-2 font-serif font-bold transition-transform duration-300 transform hover:scale-105 hover:bg-[#762114] hover:text-[#F5F1F1] hover:shadow-lg text-sm md:text-base"
        >
          Registrarse
        </button>

        {/* Enlace para recuperar contraseña */}
        <Link href="/login/RecuperarContrasena">
          <p className="text-xs md:text-sm text-[#7B2710] font-serif mt-4 cursor-pointer hover:underline">
            Recuperar Contraseña
          </p>
        </Link>
      </div>
    </div>
  );
}
