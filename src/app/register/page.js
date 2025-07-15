"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react"; // Importamos íconos de inicio y flecha
import Captcha from "@/components/Captcha"; // Importamos el componente de CAPTCHA

export default function RegisterPage() {
  // Estados del formulario
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null); // Estado para guardar el token del captcha
  const router = useRouter();

  // Validación de contraseña
  const validatePassword = (pass) => {
    if (pass.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/\d/.test(pass)) return "La contraseña debe contener al menos un número";
    return "";
  };

  // Cambios en el campo de contraseña
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(validatePassword(newPassword));
  };

  // Manejo del formulario de registro
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError("Todos los campos son requeridos.");
      return;
    }

    if (!captchaToken) {
      setError("Por favor completa el CAPTCHA antes de continuar.");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, captchaToken}),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Usuario registrado con éxito!");
        router.push("/login");
      } else {
        setError(result.error || "Hubo un problema al registrar el usuario.");
      }
    } catch (err) {
      setError("Error de red: " + err.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-10 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      <div className="bg-[#F5F1F1] w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-lg border-4 border-[#762114] text-center">

        {/* Botón de volver con flecha */}
        <div className="flex justify-start mb-2">
          <button
            onClick={() => router.back()}
            className="flex items-center text-[#7B2710] font-serif font-semibold hover:underline"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Volver
          </button>
        </div>

        {/* Encabezado con ícono de inicio y título */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* Ícono de inicio con nombre abajo */}
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
          >
            <Home className="text-[#762114] w-6 h-6 group-hover:text-[#DC9C5C]" />
            <span className="text-[8px] text-[#762114] mt-1 font-semibold font-serif">Inicio</span>
          </button>

          {/* Título "Registro" */}
          <h1 className="text-3xl sm:text-1xl font-bold text-[#7B2710]">Registrarse</h1>
        </div>

        {/* Mensaje de error */}
        {error && <p className="text-red-600 mb-2">{error}</p>}

        {/* Formulario de registro */}
        <form onSubmit={handleRegister} className="mt-4">
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full p-2 border border-[#8C9560] rounded-md mb-3 text-[#762114] font-serif"
            required
          />
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full p-2 border border-[#8C9560] rounded-md mb-3 text-[#762114] font-serif"
            required
          />

          {/* Campo de contraseña con validación visual */}
          <div className="relative">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={handlePasswordChange}
              className="block w-full p-2 border border-[#8C9560] rounded-md mb-1 text-[#762114] font-serif"
              required
            />
            {passwordError && (
              <p className="text-xs text-red-600 text-left mb-2">{passwordError}</p>
            )}
            <p className="text-xs text-gray-500 text-left">
              La contraseña debe tener mínimo 8 caracteres y al menos un número
            </p>
          </div>

          {/* CAPTCHA antes del botón */}
          <Captcha onVerify={(token) => setCaptchaToken(token)} />

          {/* Botón de registro */}
          <button
            type="submit"
            className="bg-[#762114] text-[#F5F1F1] w-full py-2 rounded-md font-serif font-bold transition-transform duration-300 transform hover:scale-105 hover:bg-[#DC9C5C] hover:shadow-lg mt-4"
          >
            Registrarse
          </button>
        </form>

        {/* Enlace para ir a login */}
        <p className="text-sm text-[#8C9560] font-serif mt-4">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-[#7B2710] hover:underline">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    </div>
  );
}
