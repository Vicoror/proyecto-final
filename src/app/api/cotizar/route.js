import { NextResponse } from 'next/server';

export async function POST(request) {
  const ENVIA_API_TOKEN = process.env.ENVIA_API_TOKEN;
  const ENVIA_API_URL = 'https://api-test.envia.com/ship/rate/';

  // Validar token
  if (!ENVIA_API_TOKEN) {
    return NextResponse.json(
      { 
        error: 'Configuración incompleta',
        message: 'El token de API no está configurado' 
      },
      { status: 500 }
    );
  }

  try {
    const requestData = await request.json();

    // Validación de datos de entrada
    if (!requestData.destination?.postalCode) {
      return NextResponse.json(
        { 
          error: 'Datos incompletos',
          message: 'El código postal de destino es requerido' 
        },
        { status: 400 }
      );
    }

    // Construir payload para Envia.com
    const payload = {
      origin: {
        postalCode: requestData.origin?.postalCode || "09870",
        country: "MX",
        city: "Ciudad de México",
        state: "CDMX"
      },
      destination: {
        postalCode: requestData.destination.postalCode,
        country: "MX"
      },
      packages: [
        {
          type: "box",
          weight: requestData.packages?.[0]?.weight || 1,
          dimensions: requestData.packages?.[0]?.dimensions || {
            length: 20,
            width: 20,
            height: 20
          }
        }
      ],
      settings: {
        currency: "MXN",
        shipment_type: "all"
      }
    };

    // Realizar la petición a Envia.com
    const response = await fetch(ENVIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENVIA_API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    // Manejar respuesta no JSON
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Respuesta no JSON de Envia.com:', responseText);
      return NextResponse.json(
        { 
          error: 'Error en la API',
          message: 'La respuesta no es válida',
          apiResponse: responseText.slice(0, 300) 
        },
        { status: 502 }
      );
    }

    // Manejar errores de la API
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Error en Envia.com',
          message: responseData.message || 'Error al obtener cotización',
          details: responseData
        },
        { status: response.status }
      );
    }

    // Validar estructura de respuesta
    if (!responseData.data || !Array.isArray(responseData.data)) {
      return NextResponse.json(
        { 
          error: 'Estructura de datos inválida',
          message: 'La respuesta no contiene opciones de envío',
          details: responseData
        },
        { status: 502 }
      );
    }

    // Transformar datos para el frontend
    const transformedData = {
      meta: responseData.meta,
      carriers: responseData.data.map(item => ({
        name: item.carrier,
        service: item.service,
        description: item.serviceDescription,
        deliveryEstimate: item.deliveryEstimate,
        deliveryDate: item.deliveryDate,
        price: item.totalPrice,
        currency: item.currency,
        details: item
      }))
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { 
        error: 'Error interno',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}