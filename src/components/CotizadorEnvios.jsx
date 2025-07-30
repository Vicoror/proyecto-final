'use client';

import { useState } from 'react';

export default function Cotizador() {
  const [codigoPostal, setCodigoPostal] = useState('');
  const [peso, setPeso] = useState(1);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cotizar = async () => {
    // Validaciones
    if (!codigoPostal || codigoPostal.length !== 5) {
      setError('Por favor ingresa un código postal válido (5 dígitos)');
      return;
    }

    if (peso <= 0 || peso > 50) {
      setError('El peso debe ser entre 0.1 y 50 kg');
      return;
    }

    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const response = await fetch('/api/cotizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: {
            postalCode: codigoPostal
          },
          packages: [{
            weight: peso
          }]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener cotización');
      }

      if (!data.carriers || data.carriers.length === 0) {
        throw new Error('No hay opciones de envío disponibles para este código postal');
      }

      setResultado(data);
    } catch (err) {
      setError(err.message);
      console.error('Error en la cotización:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cotizador de Envíos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="codigoPostal" className="block text-sm font-medium text-gray-700 mb-1">
            Código Postal de Destino
          </label>
          <input
            id="codigoPostal"
            type="text"
            value={codigoPostal}
            onChange={(e) => setCodigoPostal(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej. 64060"
            maxLength={5}
          />
        </div>

        <div>
          <label htmlFor="peso" className="block text-sm font-medium text-gray-700 mb-1">
            Peso del paquete (kg)
          </label>
          <input
            id="peso"
            type="number"
            min="0.1"
            max="50"
            step="0.1"
            value={peso}
            onChange={(e) => setPeso(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={cotizar}
        disabled={cargando || !codigoPostal}
        className={`w-full py-3 px-4 rounded-md text-white font-medium ${cargando || !codigoPostal ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
      >
        {cargando ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cotizando...
          </span>
        ) : 'Cotizar Envío'}
      </button>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-800 mb-1">Error</h3>
          <p className="text-red-700">{error}</p>
          {error.includes('token') && (
            <p className="mt-2 text-sm text-red-600">
              Por favor verifica la configuración del servidor.
            </p>
          )}
        </div>
      )}

      {resultado && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Opciones de envío</h2>
          
          <div className="space-y-4">
            {resultado.carriers.map((carrier, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{carrier.name} - {carrier.service}</h3>
                    <p className="text-sm text-gray-600 mt-1">{carrier.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Entrega estimada: {carrier.deliveryEstimate}
                      {carrier.deliveryDate && (
                        <span> ({carrier.deliveryDate.date})</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-bold text-blue-600">
                      ${carrier.price.toFixed(2)} {carrier.currency}
                    </span>
                    <span className="text-xs text-gray-500">por {carrier.details.quantity} paquete</span>
                  </div>
                </div>

                <button 
                  className="mt-3 w-full py-2 px-4 bg-green-100 text-green-800 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                  onClick={() => console.log('Seleccionar:', carrier)}
                >
                  Seleccionar esta opción
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
            <h3 className="font-medium mb-2">Información adicional:</h3>
            <p>Moneda: {resultado.meta}</p>
            <p>Opciones disponibles: {resultado.carriers.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}