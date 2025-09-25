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

function CheckoutInner({ 
  onPaymentSuccess,  
  cartItems, 
  envioSeleccionado, 
  subtotal,
  total,
  userId,
}) { 
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showOxxoModal, setShowOxxoModal] = useState(false); // ← Nuevo estado para OXXO
  const [paymentMethod, setPaymentMethod] = useState(''); // ← Para saber el tipo de pago

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!stripe || !elements) return;

  setLoading(true);
  setMessage("");

  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    console.log('Stripe response:', { error, paymentIntent });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (paymentIntent) {
      // ✅ DETECTAR TIPO DE PAGO
      const paymentMethodType = paymentIntent.charges?.data[0]?.payment_method_details?.type;
      setPaymentMethod(paymentMethodType || '');

      // ✅ PARA OXXO (requires_action es normal)
      if (paymentMethodType === "oxxo" || paymentIntent.status === "requires_action") {
        console.log('Pago OXXO detectado, creando pedido...');
        
        // ✅ PREPARAR PAYLOAD PARA OXXO TAMBIÉN
        const payload = {
          paymentIntentId: paymentIntent.id,
          cartItems: cartItems.map(item => ({
            id: item.id,
            id_ProPer: item.id_ProPer,
            name: item.name || item.nombre,
            price: item.price || item.precio,
            quantity: item.quantity,
            tipo: item.tipo,
            categoria: item.categoria,
            imagen: item.imagen || item.image,
            stock: item.stock,
            materiales: item.materiales,
            tiempoEntrega: item.tiempoEntrega,
            PrecioManoObra: item.PrecioManoObra
          })),
          envioSeleccionado: {
            id_envio: envioSeleccionado.id_envio,
            descripcion_envio: envioSeleccionado.descripcion_envio,
            precio_envio: envioSeleccionado.precio_envio,
            tipo: envioSeleccionado.tipo
          },
          subtotal: subtotal,
          total: total,
          userId: userId
        };

        // ✅ LLAMAR A LA API PARA CREAR PEDIDO OXXO TAMBIÉN
        const response = await fetch('/api/crear-pedido', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (result.success) {
          // ✅ MOSTRAR MODAL OXXO ESPECIAL
          setShowOxxoModal(true);
          setMessage("Has seleccionado OXXO. Se ha generado tu voucher.");
          
          if (onPaymentSuccess) onPaymentSuccess({
            ...paymentIntent,
            pedidoId: result.pedido_id,
            codigoPedido: result.codigo_pedido,
            esOxxo: true // ← Flag para identificar que es OXXO
          });
        } else {
          throw new Error(result.error || "Error al crear pedido OXXO");
        }
        return;
      }

      // ✅ PAGO CON TARJETA EXITOSO (succeeded)
      if (paymentIntent.status === "succeeded") {
        console.log('Pago con tarjeta exitoso, creando pedido...');
        
        const payload = {
          paymentIntentId: paymentIntent.id,
          cartItems: cartItems.map(item => ({
            id: item.id,
            id_ProPer: item.id_ProPer,
            name: item.name || item.nombre,
            price: item.price || item.precio,
            quantity: item.quantity,
            tipo: item.tipo,
            categoria: item.categoria,
            imagen: item.imagen || item.image,
            stock: item.stock,
            materiales: item.materiales,
            tiempoEntrega: item.tiempoEntrega,
            PrecioManoObra: item.PrecioManoObra
          })),
          envioSeleccionado: {
            id_envio: envioSeleccionado.id_envio,
            descripcion_envio: envioSeleccionado.descripcion_envio,
            precio_envio: envioSeleccionado.precio_envio,
            tipo: envioSeleccionado.tipo
          },
          subtotal: subtotal,
          total: total,
          userId: userId
        };

        const response = await fetch('/api/crear-pedido', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (result.success) {
          setShowSuccessModal(true);
          setMessage("Pago realizado con éxito 🎉");
          
          if (onPaymentSuccess) onPaymentSuccess({
            ...paymentIntent,
            pedidoId: result.pedido_id,
            codigoPedido: result.codigo_pedido
          });
        } else {
          throw new Error(result.error || "Error al crear pedido");
        }
      } else {
        setMessage(`Estado del pago: ${paymentIntent.status}`);
      }
    }

  } catch (err) {
    console.error("ERROR EN handleSubmit:", err);
    setMessage(err.message || "Se ha producido un error de procesamiento");
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <button
          type="submit"
          disabled={!stripe || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
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

      {/* ✅ MODAL PARA PAGOS CON TARJETA (EXISTENTE) */}
      {showSuccessModal && (
        <div className="fixed top-0 right-0 inset-y-0 w-[400px] bg-[#F5F1F1] shadow-lg z-50 p-4 overflow-y-auto transition-all">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <h2 className="text-2xl font-bold text-[#762114] mb-2">¡Gracias por tu compra!</h2>
            <p className="text-gray-600 mb-6">
              Te hemos enviado un correo electrónico con los detalles de tu pedido.
            </p>
            <div className="flex gap-4">
              <button onClick={() => { setShowSuccessModal(false); window.location.href = "/Cliente"; }} className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500">
                Ver mis compras
              </button>
              <button onClick={() => { setShowSuccessModal(false); window.location.href = "/"; }} className="px-6 py-2 bg-[#762114] text-white rounded-lg hover:bg-[#5a1a10]">
                Volver a la tienda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NUEVO MODAL PARA PAGOS OXXO */}
      {showOxxoModal && (
        <div className="fixed top-0 right-0 inset-y-0 w-[400px] bg-[#F5F1F1] shadow-lg z-50 p-4 overflow-y-auto transition-all">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">$</span>
            </div>
            <h2 className="text-2xl font-bold text-[#762114] mb-2">¡Gracias por tu compra!</h2>
            <p className="text-gray-600 mb-4">
              <strong>Ya casi es tuya</strong>. Esperamos que nos envíes tu folio al correo que recibiste.
            </p>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 w-full">
              <p className="text-yellow-700 text-sm">
                💡 <strong>Instrucciones:</strong> Acude a cualquier tienda OXXO con tu voucher y realiza el pago. 
                Luego envíanos el folio de pago a nuestro correo.
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => { setShowOxxoModal(false); window.location.href = "/"; }}  className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500">
                Entendido
              </button>
              <button onClick={() => { setShowOxxoModal(false); window.location.href = "/"; }} className="px-6 py-2 bg-[#762114] text-white rounded-lg hover:bg-[#5a1a10]">
                Volver a la tienda
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ✅ EL RESTO DE TU CÓDIGO PagoForm PERMANECE IGUAL
export default function PagoForm(props) {
  const {
    total = 0,
    onPaymentSuccess = () => {},
    cartItems: propCartItems = [],
    envioSeleccionado = {},
    subtotal = 0,
    userId = null,
    userEmail = '',
    userName = 'Cliente',
  } = props;

  let cartItems = propCartItems;
  if (!cartItems || !Array.isArray(cartItems)) {
    console.warn('cartItems no es array, usando array vacío');
    cartItems = [];
  }

  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const amountInCents = Math.round(total * 100);
        const res = await fetch("/api/pago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountInCents, userEmail }),
        });
        
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status}`);
        }
        
        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error al crear PaymentIntent:", error);
      }
    };
    
    fetchPaymentIntent();
  }, [total]);

  if (!clientSecret) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2">Cargando pasarela de pago...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutInner
        onPaymentSuccess={onPaymentSuccess}
        cartItems={cartItems}
        envioSeleccionado={envioSeleccionado}
        subtotal={subtotal}
        total={total}
        userId={userId}
        userEmail={userEmail}
        userName={userName}
      />
    </Elements>
  );
}