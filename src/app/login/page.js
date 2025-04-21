"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  // Estados y funciones permanecen EXACTAMENTE igual
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, type: "login" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error desconocido");
      }

      const result = await response.json();
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

  // Solo modifico los estilos (className) manteniendo toda la lógica igual
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      <div className="bg-[#F5F1F1] p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md border-4 border-[#762114] text-center">
        <Link href="/" className="inline-block">
          <h1 
            className="text-2xl md:text-3xl font-bold text-[#7B2710] cursor-pointer transition-all duration-300 transform hover:scale-105 hover:bg-[#DC9C5C] px-3 py-1 rounded-md" 
            style={{ fontFamily: 'Alex Brush' }}
          >
            Bernarda Sierra
          </h1>
        </Link>

        <h2 className="text-lg md:text-xl font-serif text-[#8C9560] mt-2">Iniciar sesión</h2>

        {error && <p className="text-red-600 font-bold mt-2 text-sm md:text-base">{error}</p>}

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
          <button
            type="submit"
            className="bg-[#762114] text-[#F5F1F1] w-full py-2 rounded-md font-serif font-bold transition-transform duration-300 transform hover:scale-105 hover:bg-[#DC9C5C] hover:shadow-lg disabled:opacity-50 text-sm md:text-base"
            disabled={loading}
          >
            {loading ? "Cargando..." : "Entrar"}
          </button>
        </form>

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