"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft } from "lucide-react";

export default function AgregarProductoPage() {
  const [productData, setProductData] = useState({
    id: "",
    name: "",
    price: "",
    description: "",
    category: "",
    image: null,
    image2: null,
    image3: null,
    stock: 0,
    active: true
  });

  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, []);

  const [selectedInterface, setSelectedInterface] = useState("");

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "id") {
      const cleanedValue = value.replace(/[^\w()]/g, "").slice(0, 20);
      setProductData({ ...productData, id: cleanedValue });
    } else if (name === "name") {
      const cleaned = value.replace(/[^\wñÑáéíóúÁÉÍÓÚ()% ]/g, "").slice(0, 50);
      setProductData({ ...productData, name: cleaned });
    } else if (name === "price") {
      let cleanValue = value.replace(/[^\d]/g, "");
      cleanValue = cleanValue.slice(0, 5);
      setProductData({ ...productData, price: cleanValue });
    } else if (name === "description") {
      const cleanedDesc = value
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,;:¿?!_%\s]/g, "")
        .slice(0, 300);
      setProductData({ ...productData, description: cleanedDesc });
    } else if (name === "image" || name === "image2" || name === "image3") {
      const file = files[0];
      if (!file?.type.startsWith("image/")) {
        alert("El archivo debe ser una imagen (JPG, PNG, etc.)");
        return;
      }
      const img = new Image();
      img.onload = () => {
        if (img.width > 1500 || img.height > 1500) {
          alert("La imagen no debe superar los 1500x1500 px.");
        } else {
          setProductData({ ...productData, [name]: file });
        }
      };
      img.onerror = () => alert("El archivo seleccionado no es una imagen válida.");
      img.src = URL.createObjectURL(file);
    } else if (name === "stock") {
      let valueStock = parseInt(value, 10);
      if (isNaN(valueStock)) valueStock = 0;
      if (valueStock < 0) valueStock = 0;
      if (valueStock > 50) valueStock = 50;
      setProductData({ ...productData, stock: valueStock });
    } else {
      setProductData({ ...productData, [name]: value });
    }
  };

  const handlePriceBlur = () => {};

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numericPrice = parseInt(productData.price);
    const nameHasLetters = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(productData.name);
    const descHasLetters = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(productData.description);

    if (isNaN(numericPrice) || numericPrice < 100 || numericPrice > 5000) {
      alert("El precio debe ser un número entero entre 100 y 5000.");
      return;
    }
    if (productData.name.length < 15 || !nameHasLetters) {
      alert("El nombre debe tener al menos 15 caracteres y contener letras.");
      return;
    }
    if (productData.id.length < 10) {
      alert("El ID debe tener al menos 10 caracteres.");
      return;
    }
    if (productData.description.length < 30 || !descHasLetters) {
      alert("La descripción debe tener al menos 30 caracteres y contener letras.");
      return;
    }

    const formData = new FormData();
    formData.append("id", productData.id);
    formData.append("name", productData.name);
    formData.append("price", productData.price);
    formData.append("category", productData.category);
    formData.append("description", productData.description);
    formData.append("stock", productData.stock);
    formData.append("active", productData.active.toString());
    if (productData.image) formData.append("image", productData.image);
    if (productData.image2) formData.append("image2", productData.image2);
    if (productData.image3) formData.append("image3", productData.image3);

    try {
      const response = await fetch("/api/productos", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al guardar el producto");
      alert("Producto guardado exitosamente");
      router.push("/Admin");
    } catch (error) {
      console.error("Error detallado:", error);
      alert(`Error al guardar el producto: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-0 relative" style={{ backgroundImage: "url('/fondo.png')" }}>
      <NavegadorAdmin />
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <div className="relative z-10 px-2 sm:px-0 pt-20 pb-8 w-full max-w-[98vw] mx-auto">
        <div className="w-full max-w-5xl mx-auto mb-4 max-w-[98vw]">
          <button onClick={() => router.back()} className="flex items-center text-white hover:text-[#F5F1F1] transition-colors">
            <ArrowLeft className="mr-2" size={30} />
            Anterior
          </button>
        </div>
        <div className="bg-[#F5F1F1] p-6 rounded-lg shadow-lg border-4 border-[#762114]">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Agregar Producto</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[#7B2710] font-semibold mb-2">Interfaz de destino</label>
              <div className="flex flex-wrap gap-4">
                <button type="button" onClick={() => setSelectedInterface("principal")} className={`py-2 px-4 rounded-md ${selectedInterface === "principal" ? "bg-[#DC9C5C] text-[#F5F1F1]" : "bg-[#8C9560] text-[#F5F1F1]"}`}>Página Principal</button>
                <button
                    type="button"
                    onClick={() => router.push('/productosPersonalizados/AgregarPP')}
                    className={`py-2 px-4 rounded-md transition-colors duration-300 ${
                      selectedInterface === "personalizados" 
                        ? "bg-[#DC9C5C] text-[#F5F1F1]" 
                        : "bg-[#8C9560] text-[#F5F1F1] hover:bg-[#7B8560]"
                    }`}
                  >
                    Productos Personalizados
                  </button>
              </div>
            </div>

            {selectedInterface === "principal" && (
              <>
                {/* ID y Nombre */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">ID Producto</label>
                    <input type="text" name="id" value={productData.id} onChange={handleInputChange} className="w-full p-2 border border-[#8C9560] rounded-md" required maxLength={20} />
                    <p className="text-sm text-gray-600 mt-1">Máximo 20 caracteres</p>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Nombre</label>
                    <input type="text" name="name" value={productData.name} onChange={handleInputChange} className="w-full p-2 border border-[#8C9560] rounded-md" required maxLength={50} />
                    <p className="text-sm text-gray-600 mt-1">Mínimo 15, máximo 50 caracteres (debe contener letras)</p>
                  </div>
                </div>

                {/* Precio y Categoría */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Precio</label>
                    <input type="text" name="price" value={productData.price} onChange={handleInputChange} onBlur={handlePriceBlur} className="w-full p-2 border border-[#8C9560] rounded-md" required placeholder="Ej. 100 mínimo, 5000 máximo" />
                    <p className="text-sm text-gray-600 mt-1">Solo números enteros entre 100 y 5000</p>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Categoría</label>
                    <select name="category" value={productData.category} onChange={handleInputChange} className="w-full p-2 border border-[#8C9560] rounded-md" required>
                      <option value="">Seleccione una categoría</option>
                      {["Anillos", "Collares", "Aretes", "Pulseras", "Brazaletes", "Piedras"].map((cat, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descripción */}
                <div className="mb-4">
                  <label className="block text-[#7B2710] font-semibold mb-2">Descripción</label>
                  <textarea name="description" value={productData.description} onChange={handleInputChange} className="w-full p-2 border border-[#8C9560] rounded-md" rows="3" maxLength={300} required></textarea>
                  <p className="text-sm text-gray-600 mt-1">Mínimo 30, máximo 300 caracteres (debe contener letras)</p>
                </div>

                {/* Imágenes, stock y activo */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4 flex-wrap">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Imagen Principal</label>
                    <input type="file" name="image" accept="image/*" onChange={handleInputChange} className="w-full p-2 border border-[#8C9560] rounded-md" required />
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Imagen 2 (opcional)</label>
                    <input type="file" name="image2" accept="image/*" onChange={handleInputChange} className="w-full p-2 border border-[#8C9560] rounded-md" />
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Imagen 3 (opcional)</label>
                    <input type="file" name="image3" accept="image/*" onChange={handleInputChange} className="w-full p-2 border border-[#8C9560] rounded-md" />
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Stock</label>
                    <input type="number" name="stock" value={productData.stock} onChange={handleInputChange} min={0} max={50} className="w-full p-2 border border-[#8C9560] rounded-md" required />
                    <p className="text-sm text-gray-600 mt-1">Cantidad entre 0 y 50</p>
                  </div>
                  <div className="w-full sm:w-1/2 flex items-end">
                    <label className="flex items-center space-x-2 text-[#7B2710] font-semibold">
                      <input type="checkbox" name="active" checked={productData.active} onChange={(e) => setProductData({ ...productData, active: e.target.checked })} className="rounded border-[#8C9560]" />
                      <span>Producto activo (visible en la tienda)</span>
                    </label>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <button type="button" onClick={() => router.push("/Admin")} className="bg-[#7B2710] text-[#F5F1F1] py-2 px-4 rounded-md font-semibold hover:bg-[#DC9C5C] transition-all">Cancelar</button>
                  <button type="submit" className="bg-[#8C9560] text-[#F5F1F1] py-2 px-4 rounded-md font-semibold hover:bg-[#DC9C5C] transition-all">Guardar Producto</button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
