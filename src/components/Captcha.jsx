'use client';
import ReCAPTCHA from 'react-google-recaptcha';
import { useRef, useEffect, useState } from 'react';

export default function Captcha({ onVerify }) {
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
    onVerify(token);
  };

  return (
    <div className="my-4 w-full flex flex-col items-center justify-center">
      <div className="w-full flex justify-center">
        <div className="my-4 flex justify-center overflow-x-auto">
          <ReCAPTCHA
            sitekey="6LfapWYrAAAAAPWUOXoPQJv5Gxxj2u7O4n234Z3T"
            onChange={handleChange}
            size={recaptchaSize}
            className="mx-auto scale-90 md:scale-100"
          />
        </div>
      </div>
    </div>
  );
}