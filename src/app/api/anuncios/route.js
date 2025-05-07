import fs from "fs";
import path from "path";  // Agregar esta línea para importar el módulo 'path'

export const GET = async () => {
    const filePath = path.join(process.cwd(), "src", "data", "anuncios.json");
    const fileData = fs.readFileSync(filePath, "utf-8");
  
    //console.log("Anuncios leídos desde el archivo:", fileData);  // Verifica el contenido del archivo
  
    const anuncios = JSON.parse(fileData);
    //console.log("Anuncios convertidos a objeto:", anuncios);  // Verifica los anuncios después de parsear
  
    return new Response(JSON.stringify(anuncios), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  
  export const POST = async (req) => {
    const body = await req.json();
    const nuevosAnuncios = body.nuevosAnuncios;
  
    console.log("Nuevos anuncios recibidos:", nuevosAnuncios);  // Verifica lo que se recibe en el POST
  
    const filePath = path.join(process.cwd(), "src", "data", "anuncios.json");
    fs.writeFileSync(filePath, JSON.stringify(nuevosAnuncios, null, 2), "utf-8");
  
    return new Response(JSON.stringify({ message: "Anuncios actualizados correctamente" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  
