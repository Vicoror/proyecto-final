"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react"; 
import Captcha from "@/components/Captcha"; 

export default function RegisterPage() {
  // Estados del formulario
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const router = useRouter();

  // Expresiones regulares
  const regexName = /^(?!\s+$)[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{0,30}$/; 
  // hasta 30 caracteres, solo letras y espacios, no solo espacios

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; 
  // correo válido

  const regexPassword =  /^[A-Za-z\d@$!%*?&]*$/; 
  // hasta 20 caracteres, al menos 1 letra y 1 número, permite algunos símbolos seguros

  // Validación de contraseña (texto informativo)
 const validatePassword = (pass) => {
  if (pass.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }

  if (!/\d/.test(pass)) {
    return "La contraseña debe contener al menos un número";
  }

  if (!/[A-Za-z]/.test(pass)) {
    return "La contraseña debe contener al menos una letra";
  }

  if (!/[A-Z]/.test(pass)) {
    return "La contraseña debe contener al menos una letra mayúscula";
  }

  // Verificar que no haya más de 2 caracteres repetidos consecutivos
  if (/(.)\1{2,}/.test(pass)) {
    return "La contraseña no debe contener un mismo carácter más de 2 veces seguidas";
  }

  return "";
};


  // onChange con validaciones directas
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (regexName.test(value)) {
      setName(value);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value.trimStart(); // quita espacios al inicio
    if (value.length <= 50) {
      setEmail(value);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    if (regexPassword.test(value)) {
      setPassword(value);
      setPasswordError(validatePassword(value));
    }
  };

  // Manejo del formulario de registro
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Todos los campos son requeridos.");
      return;
    }

    if (!regexName.test(name)) {
      setError("El nombre debe tener entre 3 y 30 caracteres y solo letras.");
      return;
    }

    if (!regexEmail.test(email)) {
      setError("El correo no es válido.");
      return;
    }

    if (password.length < 8 || password.length > 20 || !regexPassword.test(password)) {
      setError("La contraseña debe tener 8-20 caracteres, al menos un número y una letra.");
      return;
    }

    if (!captchaToken) {
      setError("Por favor completa el CAPTCHA antes de continuar.");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, captchaToken }),
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
        
        {/* Botón de volver */}
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
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
          >
            <Home className="text-[#762114] w-6 h-6 group-hover:text-[#DC9C5C]" />
            <span className="text-[8px] text-[#762114] mt-1 font-semibold font-serif">Inicio</span>
          </button>
          <h2 className="text-lg md:text-xl font-serif text-[#8C9560] mt-2">Registrarse</h2>
        </div>

        {/* Mensaje de error */}
        {error && <p className="text-red-600 mb-2">{error}</p>}

        {/* Formulario */}
        <form onSubmit={handleRegister} className="mt-4">
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={handleNameChange}
            maxLength={30}
            className="block w-full p-2 border border-[#8C9560] rounded-md mb-3 text-[#762114] font-serif"
            required
          />

          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={handleEmailChange}
            maxLength={50}
            className="block w-full p-2 border border-[#8C9560] rounded-md mb-3 text-[#762114] font-serif"
            required
          />

          <div className="relative">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={handlePasswordChange}
              maxLength={20}
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

          {/* CAPTCHA */}
          <Captcha onVerify={(token) => setCaptchaToken(token)} />

          <button
            type="submit"
            className="bg-[#762114] text-[#F5F1F1] w-full py-2 rounded-md font-serif font-bold transition-transform duration-300 transform hover:scale-105 hover:bg-[#DC9C5C] hover:shadow-lg mt-4"
          >
            Registrarse
          </button>
        </form>

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
