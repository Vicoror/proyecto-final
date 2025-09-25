"use client";
import { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft} from "lucide-react";

export default function EditarProducto() {
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
  const [selectedInterface, setSelectedInterface] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
  }, []);

  // Validaciones
  const validateId = (id) => /^[a-zA-Z0-9_]{1,20}$/.test(id);
  const validateName = (name) => /^[a-zA-Z0-9_ñÑáéíóúÁÉÍÓÚ\s]{15,50}$/.test(name);
  const validatePrice = (price) => price >= 20 && price <= 5000;
  const validateDescription = (desc) => {
    const charCount = desc.length;
    return (
      charCount <= 300 &&
      /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ.,:;!%?'"()\-]*$/.test(desc)
    );
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
        active: item.activo !== undefined ? item.activo : true,
        stock: item.stock ?? 0
      }));

      setSearchResults(normalizedResults);
      setSuccess(`Encontrados: ${normalizedResults.length} productos`);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (["image", "image2", "image3"].includes(name)) {
      const file = files[0];
      if (!file) return;

      const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (!file.type.startsWith("image/") || !validExtensions.includes(fileExtension)) {
        setError("Solo se permiten archivos de imagen válidos (.jpg, .jpeg, .png, .gif, .webp)");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = () => {
          if (img.width > 1500 || img.height > 1500) {
            setError("La imagen debe ser menor a 1500x1500 píxeles");
            return;
          }
          setProductData({ ...productData, [name]: file });
        };
        img.onerror = () => {
          setError("El archivo no es una imagen válida.");
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      return;
    }

    if (name === "id") {
      const cleaned = value.replace(/[^\w]/g, "").slice(0, 20);
      setProductData({ ...productData, id: cleaned });
      return;
    }

    if (name === "name") {
      const cleaned = value
        .replace(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ_%\s]/g, "")
        .slice(0, 50);
      setProductData({ ...productData, name: cleaned });
      return;
    }

    if (name === "price") {
      if (value.length <= 6 && /^[0-9]*$/.test(value)) {
        setProductData({ ...productData, price: value });
      }
      return;
    }

    if (name === "stock") {
      if (value === "") {
        setProductData({ ...productData, stock: "" }); // permitir borrar
      } else {
        const intVal = parseInt(value);
        if (!isNaN(intVal) && intVal >= 0 && intVal <= 50) {
          setProductData({ ...productData, stock: intVal });
        }
      }
      return;
    }

    if (name === "description") {
      if (value.length <= 300 && validateDescription(value)) {
        setProductData({ ...productData, description: value });
      }
      return;
    }

    setProductData({ ...productData, [name]: value });
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
      productData.price.length > 6
    ) {
      setError("Precio inválido: debe ser un número de máximo 4 cifras entre $20 y $5000");
      return;
    }
    if (selectedInterface === "principal" && !validateDescription(productData.description)) {
      setError("Descripción inválida: Máx. 300 caracteres y signos básicos");
      return;
    }
    if (productData.name.length < 15) {
      setError("El nombre debe tener al menos 15 caracteres.");
      return;
    }

    if (selectedInterface === "principal" && productData.description.length < 30) {
      setError("La descripción debe tener al menos 30 caracteres.");
      return;
    }

    const formData = new FormData();
    formData.append('id', productData.id);
    formData.append('name', productData.name);
    formData.append('price', parsedPrice.toString());
    formData.append('category', productData.category);
    formData.append('active', productData.active.toString());
    formData.append('stock', productData.stock?.toString() ?? "0");

    if (productData.image) formData.append('image', productData.image);
    if (productData.image2) formData.append('image2', productData.image2);
    if (productData.image3) formData.append('image3', productData.image3);
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

  function selectProduct(product) {
    setProductData({
      ...product,
      image: null,
      image2: null,
      image3: null
    });
    setError("");
    setSuccess("");
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-2 relative" style={{ backgroundImage: "url('/fondo.png')" }}>
      <NavegadorAdmin />
      <div className="absolute inset-0 bg-black opacity-40"></div>
      
      <div className="relative z-10 px-2 sm:px-0 pt-20 pb-10 w-full max-w-[1500px] mx-auto">
        <div className="w-full max-w-[99.5vw] max-w-5xl mx-auto mb-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-[#F5F1F1] transition-colors"
          >
            <ArrowLeft className="mr-2" size={30} />
            Anterior
          </button>
        </div>
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
                    router.push('/productosPersonalizados/EditarPP');
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
                    onChange={(e) => {
                      const valor = e.target.value;
                      if (
                        valor.length <= 30 &&
                        /^[a-zA-Z0-9\s-_]*$/.test(valor)
                      ) {
                        setSearchTerm(valor);
                      }
                    }}
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
                    <div className="mb-4">
        <label className="block text-[#7B2710] font-semibold mb-2">Imagen 2 (opcional)</label>
        <input
          type="file"
          name="image2"
          onChange={handleInputChange}
          className="w-full p-2 border border-[#8C9560] rounded-md"
          accept="image/*"
        />
      </div>

      <div className="mb-4">
        <label className="block text-[#7B2710] font-semibold mb-2">Imagen 3 (opcional)</label>
        <input
          type="file"
          name="image3"
          onChange={handleInputChange}
          className="w-full p-2 border border-[#8C9560] rounded-md"
          accept="image/*"
        />
      </div>

      <div className="mb-4">
        <label className="block text-[#7B2710] font-semibold mb-2">Stock</label>
        <input
          type="number"
          name="stock"
          value={productData.stock ?? ""}
          onChange={handleInputChange}
          className="w-full p-2 border border-[#8C9560] rounded-md"
          min={0}
          max={50}
        />
        <p className="text-sm text-gray-600 mt-1">Rango permitido: 0 a 50 unidades</p>
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