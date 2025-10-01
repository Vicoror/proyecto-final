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

  // Estados para validaciones en tiempo real
  const [validations, setValidations] = useState({
    id: { isValid: true, message: "" },
    name: { isValid: true, message: "" },
    price: { isValid: true, message: "" },
    description: { isValid: true, message: "" },
    image: { isValid: true, message: "" },
    stock: { isValid: true, message: "" }
  });

  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, []);

  useEffect(() => {
  // Cargar catálogo de tallas cuando se renderiza la página
  const fetchTallas = async () => {
    try {
      const res = await fetch("/api/tallas_anillos"); // <-- deberás tener este endpoint
      const data = await res.json();
      setTallas(data); 
      
      // Inicializar stock en 0 para cada talla
      const inicial = {};
      data.forEach(t => inicial[t.id_talla] = 0);
      setStockPorTalla(inicial);
    } catch (error) {
      console.error("Error al cargar tallas:", error);
    }
  };

  fetchTallas();
}, []);


  const [selectedInterface, setSelectedInterface] = useState("");
  const [tallas, setTallas] = useState([]);
  const [stockPorTalla, setStockPorTalla] = useState({});

  // Función para validar en tiempo real
  const validateField = (name, value, file = null) => {
    switch (name) {
      case "id":
        if (value.length < 5) {
          return { isValid: false, message: "Mínimo 5 caracteres" };
        } else if (value.length > 40) {
          return { isValid: false, message: "Máximo 40 caracteres" };
        } else if (!/^[\w()]+$/.test(value)) {
          return { isValid: false, message: "Solo letras, números, _ y ()" };
        }
        return { isValid: true, message: "" };

      case "name":
        if (value.length < 15) {
          return { isValid: false, message: "Mínimo 15 caracteres" };
        } else if (value.length > 70) {
          return { isValid: false, message: "Máximo 70 caracteres" };
        } else if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value)) {
          return { isValid: false, message: "Debe contener letras" };
        } else if (!/^[\wñÑáéíóúÁÉÍÓÚ()% ]+$/.test(value)) {
          return { isValid: false, message: "Caracteres no permitidos" };
        }
        return { isValid: true, message: "" };

      case "price":
        const numericPrice = parseInt(value);
        if (isNaN(numericPrice)) {
          return { isValid: false, message: "Solo números enteros" };
        } else if (numericPrice < 100) {
          return { isValid: false, message: "Mínimo 100" };
        } else if (numericPrice > 5000) {
          return { isValid: false, message: "Máximo 5000" };
        }
        return { isValid: true, message: "" };

      case "description":
        if (value.length < 30) {
          return { isValid: false, message: "Mínimo 30 caracteres" };
        } else if (value.length > 600) {
          return { isValid: false, message: "Máximo 600 caracteres" };
        } else if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value)) {
          return { isValid: false, message: "Debe contener letras" };
        } else if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,;:¿?!_%\s]+$/.test(value)) {
          return { isValid: false, message: "Caracteres no permitidos" };
        }
        return { isValid: true, message: "" };

      case "image":
      case "image2":
      case "image3":
        if (file && !file?.type.startsWith("image/")) {
          return { isValid: false, message: "El archivo debe ser una imagen" };
        }
        return { isValid: true, message: "" };

      case "stock":
        const stockValue = parseInt(value);
        if (isNaN(stockValue)) {
          return { isValid: false, message: "Debe ser un número" };
        } else if (stockValue < 0) {
          return { isValid: false, message: "Mínimo 0" };
        } else if (stockValue > 50) {
          return { isValid: false, message: "Máximo 50" };
        }
        return { isValid: true, message: "" };

      default:
        return { isValid: true, message: "" };
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    let newValue = value;

    // Aplicar las restricciones existentes
    if (name === "id") {
      newValue = value.replace(/[^\w()]/g, "").slice(0, 20);
      setProductData({ ...productData, id: newValue });
    } else if (name === "name") {
      newValue = value.replace(/[^\wñÑáéíóúÁÉÍÓÚ()% ]/g, "").slice(0, 70);
      setProductData({ ...productData, name: newValue });
    } else if (name === "price") {
      newValue = value.replace(/[^\d]/g, "").slice(0, 5);
      setProductData({ ...productData, price: newValue });
    } else if (name === "description") {
      newValue = value
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,;:¿?!_%\s]/g, "")
        .slice(0, 600);
      setProductData({ ...productData, description: newValue });
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
          // Validar la imagen
          const validation = validateField(name, "", file);
          setValidations(prev => ({ ...prev, [name]: validation }));
        }
      };
      img.onerror = () => alert("El archivo seleccionado no es una imagen válida.");
      img.src = URL.createObjectURL(file);
      return;
    } else if (name === "stock") {
      let valueStock = parseInt(value, 10);
      if (isNaN(valueStock)) valueStock = 0;
      if (valueStock < 0) valueStock = 0;
      if (valueStock > 50) valueStock = 50;
      setProductData({ ...productData, stock: valueStock });
      newValue = valueStock.toString();
    } else {
      setProductData({ ...productData, [name]: value });
    }

    // Validar en tiempo real
    const validation = validateField(name, newValue);
    setValidations(prev => ({ ...prev, [name]: validation }));
  };

  const handlePriceBlur = () => {
    // Validación adicional para precio
    const validation = validateField("price", productData.price);
    setValidations(prev => ({ ...prev, price: validation }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar todos los campos antes de enviar
    const finalValidations = {
      id: validateField("id", productData.id),
      name: validateField("name", productData.name),
      price: validateField("price", productData.price),
      description: validateField("description", productData.description),
      image: validateField("image", "", productData.image),
      stock: validateField("stock", productData.stock.toString())
    };

    setValidations(finalValidations);

    // Verificar si hay algún error
    const hasErrors = Object.values(finalValidations).some(validation => !validation.isValid);
    
    if (hasErrors) {
      alert("Por favor, corrige los errores en el formulario antes de enviar.");
      return;
    }

    // Resto del código de envío permanece igual...
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
    if (productData.category === "Anillos") {
      formData.append("stockPorTalla", JSON.stringify(stockPorTalla));
    }
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
    } catch (error) {
      console.error("Error detallado:", error);
      alert(`Error al guardar el producto: ${error.message}`);
    }
  };

  // Función para obtener la clase CSS según la validación
  const getInputClass = (fieldName) => {
    return `w-full p-2 border rounded-md ${
      validations[fieldName]?.isValid 
        ? "border-[#8C9560]" 
        : "border-red-500 bg-red-50"
    }`;
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
                    <label className="block text-[#7B2710] font-semibold mb-2">Identificador de Producto</label>
                    <input 
                      type="text" 
                      name="id" 
                      value={productData.id} 
                      onChange={handleInputChange} 
                      className={getInputClass("id")} 
                      required 
                      maxLength={40} 
                    />
                    <p className={`text-sm mt-1 ${
                      validations.id?.isValid ? "text-gray-600" : "text-red-600"
                    }`}>
                      {validations.id?.message || "Mínimo 5, máximo 40 caracteres (letras, números, _ y ())"}
                    </p>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Nombre</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={productData.name} 
                      onChange={handleInputChange} 
                      className={getInputClass("name")} 
                      required 
                      maxLength={70} 
                    />
                    <p className={`text-sm mt-1 ${
                      validations.name?.isValid ? "text-gray-600" : "text-red-600"
                    }`}>
                      {validations.name?.message || "Mínimo 15, máximo 70 caracteres (debe contener letras)"}
                    </p>
                  </div>
                </div>

                {/* Precio y Categoría */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Precio</label>
                    <input 
                      type="text" 
                      name="price" 
                      value={productData.price} 
                      onChange={handleInputChange} 
                      onBlur={handlePriceBlur} 
                      className={getInputClass("price")} 
                      required 
                      placeholder="Ej. 100 mínimo, 5000 máximo" 
                    />
                    <p className={`text-sm mt-1 ${
                      validations.price?.isValid ? "text-gray-600" : "text-red-600"
                    }`}>
                      {validations.price?.message || "Solo números enteros entre 100 y 5000"}
                    </p>
                  </div>
                  <div className="w-full sm:w-1/2">
                      <label className="block text-[#7B2710] font-semibold mb-2">
                        Categoría
                      </label>
                      <select
                        name="category"
                        value={productData.category}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-[#8C9560] rounded-md"
                        required
                      >
                        <option value="">Seleccione una categoría</option>
                        {[
                          "Anillos",
                          "Collares",
                          "Aretes",
                          "Pulseras",
                          "Brazaletes",
                          "Piedras",
                        ].map((cat, i) => (
                          <option key={i} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                  {productData.category === "Anillos" && (
                      <div className="w-full mt-4">
                        <label className="block text-[#7B2710] font-semibold mb-2">
                          Tallas y stock
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {tallas.map((t) => (
                            <div key={t.id_talla} className="flex items-center gap-2">
                              <span className="w-16">{t.talla}</span>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={stockPorTalla[t.id_talla] ?? ""}
                                onChange={(e) => {
                                  let value = e.target.value;
                                  // Eliminar cualquier carácter que no sea número
                                  value = value.replace(/\D/g, "");
                                  // Limitar a 50
                                  if (value !== "" && parseInt(value) > 50) {
                                    value = "50";
                                  }
                                  setStockPorTalla({
                                    ...stockPorTalla,
                                    [t.id_talla]: value === "" ? "" : parseInt(value),
                                  });
                                }}
                                className="w-20 p-1 border border-[#8C9560] rounded-md"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Descripción */}
                <div className="mb-4">
                  <label className="block text-[#7B2710] font-semibold mb-2">Descripción</label>
                  <textarea 
                    name="description" 
                    value={productData.description} 
                    onChange={handleInputChange} 
                    className={getInputClass("description")} 
                    rows="3" 
                    maxLength={600} 
                    required
                  ></textarea>
                  <p className={`text-sm mt-1 ${
                      validations.description?.isValid ? "text-gray-600" : "text-red-600"
                    }`}>
                    {validations.description?.message || "Mínimo 30, máximo 600 caracteres (debe contener letras)"}
                  </p>
                </div>

                {/* Imágenes, stock y activo */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4 flex-wrap">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Imagen Principal</label>
                    <input 
                      type="file" 
                      name="image" 
                      accept="image/*" 
                      onChange={handleInputChange} 
                      className={getInputClass("image")} 
                      required 
                    />
                    <p className={`text-sm mt-1 ${
                      validations.image?.isValid ? "text-gray-600" : "text-red-600"
                    }`}>
                      {validations.image?.message || "Formatos: JPG, PNG, etc. (máx. 1500x1500px)"}
                    </p>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Imagen 2 (opcional)</label>
                    <input type="file" name="image2" accept="image/*" onChange={handleInputChange} className="w-full p-2 border border-[#8C9560] rounded-md" />
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[#7B2710] font-semibold mb-2">Imagen 3 (opcional)</label>
                    <input type="file" name="image3" accept="image/*" onChange={handleInputChange} className="w-full p-2 border border-[#8C9560] rounded-md" />
                  </div>
                  {/* 🔹 OCULTAR STOCK SI ES ANILLO - MOSTRAR SOLO PARA OTRAS CATEGORÍAS */}
                    {productData.category !== "Anillos" && (
                      <div className="w-full sm:w-1/2">
                        <label className="block text-[#7B2710] font-semibold mb-2">Stock</label>
                        <input 
                          type="number" 
                          name="stock" 
                          value={productData.stock} 
                          onChange={handleInputChange} 
                          min={0} 
                          max={50} 
                          className={getInputClass("stock")} 
                          required 
                        />
                        <p className={`text-sm mt-1 ${
                          validations.stock?.isValid ? "text-gray-600" : "text-red-600"
                        }`}>
                          {validations.stock?.message || "Cantidad entre 0 y 50"}
                        </p>
                      </div>
                    )}
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