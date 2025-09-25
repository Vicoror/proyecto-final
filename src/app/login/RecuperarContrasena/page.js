'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Captcha from '@/components/Captcha'

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!captchaToken) {
      setError('Por favor completa el CAPTCHA antes de continuar.')
      return
    }

    // Validación de email más robusta
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo electrónico válido.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/recuperar-contrasena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, captchaToken }),
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud')
      }

      setSuccess('Se ha enviado un enlace de restablecimiento a tu correo electrónico. Revisa tu bandeja de entrada y spam.')
      setEmail('')
      setCaptchaToken(null)
      
      // Resetear el captcha si tu componente lo permite
      if (window.resetCaptcha) {
        window.resetCaptcha()
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error al enviar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      <div className="bg-[#F5F1F1] p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md border-4 border-[#762114] text-center">
        <h2 className="text-lg md:text-xl font-serif text-[#8C9560] mt-2">Recuperar Contraseña</h2>
        
        <p className="text-sm text-gray-600 mt-2 mb-4">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#7B2710] mb-1 text-left"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => {
                const cleaned = e.target.value
                  .replace(/\s/g, "")
                  .replace(/[<>\[\]\{\},;:"']/g, "")
                  .slice(0, 50)
                setEmail(cleaned)
              }}
              onKeyDown={(e) => {
                if (e.key === " ") {
                  e.preventDefault()
                }
              }}
              className="block w-full p-2 border border-[#8C9560] rounded-md text-[#762114] font-serif text-sm md:text-base focus:ring-2 focus:ring-[#DC9C5C] focus:border-[#DC9C5C] outline-none"
              required
              disabled={isSubmitting}
            />
          </div>

          <Captcha onVerify={(token) => setCaptchaToken(token)} />

          <button
            type="submit"
            className={`w-full py-2 px-4 rounded-md font-serif font-bold transition-colors duration-300 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#762114] text-[#F5F1F1] hover:bg-[#DC9C5C]'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : 'Enviar Instrucciones'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-[#7B2710] font-serif hover:underline inline-flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
