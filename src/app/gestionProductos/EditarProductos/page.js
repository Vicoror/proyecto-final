"use client";
import { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import NavegadorAdmin from "@/components/NavegadorAdmin";

export default function EditarProducto() {
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
  const [selectedInterface, setSelectedInterface] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const router = useRouter();

  // Validaciones
  const validateId = (id) => /^[a-zA-Z0-9_]{1,15}$/.test(id);
  const validateName = (name) => /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]{1,50}$/.test(name);
  const validatePrice = (price) => price >= 20 && price <= 5000;
  const validateDescription = (desc) => {
    const charCount = desc.length;
    return charCount <= 300 && /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,?!]*$/.test(desc);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Ingrese un término de búsqueda");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    setSearchResults([]);

    try {
      const response = await fetch(`/api/productos?search=${encodeURIComponent(searchTerm)}&type=${selectedInterface}`);
      if (!response.ok) throw new Error("Error al buscar productos");

      const data = await response.json();
      const results = Array.isArray(data) ? data : [data];

      if (results.length === 0) {
        throw new Error("No se encontraron productos");
      }

      const normalizedResults = results.map(item => ({
        id: item.id || item.id_productos || item.id_productosPerso || "",
        name: item.nombre || item.name || item.nombrePerso || "",
        price: item.precio || item.price || 0,
        description: item.descripcion || item.description || "",
        category: item.categoria || item.category || "",
        active: item.activo !== undefined ? item.activo : true
      }));

      setSearchResults(normalizedResults);
      setSuccess(`Encontrados: ${normalizedResults.length} productos`);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectProduct = (product) => {
    setProductData({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      image: null,
      active: product.active
    });
    setSearchResults([]);
    setSuccess("Producto seleccionado para edición");
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
  
    if (name === "image") {
      if (files[0]) {
        const img = new Image();
        img.onload = () => {
          if (img.width > 1500 || img.height > 1500) {
            setError("La imagen debe ser menor a 1500x1500 píxeles");
            return;
          }
          setProductData({ ...productData, image: files[0] });
        };
        img.src = URL.createObjectURL(files[0]);
      }
      return;
    }

    if (name === "id" && value.length <= 20) {
      setProductData({ ...productData, id: value });
      return;
    }
  
    if (name === "name" && value.length <= 50) {
      setProductData({ ...productData, name: value });
      return;
    }

    if (name === "price") {
      if (value.length <= 6 && /^[0-9]*$/.test(value)) {
        setProductData({ ...productData, price: value });
      }
      return;
    }

    if (name === "description") {
      if (value.length <= 300 && validateDescription(value)) {
        setProductData({ ...productData, description: value });
      }
      return;
    }
    if (productData.name.length < 15) {
      alert("El nombre debe tener al menos 15 caracteres.");
      return;
    }
   
    if (productData.description.length < 30) {
      alert("La descripción debe tener al menos 30 caracteres.");
      return;
    }

    if (name === "image") {
      if (files[0]) {
        const img = new Image();
        img.onload = () => {
          if (img.width > 1500 || img.height > 1500) {
            setError("La imagen debe ser menor a 1500x1500 píxeles");
            return;
          }
          setProductData({ ...productData, image: files[0] });
        };
        img.src = URL.createObjectURL(files[0]);
      }
    } else {
      setProductData({ ...productData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateId(productData.id)) {
      setError("ID inválido: Solo letras, números y _ (máx. 20 caracteres)");
      return;
    }
    if (!validateName(productData.name)) {
      setError("Nombre inválido (máx. 50 caracteres)");
      return;
    }
    const parsedPrice = Number(productData.price);
    if (
      isNaN(parsedPrice) ||
      !validatePrice(parsedPrice) ||
      productData.price.length > 4
    ) {
      setError("Precio inválido: debe ser un número de máximo 4 cifras entre $20 y $5000");
      return;
    }
    if (selectedInterface === "principal" && !validateDescription(productData.description)) {
      setError("Descripción inválida: Máx. 300 caracteres y signos básicos");
      return;
    }

    const formData = new FormData();
    formData.append('id', productData.id);
    formData.append('name', productData.name);
    formData.append('price', parsedPrice.toString());
    formData.append('category', productData.category);
    formData.append('active', productData.active.toString());
    if (productData.image) formData.append('image', productData.image);
    if (selectedInterface === "principal") formData.append('description', productData.description);

    try {
      const response = await fetch(`/api/productos?type=${selectedInterface}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar");
      }

      alert("Producto actualizado exitosamente");
      router.push("/Admin");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-6 relative" style={{ backgroundImage: "url('/fondo.png')" }}>
      <NavegadorAdmin />
      <div className="absolute inset-0 bg-black opacity-40"></div>
      
      <div className="relative top-15 z-10 w-full max-w-6xl">
        <div className="bg-[#F5F1F1] p-6 rounded-lg shadow-lg border-4 border-[#762114]">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Editar Producto</h2>
          
          <div className="mb-4">
            <label className="block text-[#7B2710] font-semibold mb-2">Interfaz de destino</label>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedInterface("principal");
                  setError("");
                  setSuccess("");
                  setSearchResults([]);
                  setProductData({
                    id: "",
                    name: "",
                    price: "",
                    description: "",
                    category: "",
                    image: null,
                    active: true
                  });
                }}
                className={`py-2 px-4 rounded-md ${selectedInterface === "principal" ? 'bg-[#DC9C5C] text-white' : 'bg-[#8C9560] text-white'}`}
              >
                Página Principal
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedInterface("personalizados");
                  setError("");
                  setSuccess("");
                  setSearchResults([]);
                  setProductData({
                    id: "",
                    name: "",
                    price: "",
                    description: "",
                    category: "",
                    image: null,
                    active: true
                  });
                }}
                className={`py-2 px-4 rounded-md ${selectedInterface === "personalizados" ? 'bg-[#DC9C5C] text-white' : 'bg-[#8C9560] text-white'}`}
              >
                Productos Personalizados
              </button>
            </div>
          </div>

          {selectedInterface && (
            <>
              <div className="mb-4">
                <label className="block text-[#7B2710] font-semibold mb-2">Buscar Producto</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ID, nombre o descripción"
                    className="flex-1 p-2 border border-[#8C9560] rounded-md"
                  />
                  <button 
                    type="button"
                    onClick={handleSearch}
                    className="bg-[#8C9560] text-white py-2 px-4 rounded-md font-semibold hover:bg-[#DC9C5C] transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? "Buscando..." : "Buscar"}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">Busque por ID exacto o palabras clave</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                  <p>{error}</p>
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700">
                  <p>{success}</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="mb-6 bg-white p-4 rounded-lg shadow-md border border-[#8C9560]">
                  <h3 className="font-semibold text-lg mb-3 text-[#7B2710]">Resultados:</h3>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchResults.map((product, index) => (
                      <div
                        key={index}
                        onClick={() => selectProduct(product)}
                        className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <p className="font-medium">{product.name}</p>
                        <div className="flex justify-between text-sm">
                          <span>ID: {product.id}</span>
                          <span>${product.price}</span>
                        </div>
                        {product.category && <p className="text-sm text-gray-600">{product.category}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(productData.id || searchResults.length === 0) && (
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[#7B2710] font-semibold mb-2">ID del Producto</label>
                      <input
                        type="text"
                        name="id"
                        value={productData.id}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-[#8C9560] rounded-md"
                        required
                        maxLength={20}
                      />
                      <p className="text-sm text-gray-600 mt-1">Solo letras, números y _ (máx. 20)</p>
                    </div>

                    <div>
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
                      <p className="text-sm text-gray-600 mt-1">Máximo 50 caracteres</p>
                    </div>

                    <div>
                      <label className="block text-[#7B2710] font-semibold mb-2">Precio ($)</label>
                      <input
                        type="number"
                        name="price"
                        value={productData.price}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-[#8C9560] rounded-md"
                        required
                        min={20}
                        max={5000}
                        step="0.01"
                      />
                      <p className="text-sm text-gray-600 mt-1">Rango: $20 - $5000</p>
                    </div>

                    <div>
                      <label className="block text-[#7B2710] font-semibold mb-2">Categoría</label>
                      <select
                        name="category"
                        value={productData.category}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-[#8C9560] rounded-md"
                        required
                      >
                        {selectedInterface === "principal" ? (
                          <>
                            <option value="">Seleccione categoría</option>
                            {["Anillos", "Collares", "Aretes", "Pulseras", "Brazaletes", "Piedras"].map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </>
                        ) : (
                          <>
                            <option value="">Seleccione categoría</option>
                            <option value="piezas">Piezas</option>
                            <option value="piedras">Piedras</option>
                            <option value="metales">Metales</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {selectedInterface === "principal" && (
                    <div className="mb-4">
                      <label className="block text-[#7B2710] font-semibold mb-2">Descripción</label>
                      <textarea
                        name="description"
                        value={productData.description}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-[#8C9560] rounded-md"
                        rows={4}
                        required
                        maxLength={300}
                      />
                      <p className="text-sm text-gray-600 mt-1">Máximo 300 palabras (300 caracteres)</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-[#7B2710] font-semibold mb-2">Imagen del Producto</label>
                    <input
                      type="file"
                      name="image"
                      onChange={handleInputChange}
                      className="w-full p-2 border border-[#8C9560] rounded-md"
                      accept="image/*"
                    />
                    <p className="text-sm text-gray-600 mt-1">Tamaño máximo: 1500x1500px</p>
                  </div>

                  <div className="mb-6 flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={productData.active}
                      onChange={(e) => setProductData({...productData, active: e.target.checked})}
                      className="h-4 w-4 text-[#8C9560] rounded border-gray-300"
                    />
                    <label htmlFor="active" className="ml-2 text-[#7B2710] font-medium">
                      Producto visible en la tienda
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => router.push("/Admin")}
                      className="bg-[#7B2710] text-white py-2 px-6 rounded-md font-semibold hover:bg-[#DC9C5C] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-[#8C9560] text-white py-2 px-6 rounded-md font-semibold hover:bg-[#DC9C5C] transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}