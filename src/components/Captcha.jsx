'use client';
import ReCAPTCHA from 'react-google-recaptcha';
import { useRef, useEffect, useState } from 'react';

export default function Captcha({ onVerify, onError }) {
  const recaptchaRef = useRef();
  const [recaptchaSize, setRecaptchaSize] = useState('normal');

  useEffect(() => {
    const handleResize = () => {
      setRecaptchaSize(window.innerWidth < 768 ? 'compact' : 'normal');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const triggerError = () => {
    recaptchaRef.current.reset();
    if (onError) onError();
  };

  const handleChange = (token) => {
    if (token) {
      onVerify(token);
    } else {
      triggerError(); // solo se centraliza aquí
    }
  };

  const handleExpired = () => {
    triggerError(); // usa la misma función para evitar duplicados
  };

  const handleReset = () => {
    recaptchaRef.current.reset();
  };

  return (
    <div className="my-4 w-full flex flex-col items-center justify-center">
  <div className="flex items-center space-x-3">
    <ReCAPTCHA
      ref={recaptchaRef}
      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
      onChange={handleChange}
      onExpired={handleExpired}
      size={recaptchaSize}
      className="scale-90 md:scale-100"
    />

    {/* Botón de reinicio más discreto */}
    <button
      type="button"
      onClick={handleReset}
      className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm transition"
      title="Reiniciar Captcha"
    >
      ↻
    </button>
  </div>
</div>

  );
}
