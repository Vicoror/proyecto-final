"use client";

import { useState } from "react";
import { FiMail, FiLoader, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const EmailPedido = ({ 
  pedidoId, 
  userId, 
  userEmail, 
  userName, 
  paymentMethod,
  onEmailSent 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const enviarEmailPedido = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pedidoId,
          userId,
          userEmail,
          userName,
          paymentMethod
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el correo');
      }

      if (data.success) {
        setSuccess(true);
        if (onEmailSent) onEmailSent();
      } else {
        throw new Error(data.error || 'Error en el servidor');
      }

    } catch (err) {
      console.error('Error enviando email:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <FiMail className="text-blue-600" />
          Confirmación de pedido 
        </h3>
        
        {success ? (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <FiCheckCircle />
            Enviado
          </span>
        ) : (
          <button
            onClick={enviarEmailPedido}
            disabled={loading}
            className="flex items-center gap-2 bg-[#762114] text-white px-3 py-1 rounded text-sm hover:bg-[#8C2710] disabled:bg-gray-400"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <FiMail size={14} />
                Enviar email
              </>
            )}
          </button>
        )}
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Destinatario:</strong> {userName}</p>
        <p><strong>Email:</strong> {userEmail}</p>
        <p><strong>Método de pago:</strong> {paymentMethod === 'oxxo' ? 'OXXO' : 'Tarjeta'}</p>
        <p><strong>ID Pedido:</strong> {pedidoId}</p>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
          <FiAlertCircle className="text-red-600 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
          <FiCheckCircle className="text-green-600 flex-shrink-0" />
          <span className="text-green-700 text-sm">
            Email enviado correctamente a {userEmail}
          </span>
        </div>
      )}
    </div>
  );
};

export default EmailPedido;