"use client";

import { useCart } from "@/components/CartContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from 'next/link';
import { useAuth } from "@/components/AuthContext";
import EscogerEnvio from "@/components/EscogerEnvio";
import DatosFormulario from "@/components/DatosFormulario";
import PagoForm from "@/components/PagoForm";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const VerCarrito = () => {
  const { cartItems, updateQuantity, removeItem, clearCart } = useCart();
  const router = useRouter();
  const [confirmClear, setConfirmClear] = useState(false);
  const { isLoggedIn, loading, userId, userEmail, userName } = useAuth();
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);
  const [mostrarResumenCompra, setMostrarResumenCompra] = useState(false);
  const [mostrarFormularioPago, setMostrarFormularioPago] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  // Estados para términos y condiciones
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [terminosTexto, setTerminosTexto] = useState("");

  // 2. Cálculos independientes
  const { subtotal, totalItems } = useMemo(() => ({
    subtotal: cartItems.reduce((t, item) => 
      t + Number(item.precio || item.price) * Number(item.quantity), 0),
    totalItems: cartItems.reduce((sum, item) => sum + Number(item.quantity), 0)
  }), [cartItems]);

  // 3. Cálculos dependientes
  const { precioEnvio, total } = useMemo(() => {
    const envio = envioSeleccionado ? Number(envioSeleccionado.precio_envio) : 0;
    return {
      precioEnvio: envio,
      total: subtotal + envio
    };
  }, [subtotal, envioSeleccionado]);

  // Luego usar el useEffect que depende de total
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!mostrarFormularioPago || total <= 0) return;

      try {
        const response = await fetch('/api/pago', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: Math.round(total * 100),
            currency: 'mxn'
          }),
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.id);
      } catch (error) {
        console.error("Error al crear PaymentIntent:", error);
      }
    };

    createPaymentIntent();
  }, [total, mostrarFormularioPago]);

useEffect(() => {
  (async () => {
    try {
      const res = await fetch("/api/whatsapp-config", { cache: "no-store" });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setTerminosTexto(data?.terminos || ""); // <-- solo el texto de términos
    } catch (err) {
      console.error("Error cargando términos:", err);
    }
  })();
}, []);

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  const handleFinalizar = () => {
    if (loading) return;
    if (!isLoggedIn) {
      localStorage.setItem('cartRedirect', JSON.stringify({
        path: '/ver-carrito',
        cartItems,
        envioSeleccionado
      }));
      router.push("/login?redirect=/ver-carrito");
      return;
    }
    if (!envioSeleccionado) return;
    
    setMostrarResumenCompra(true);
  };

  const handleConfirmarCompra = () => {
    setMostrarResumenCompra(false);
    setMostrarFormularioPago(true);
    setClientSecret("");
  };

  const handleVolverAlCarrito = () => {
    setMostrarResumenCompra(false);
    setMostrarFormularioPago(false);
  };

  // Carrito vacío
  if (cartItems.length === 0 && !paymentSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end  bg-[radial-gradient(circle,rgba(220,156,92,0.2)_0%,rgba(220,156,92,0.7)_100%)]">
        <div className="w-[400px] bg-[#F5F1F1] shadow-lg p-4 overflow-y-auto transition-all">
        <div className="flex justify-between items-center">
          <Link href="/">
            <span className="text-[#762114] hover:underline cursor-pointer">
              ← Seguir comprando
            </span>
          </Link>
        </div>
        <div className="mt-8 text-center">
          <p className="text-lg text-gray-600">Tu carrito está vacío</p>
          <p className="text-sm text-gray-500 mt-2">Agrega productos para continuar</p>
          <Link href="/">
            <button className="mt-4 px-4 py-2 bg-[#762114] text-white rounded-lg hover:bg-[#5a1a10]">
              Ver productos
            </button>
          </Link>
          </div>
        </div>
      </div>
    );
  }

  // Resumen de compra
  if (mostrarResumenCompra) { return (
<div className="fixed inset-0 z-50 flex justify-end  bg-[radial-gradient(circle,rgba(220,156,92,0.2)_0%,rgba(220,156,92,0.7)_100%)]">
  <div className="w-[400px] bg-[#F5F1F1] shadow-lg p-4 overflow-y-auto transition-all">
    <div className="flex justify-between items-center">
      <button
        onClick={handleVolverAlCarrito}
        className="text-[#762114] hover:underline cursor-pointer"
      >
        ← Volver al carrito
      </button>
    </div>

    <h2 className="text-lg font-bold text-[#762114] mt-6 mb-4">
      Resumen de tu compra
    </h2>

      <div className="space-y-4 mb-6">
        {cartItems.map((item) => (
          <div key={item.uniqueId} className="border-b py-3">
            <div className="flex gap-3">
              {item.image || item.imagen ? (
                <Image
                  src={item.image || item.imagen}
                  alt={item.name || item.nombre || "Producto"}
                  width={80}
                  height={60}
                  className="rounded object-cover"
                />
              ) : (
                <div className="w-15 h-15 bg-gray-200 rounded" />
              )}

              <div className="flex-grow">
                <h3 className="font-semibold text-sm">
                  {item.name || item.nombre}
                </h3>
                {item.talla && (
                  <p className="text-xs text-gray-600">Talla: {item.talla}</p>
                )}
                <p className="text-xs text-gray-600">
                  Cantidad: {item.quantity} × $
                  {Number(item.precio || item.price || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">
                  Subtotal: $
                  {(
                    (Number(item.precio || item.price || 0) || 0) * item.quantity
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

    <div className="border-t pt-4">
      <div className="flex justify-between mb-2">
        <span className="text-gray-600">Subtotal:</span>
        <span className="font-medium">${subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between mb-2">
        <span className="text-gray-600">
          Envío ({envioSeleccionado.descripcion_envio}):
        </span>
        <span className="font-medium">${precioEnvio.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold text-[#762114] mt-2">
        <span>Total:</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>

    {/* Checkbox términos */}
    <div className="mt-4 flex items-start gap-2">
      <input
        type="checkbox"
        id="terminos"
        checked={aceptaTerminos}
        onChange={(e) => setAceptaTerminos(e.target.checked)}
        className="mt-1"
      />
      <label htmlFor="terminos" className="text-sm text-gray-700">
        Acepto los{" "}
        <button
          type="button"
          onClick={() => setMostrarTerminos(true)}
          className="text-[#762114] underline hover:text-[#DC9C5C]"
        >
          Términos y condiciones
        </button>
      </label>
    </div>

    {/* Botón confirmar */}
    <button
      onClick={handleConfirmarCompra}
      disabled={!aceptaTerminos || !envioSeleccionado} // <--- agregar envioSeleccionado
      className={`w-full py-2 rounded-lg mt-6 font-semibold text-white ${
        aceptaTerminos && envioSeleccionado
          ? "bg-[#762114] hover:bg-[#DC9C5C] cursor-pointer"
          : "bg-gray-400 cursor-not-allowed"
      }`}
    >
      Confirmar y proceder al pago
    </button>


    {/* Modal de términos */}
   {mostrarTerminos && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] px-4">
    <div className="bg-white p-6 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col">
      <h3 className="text-xl font-bold text-[#762114] mb-4 text-center sm:text-left">
        Términos y condiciones
      </h3>
      <div className="text-sm text-gray-700 max-h-[70vh] overflow-y-auto whitespace-pre-line leading-relaxed">
        {terminosTexto}
      </div>
      <button
        onClick={() => setMostrarTerminos(false)}
        className="mt-6 px-6 py-3 bg-[#762114] text-white rounded-lg hover:bg-[#DC9C5C] self-center sm:self-end transition"
      >
        Cerrar
      </button>
    </div>
  </div>
)}

  </div>
  </div>
)}


  // Formulario de pago
  if (mostrarFormularioPago) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end  bg-[radial-gradient(circle,rgba(220,156,92,0.2)_0%,rgba(220,156,92,0.7)_100%)]">
        <div className="w-[400px] bg-[#F5F1F1] shadow-lg p-4 overflow-y-auto transition-all">
        <div className="flex justify-between items-center">
          <button
            onClick={handleVolverAlCarrito}
            className="text-[#762114] hover:underline cursor-pointer"
          >
            ← Volver al carrito
          </button>
        </div>
        <h2 className="text-lg font-bold text-[#762114] mt-6 mb-4">Pago</h2>
        
        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Envío:</span>
            <span className="font-medium">${precioEnvio.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold mt-2">
            <span>Total:</span>
            <span className="text-[#762114]">${total.toFixed(2)}</span>
          </div>
        </div>

        {!clientSecret ? (
          <div className="flex justify-center items-center h-32">
            <p>Cargando métodos de pago...</p>
          </div>
        ) : (
          
           <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PagoForm 
        total={total}
        cartItems={cartItems}
        envioSeleccionado={envioSeleccionado}
        subtotal={subtotal}
        userId={userId}           // ← Pasar el id_cliente
        userEmail={userEmail}
        userName={userName}
        
      />
    </Elements>
        )}
      </div>
    </div>
    );
  }

  // Vista normal del carrito
  return (

   <div className="fixed inset-0 z-50 flex justify-end  bg-[radial-gradient(circle,rgba(220,156,92,0.2)_0%,rgba(220,156,92,0.7)_100%)]">
     <div className="w-[400px] bg-[#F5F1F1] shadow-lg p-4 overflow-y-auto transition-all">
      <div className="flex justify-between items-center">
        <Link href="/">
          <span
            onClick={() => window.history.back()}
            className="text-[#762114] hover:underline cursor-pointer"
          >
            ← Seguir comprando
          </span>
        </Link>
        <button
          onClick={() => setConfirmClear(true)}
          className="text-red-600 font-bold text-xl"
        >
          ×
        </button>
      </div>

      {confirmClear && (
        <div className="bg-white border p-4 rounded-lg shadow-md text-center mt-4">
          <p className="mb-2 font-semibold">¿Estás segur@ de eliminar todo el pedido?</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setConfirmClear(false)}
              className="text-sm px-4 py-2 rounded bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                clearCart();
                router.push("/");
              }}
              className="text-sm px-4 py-2 rounded bg-red-500 text-white"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold text-[#762114] mt-2 mb-4">Productos</h2>
      {cartItems
        .filter((p) => p.tipo !== "personalizado")
        .map((item) => (
          <div key={item.uniqueId} className="border-b py-3">
            <div className="flex gap-3">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name || "Producto"}
                  width={80}
                  height={60}
                  className="rounded object-cover"
                />
              ) : (
                <div className="w-15 h-15 bg-gray-200 rounded" />
              )}

              <div className="flex-grow">
                <h3 className="font-semibold text-sm">{item.name}</h3>
                {item.talla && (
                  <p className="text-xs text-gray-600">Talla: {item.talla}</p>
                )}
                <p className="text-xs text-gray-600">Precio: ${item.price}</p>
                <div className="flex items-center mt-1 gap-2">
                  <button
                    onClick={() => updateQuantity(item.uniqueId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="px-2 border rounded text-sm"
                  >
                    -
                  </button>
                  <span className="text-sm">{item.quantity}</span>
                  <button
                     onClick={() => updateQuantity(item.uniqueId, item.quantity + 1)}
                    disabled={item.quantity >= Number(item.stock)}
                    className="px-2 border rounded text-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.uniqueId)}
                    className="ml-auto text-red-500 text-sm hover:text-red-700"
                    aria-label={`Eliminar ${item.name} del carrito`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

      <h2 className="text-lg font-bold text-[#762114] mt-6 mb-4">
        Productos Personalizados
      </h2>
      {cartItems
  .filter((p) => p.tipo === "personalizado")
  .map((item) => {
    const materiales = Array.isArray(item.materiales)
      ? item.materiales
      : typeof item.materiales === "string"
        ? item.materiales.split(",")
        : [];

    return (
      <div key={item.uniqueId} className="border-b py-3">
        <div className="flex gap-3">
          {item.imagen ? (
            <Image
              src={item.imagen}
              alt={item.name || "Producto"}
              width={80}
              height={60}
              className="rounded object-cover"
            />
          ) : (
            <div className="w-[60px] h-[60px] bg-gray-200 rounded" />
          )}

          <div className="flex-grow">
            <h3 className="font-semibold text-sm">{item.nombre}</h3>
            
            {/* 🔹 AGREGAR TALLA SI ES ANILLO PERSONALIZADO */}
            {item.categoria === "Anillos" && item.talla && (
              <p className="text-xs text-gray-600">Talla: {item.talla}</p>
            )}
            
            <p className="text-xs text-gray-600">
              Materiales:{" "}
              {item.materiales &&
                Object.entries(item.materiales)
                  .map(([key, valor]) => {
                    const nombresVisibles = {
                      metale: "Metal",
                      piedra: "Piedra",
                      hilo: "Hilo",
                    };

                    const nombre =
                      typeof valor === "object"
                        ? valor?.nombre || valor?.color
                        : valor;

                    if (!nombre) return null;

                    return `${nombresVisibles[key] || key}: ${nombre}`;
                  })
                  .filter(Boolean)
                  .join(", ")}
            </p>

            <p className="text-xs text-gray-600">Precio: ${item.precio}</p>

            <div className="flex items-center mt-1 gap-2">
              {/* Disminuir cantidad */}
              <button
                onClick={() => updateQuantity(item.uniqueId, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="px-2 border rounded text-sm"
              >
                -
              </button>

              <span className="text-sm">{item.quantity}</span>

              <button
                onClick={() => updateQuantity(item.uniqueId, item.quantity + 1)}
                disabled={item.quantity >= 5} 
                className="px-2 border rounded text-sm"
              >
                +
              </button>

              <button
                onClick={() => removeItem(item.uniqueId)}
                className="ml-auto text-red-500 text-sm hover:text-red-700"
                aria-label={`Eliminar ${item.name} del carrito`}
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })}

      <h2 className="text-lg font-bold text-[#762114] mt-6 mb-4">
        Escoge tipo de envio
      </h2>
      <EscogerEnvio onEnvioSeleccionado={setEnvioSeleccionado} />

      <h2 className="text-lg font-bold text-[#762114] mt-6 mb-4">
        Mis datos de envio 
      </h2>
      {isLoggedIn ? (
        <DatosFormulario />
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Necesitas <button onClick={() => router.push("/login")} className="font-medium underline text-yellow-700 hover:text-yellow-600">iniciar sesión</button> o <button onClick={() => router.push("/register")} className="font-medium underline text-yellow-700 hover:text-yellow-600">registrarte</button> para continuar con tu compra.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-right border-t pt-4">
        <p className="text-sm mb-1 text-gray-600">Piezas: {totalItems}</p>
        <p className="text-lg font-bold text-[#762114] mb-3">
          Subtotal: ${subtotal.toFixed(2)}
        </p>
        {envioSeleccionado && (
          <p className="text-sm mb-1 text-gray-600">
            Envío ({envioSeleccionado.descripcion_envio}): ${precioEnvio.toFixed(2)}
          </p>
        )}
        {envioSeleccionado && (
          <p className="text-lg font-bold text-[#762114] mb-3">
            Total: ${total.toFixed(2)}
          </p>
        )}
        <button
          onClick={handleFinalizar}
          disabled={cartItems.length === 0 || !envioSeleccionado || !isLoggedIn}
          className={`w-full py-2 rounded-lg transition cursor-pointer font-semibold
            ${cartItems.length === 0 || !envioSeleccionado || !isLoggedIn
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-[#762114] text-white hover:bg-[#DC9C5C]"}`}
        >
          {!isLoggedIn ? "Inicia sesión para comprar" 
            : !envioSeleccionado ? "Selecciona un envío" 
            : "Comprar"}
        </button>
      </div>
    </div>
  </div>

  );
};

export default VerCarrito;