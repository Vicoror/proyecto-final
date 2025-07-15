import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      throw new Error('No se recibió archivo');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      upload_preset: 'preset_publico',
      folder: 'publicidad'
    });

    return NextResponse.json({ url: result.secure_url });
    
  } catch (error) {
    console.error('Error en /api/subir-imagen:', {
      message: error.message,
      stack: error.stack,
      error: error
    });

    return NextResponse.json(
      { error: error.message || 'Error al subir imagen' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};