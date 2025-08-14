"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutInner({ clientSecret, onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage("");

    const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required", // permite quedarse en la página
        });

    if (error) {
      setMessage(error.message);
      console.error(error.message);
    } else if (paymentIntent) {
      const paymentMethodType =
        paymentIntent.charges?.data[0]?.payment_method_details?.type;

      if (paymentMethodType === "oxxo") {
        setMessage(
          "Has seleccionado OXXO. Se ha generado tu voucher. Por favor, acude a OXXO y presenta este código para pagar."
        );
      } else if (paymentIntent.status === "succeeded") {
        setShowSuccessModal(true);
        setMessage("Pago realizado con éxito 🎉");
        if (onPaymentSuccess) onPaymentSuccess(paymentIntent);
      } else {
        setMessage(`Estado del pago: ${paymentIntent.status}`);
      }
    }

    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <button
          type="submit"
          disabled={!stripe || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Procesando..." : "Pagar"}
        </button>
        {message && (
          <div className="mt-4 p-3 border rounded bg-yellow-100 text-yellow-800">
            {message}
          </div>
        )}
        <div className="mt-2 text-sm text-gray-500">
          Puedes pagar con tarjetas Visa, MasterCard, American Express o con efectivo en OXXO (México).
        </div>
      </form>

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed top-0 right-0 inset-y-0 w-[400px] bg-[#F5F1F1] shadow-lg z-50 p-4 overflow-y-auto transition-all">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
              className="w-16 h-16 text-green-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <h2 className="text-2xl font-bold text-[#762114] mb-2">
              ¡Gracias por tu compra!
            </h2>
            <p className="text-gray-600 mb-6">
              Te hemos enviado un correo electrónico con los detalles de tu pedido para que puedas darle seguimiento.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                }}
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
              >
                Salir
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.href = "/";
                }}
                className="px-6 py-2 bg-[#762114] text-white rounded-lg hover:bg-[#5a1a10]"
              >
                Volver a la tienda
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CheckoutForm({ onPaymentSuccess }) {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const res = await fetch("/api/pago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 50000 }),
        });
        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error al crear PaymentIntent:", error);
      }
    };
    fetchPaymentIntent();
  }, []);

  if (!clientSecret) return <p>Cargando pago...</p>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutInner clientSecret={clientSecret} onPaymentSuccess={onPaymentSuccess} />
    </Elements>
  );
}
