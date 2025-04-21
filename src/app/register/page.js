"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  const validatePassword = (pass) => {
    if (pass.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/\d/.test(pass)) {
      return "La contraseña debe contener al menos un número";
    }
    return "";
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(validatePassword(newPassword));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError("Todos los campos son requeridos.");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
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
        <h1 className="text-3xl sm:text-4xl font-bold text-[#7B2710] mb-4">Registro</h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}

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
              <p className="text-xs text-red-600 text-left mb-2">
                {passwordError}
              </p>
            )}
            <p className="text-xs text-gray-500 text-left">
              La contraseña debe tener mínimo 8 caracteres y al menos un número
            </p>
          </div>
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
