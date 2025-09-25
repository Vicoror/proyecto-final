'use client';
import { Suspense } from 'react';
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Componente principal que usa useSearchParams
function RestablecerContrasenaContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [passwordErrors, setPasswordErrors] = useState([])
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  // Expresiones regulares para validación
  const validationRules = {
    minLength: /^.{8,}$/,
    hasUpperCase: /[A-Z]/,
    hasNumber: /[0-9]/,
    noSpecialChars: /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/, // Caracteres permitidos
    noRepeatedChars: /(.)\1\1/, // No más de 2 caracteres repetidos consecutivos
    noSpaces: /^\S*$/,
    maxLength: /^.{1,20}$/
  }

  // Función para validar contraseña
  const validatePassword = (pass) => {
    const errors = []

    if (!validationRules.minLength.test(pass)) {
      errors.push('Mínimo 8 caracteres')
    }
    if (!validationRules.hasUpperCase.test(pass)) {
      errors.push('Al menos una mayúscula')
    }
    if (!validationRules.hasNumber.test(pass)) {
      errors.push('Al menos un número')
    }
    if (!validationRules.noSpecialChars.test(pass)) {
      errors.push('Caracteres no permitidos (solo letras, números y símbolos comunes)')
    }
    if (validationRules.noRepeatedChars.test(pass)) {
      errors.push('No más de 2 caracteres repetidos consecutivos')
    }
    if (!validationRules.noSpaces.test(pass)) {
      errors.push('No se permiten espacios')
    }
    if (!validationRules.maxLength.test(pass)) {
      errors.push('Máximo 20 caracteres')
    }

    return errors
  }

  // Función para limpiar y validar entrada en tiempo real
  const handlePasswordChange = (value, field) => {
    // Limpiar caracteres no permitidos
    let cleanedValue = value.replace(/[<>\[\]{};:"',\\\/]/g, '') // Eliminar caracteres peligrosos
    cleanedValue = cleanedValue.replace(/\s/g, '') // Eliminar espacios
    
    // Limitar a 20 caracteres
    cleanedValue = cleanedValue.slice(0, 20)

    if (field === 'password') {
      setPassword(cleanedValue)
      // Validar en tiempo real solo si hay contenido
      if (cleanedValue.length > 0) {
        setPasswordErrors(validatePassword(cleanedValue))
      } else {
        setPasswordErrors([])
      }
    } else {
      setConfirmPassword(cleanedValue)
    }
  }

  // Prevenir tecleo de espacios
  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      e.preventDefault()
    }
  }

  useEffect(() => {
    if (!token || !email) {
      setError('Enlace inválido o expirado')
      setLoading(false)
      return
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/verificar-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        })

        const data = await response.json()

        if (response.ok) {
          setIsValidToken(true)
        } else {
          setError(data.error || 'Token inválido o expirado')
        }
      } catch (err) {
        setError('Error al verificar el enlace')
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token, email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validaciones antes de enviar
    const errors = validatePassword(password)
    if (errors.length > 0) {
      setError('La contraseña no cumple con los requisitos: ' + errors.join(', '))
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/actualizar-contrasena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar la contraseña')
      }

      setSuccess('Contraseña actualizada correctamente. Redirigiendo al login...')
      
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (err) {
      setError(err.message || 'Ocurrió un error al actualizar la contraseña')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
           style={{ backgroundImage: "url('/fondo.png')" }}>
        <div className="bg-[#F5F1F1] p-8 rounded-2xl shadow-lg w-full max-w-md border-4 border-[#762114] text-center">
          <p>Verificando enlace...</p>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
           style={{ backgroundImage: "url('/fondo.png')" }}>
        <div className="bg-[#F5F1F1] p-8 rounded-2xl shadow-lg w-full max-w-md border-4 border-[#762114] text-center">
          <h2 className="text-xl font-serif text-[#8C9560] mb-4">Enlace Inválido</h2>
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <Link href="/login/RecuperarContrasena" className="text-[#7B2710] hover:underline">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
         style={{ backgroundImage: "url('/fondo.png')" }}>
      <div className="bg-[#F5F1F1] p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-md border-4 border-[#762114] text-center">
        <h2 className="text-lg md:text-xl font-serif text-[#8C9560] mb-4">Restablecer Contraseña</h2>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#7B2710] mb-1 text-left">
              Nueva Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value, 'password')}
              onKeyDown={handleKeyDown}
              className="block w-full p-2 border border-[#8C9560] rounded-md text-[#762114] font-serif text-sm md:text-base focus:ring-2 focus:ring-[#DC9C5C] focus:border-[#DC9C5C] outline-none"
              required
              minLength={8}
              maxLength={20}
              disabled={isSubmitting}
              placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
            />
            
            {/* Mostrar errores en tiempo real */}
            {passwordErrors.length > 0 && (
              <div className="mt-2 text-left">
                <p className="text-sm text-red-600 font-medium">Requisitos:</p>
                <ul className="text-xs text-red-500 list-disc list-inside">
                  {passwordErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mostrar indicadores de fortaleza */}
            {password.length > 0 && passwordErrors.length === 0 && (
              <div className="mt-2 text-left">
                <p className="text-sm text-green-600 font-medium">✓ Contraseña válida</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#7B2710] mb-1 text-left">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => handlePasswordChange(e.target.value, 'confirm')}
              onKeyDown={handleKeyDown}
              className="block w-full p-2 border border-[#8C9560] rounded-md text-[#762114] font-serif text-sm md:text-base focus:ring-2 focus:ring-[#DC9C5C] focus:border-[#DC9C5C] outline-none"
              required
              minLength={8}
              maxLength={20}
              disabled={isSubmitting}
              placeholder="Repite la contraseña"
            />

            {/* Indicador de coincidencia */}
            {confirmPassword.length > 0 && password.length > 0 && (
              <div className="mt-2 text-left">
                {password === confirmPassword ? (
                  <p className="text-sm text-green-600 font-medium">✓ Las contraseñas coinciden</p>
                ) : (
                  <p className="text-sm text-red-600 font-medium">✗ Las contraseñas no coinciden</p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 rounded-md font-serif font-bold transition-colors duration-300 ${
              isSubmitting || passwordErrors.length > 0 || password !== confirmPassword
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#762114] text-[#F5F1F1] hover:bg-[#DC9C5C]'
            }`}
            disabled={isSubmitting || passwordErrors.length > 0 || password !== confirmPassword}
          >
            {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-[#7B2710] font-serif hover:underline"
          >
            Volver al inicio de sesión
          </Link>
        </div>

        {/* Información adicional */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
          <p className="text-sm text-blue-800 font-medium">Requisitos de contraseña:</p>
          <ul className="text-xs text-blue-600 list-disc list-inside mt-1">
            <li>Mínimo 8 caracteres, máximo 20</li>
            <li>Al menos una letra mayúscula</li>
            <li>Al menos un número</li>
            <li>Sin espacios</li>
            <li>Sin caracteres repetidos más de 2 veces</li>
            <li>Sin caracteres especiales peligrosos</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Componente principal que envuelve en Suspense
export default function RestablecerContrasena() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
           style={{ backgroundImage: "url('/fondo.png')" }}>
        <div className="bg-[#F5F1F1] p-8 rounded-2xl shadow-lg w-full max-w-md border-4 border-[#762114] text-center">
          <p>Cargando...</p>
        </div>
      </div>
    }>
      <RestablecerContrasenaContent />
    </Suspense>
  )
}