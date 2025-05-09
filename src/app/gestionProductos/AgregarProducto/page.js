"use client"; // Indica que este componente debe ejecutarse del lado del cliente (no en servidor)

import { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import NavegadorAdmin from "@/components/NavegadorAdmin";

// Componente principal de la página para agregar productos
export default function AgregarProductoPage() {
  // Estado para almacenar los datos del producto
  const [productData, setProductData] = useState({
    id: "",
    name: "",
    price: "",
    description: "",
    category: "",
    image: null,
    active: true
  });

    useEffect(() => {
      const user = localStorage.getItem("user");
      if (!user) {
        router.replace("/login");
      }
    }, []);

  // Estado para saber qué interfaz (sección) fue seleccionada
  const [selectedInterface, setSelectedInterface] = useState("");
  
  // Hook para manejar navegación programática
  const router = useRouter();

  // Función que maneja cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    // Campo ID: solo letras, números, guiones bajos y paréntesis, máximo 20 caracteres
    if (name === "id") {
      const cleanedValue = value.replace(/[^\w()]/g, "").slice(0, 20);
      setProductData({ ...productData, id: cleanedValue });

    // Campo Nombre: limpia caracteres especiales, máximo 40 caracteres
    } else if (name === "name") {
      const cleaned = value.replace(/[^\wñÑáéíóúÁÉÍÓÚ()% ]/g, "").slice(0, 50);
      setProductData({ ...productData, name: cleaned });

    // Campo Precio: acepta solo números y punto decimal, con validación en tiempo real
    } else if (name === "price") {
      let cleanValue = value.replace(/[^\d.]/g, "");
    
      // Permitir máximo dos decimales
      if (cleanValue.includes(".")) {
        const [intPart, decPart] = cleanValue.split(".");
        cleanValue = intPart + "." + decPart.slice(0, 2);
      }
    
      // Limitar el total de caracteres a 6
      cleanValue = cleanValue.slice(0, 6);
    
      setProductData({ ...productData, price: cleanValue });

    // Campo Descripción: limitar a 300 caracteres
    } else if (name === "description") {
      const cleanedDesc = value
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,;:¿?¡!_%\s]/g, "")
      .slice(0, 300);
      setProductData({ ...productData, description: cleanedDesc });

      // Campo Imagen: validar que sea imagen y no supere los 1500x1500 px
} else if (name === "image") {
  const file = files[0];

  if (!file.type.startsWith("image/")) {
    alert("El archivo debe ser una imagen (formatos permitidos: JPG, PNG, etc.).");
    return;
  }

  const img = new Image();
  img.onload = () => {
    if (img.width > 1500 || img.height > 1500) {
      alert("La imagen no debe superar los 1500x1500 px.");
    } else {
      setProductData({ ...productData, image: file });
    }
  };
  img.onerror = () => {
    alert("El archivo seleccionado no es una imagen válida.");
  };

  img.src = URL.createObjectURL(file);


    // Para los demás campos (como categoría)
    } else {
      setProductData({ ...productData, [name]: value });
    }
  };

const handlePriceBlur = () => {
  // Solo validación visual opcional o dejar vacío
};

  // Función que maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Aplicar validación de precio antes de enviar
    const numericValue = parseFloat(productData.price);
    if (isNaN(numericValue) || numericValue < 20 || numericValue > 5000) {
      alert("El precio debe estar entre $20 y $5000.");
      return;
    }

    if (productData.name.length < 15) {
      alert("El nombre debe tener al menos 15 caracteres.");
      return;
    }
    if (productData.id.length < 10) {
      alert("El id debe tener al menos 10 caracteres.");
      return;
    }
    if (productData.description.length < 30) {
      alert("La descripción debe tener al menos 30 caracteres.");
      return;
    }

    // Construir FormData para enviar datos, incluyendo imagen
    const formData = new FormData();
    formData.append("id", productData.id);
    formData.append("name", productData.name);
    formData.append("price", productData.price);
    formData.append("category", productData.category);
    if (productData.image) {
      formData.append("image", productData.image);
    }
    formData.append("active", productData.active.toString());
    formData.append("description", productData.description);

    try {
      // Enviar la solicitud a la API
      const response = await fetch("/api/productos", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      // Manejo de errores
      if (!response.ok) {
        throw new Error(data.message || "Error al guardar el producto");
      }

      alert("Producto guardado exitosamente");
      router.push("/Admin"); // Redirigir a inicio (puedes cambiarlo si quieres ir a /Admin)

    } catch (error) {
      console.error("Error detallado:", error);
      alert(`Error al guardar el producto: ${error.message}`);
    }
  };

  // Renderizado del formulario
  return (
    <div
      className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-6 relative"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      <NavegadorAdmin /> {/* Barra de navegación del admin */}
      <div className="absolute inset-0 bg-black opacity-40"></div> {/* Capa de fondo oscuro encima */}

      <div className="relative top-15 z-10 w-full max-w-6xl">
        <div className="bg-[#F5F1F1] p-6 rounded-lg shadow-lg border-4 border-[#762114]">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Agregar Producto</h2>

          {/* Formulario para ingresar datos del producto */}
          <form onSubmit={handleSubmit}>
            {/* Selector de la interfaz destino */}
            <div className="mb-4">
              <label className="block text-[#7B2710] font-semibold mb-2">Interfaz de destino</label>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedInterface("principal")}
                  className={`py-2 px-4 rounded-md ${selectedInterface === "principal" ? "bg-[#DC9C5C] text-[#F5F1F1]" : "bg-[#8C9560] text-[#F5F1F1]"}`}
                >
                  Página Principal
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInterface("personalizados")}
                  className={`py-2 px-4 rounded-md ${selectedInterface === "personalizados" ? "bg-[#DC9C5C] text-[#F5F1F1]" : "bg-[#8C9560] text-[#F5F1F1]"}`}
                >
                  Productos Personalizados
                </button>
              </div>
            </div>

            {/* Mostrar campos solo si se seleccionó "principal" */}
            {selectedInterface === "principal" && (
              <>
                {/* Campo ID del producto */}
                <div className="mb-4">
                  <label className="block text-[#7B2710] font-semibold mb-2">ID Producto</label>
                  <input
                    type="text"
                    name="id"
                    value={productData.id}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-[#8C9560] rounded-md"
                    required
                    maxLength={20}
                  />
                  <p className="text-sm text-gray-600 mt-1">{productData.id.length}/20 caracteres</p>
                </div>

                {/* Campo Nombre */}
                <div className="mb-4">
                  <label className="block text-[#7B2710] font-semibold mb-2">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={productData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-[#8C9560] rounded-md"
                    required
                    maxLength={50}
                  />
                  <p className="text-sm text-gray-600 mt-1">{productData.name.length}/50 caracteres</p>
                </div>

                {/* Campo Precio */}
                <div className="mb-4">
                  <label className="block text-[#7B2710] font-semibold mb-2">Precio</label>
                  <input
                    type="text"
                    name="price"
                    value={productData.price}
                    onChange={handleInputChange}
                    onBlur={handlePriceBlur}
                    className="w-full p-2 border border-[#8C9560] rounded-md"
                    required
                    placeholder="Ej. 100.00 min 20.00 max 5000"
                  />
                </div>

                {/* Campo Categoría */}
                <div className="mb-4">
                  <label className="block text-[#7B2710] font-semibold mb-2">Categoría</label>
                  <select
                    name="category"
                    value={productData.category}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-[#8C9560] rounded-md"
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    {["Anillos", "Collares", "Aretes", "Pulseras", "Brazaletes", "Piedras"].map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Campo Descripción */}
                <div className="mb-4">
                  <label className="block text-[#7B2710] font-semibold mb-2">Descripción</label>
                  <textarea
                    name="description"
                    value={productData.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-[#8C9560] rounded-md"
                    rows="3"
                    maxLength={300}
                    required
                  ></textarea>
                  <p className="text-sm text-gray-600 mt-1">{productData.description.length}/300 caracteres</p>
                </div>

                {/* Campo Imagen */}
                <div className="mb-4">
                  <label className="block text-[#7B2710] font-semibold mb-2">Imagen</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="w-full p-2 border border-[#8C9560] rounded-md"
                    required
                  />
                </div>

                {/* Checkbox Activo */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2 text-[#7B2710] font-semibold">
                    <input
                      type="checkbox"
                      name="active"
                      checked={productData.active}
                      onChange={(e) =>
                        setProductData({ ...productData, active: e.target.checked })
                      }
                      className="rounded border-[#8C9560]"
                    />
                    <span>Producto activo (visible en la tienda)</span>
                  </label>
                </div>

                {/* Botones Cancelar y Guardar */}
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => router.push("/Admin")}
                    className="bg-[#7B2710] text-[#F5F1F1] py-2 px-4 rounded-md font-semibold hover:bg-[#DC9C5C] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#8C9560] text-[#F5F1F1] py-2 px-4 rounded-md font-semibold hover:bg-[#DC9C5C] transition-all"
                  >
                    Guardar Producto
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}