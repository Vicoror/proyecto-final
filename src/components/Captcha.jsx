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

  const handleChange = (token) => {
    if (token) {
      onVerify(token);
    } else {
      // Si hay un error (token es null), recargamos el reCAPTCHA
      recaptchaRef.current.reset();
      if (onError) onError();
    }
  };

  const handleExpired = () => {
    recaptchaRef.current.reset();
    if (onError) onError();
  };

  return (
    <div className="my-4 w-full flex flex-col items-center justify-center">
      <div className="w-full flex justify-center">
        <div className="my-4 flex justify-center overflow-x-auto">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            onChange={handleChange}
            onExpired={handleExpired}
            size={recaptchaSize}
            className="mx-auto scale-90 md:scale-100"
          />
        </div>
      </div>
    </div>
  );
}