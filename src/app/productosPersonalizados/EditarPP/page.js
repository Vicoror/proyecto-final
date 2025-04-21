"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

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
  const [selectedInterface, setSelectedInterface] = useState("");
  const [searchId, setSearchId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/productos?id=${searchId}&type=${selectedInterface}`);
      const data = await response.json();
      
      if (response.ok) {
        setProductData({
          ...data,
          image: null // No mostramos la imagen existente para no complicar la edición
        });
      } else {
        throw new Error(data.message || "Producto no encontrado");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setProductData({...productData, image: files[0]});
    } else {
      setProductData({...productData, [name]: value});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('id', productData.id);
    formData.append('name', productData.name);
    formData.append('price', productData.price);
    formData.append('category', productData.category);
    if (productData.image) {
      formData.append('image', productData.image);
    }
    formData.append('active', productData.active);
    
    if (selectedInterface === "principal") {
      formData.append('description', productData.description);
    }

    try {
      const response = await fetch('/api/productos', {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        alert("Producto actualizado exitosamente");
        router.push("/admin");
      } else {
        throw new Error("Error al actualizar el producto");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el producto");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-cover bg-center bg-no-repeat p-4 sm:p-6 relative" style={{ backgroundImage: "url('/fondo.png')" }}>
      <div className="absolute inset-0 bg-black opacity-40"></div>
      
      <div className="relative z-10 w-full max-w-6xl">
        <button 
          onClick={() => router.back()}
          className="mb-4 bg-[#762114] text-[#F5F1F1] p-2 rounded-full hover:bg-[#DC9C5C] transition-all"
        >
          <FiArrowLeft className="text-xl" />
        </button>

        <div className="bg-[#F5F1F1] p-6 rounded-lg shadow-lg border-4 border-[#762114]">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Editar Producto</h2>
          
          <div className="mb-4">
            <label className="block text-[#7B2710] font-semibold mb-2">Interfaz de destino</label>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setSelectedInterface("principal")}
                className={`py-2 px-4 rounded-md ${selectedInterface === "principal" ? 'bg-[#DC9C5C] text-[#F5F1F1]' : 'bg-[#8C9560] text-[#F5F1F1]'}`}
              >
                Página Principal
              </button>
              <button
                type="button"
                onClick={() => setSelectedInterface("personalizados")}
                className={`py-2 px-4 rounded-md ${selectedInterface === "personalizados" ? 'bg-[#DC9C5C] text-[#F5F1F1]' : 'bg-[#8C9560] text-[#F5F1F1]'}`}
              >
                Productos Personalizados
              </button>
            </div>
          </div>

          {selectedInterface && (
            <>
              <div className="mb-4">
                <label className="block text-[#7B2710] font-semibold mb-2">Buscar Producto por ID</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Ingrese ID del producto"
                    className="flex-1 p-2 border border-[#8C9560] rounded-md"
                  />
                  <button 
                    type="button"
                    onClick={handleSearch}
                    className="bg-[#8C9560] text-[#F5F1F1] py-2 px-4 rounded-md font-semibold hover:bg-[#DC9C5C] transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? "Buscando..." : "Buscar"}
                  </button>
                </div>
              </div>

              {productData.id && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-[#7B2710] font-semibold mb-2">Nombre</label>
                    <input
                      type="text"
                      name="name"
                      value={productData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-[#8C9560] rounded-md"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-[#7B2710] font-semibold mb-2">Precio</label>
                    <input
                      type="number"
                      name="price"
                      value={productData.price}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-[#8C9560] rounded-md"
                      required
                    />
                  </div>

                  {selectedInterface === "principal" && (
                    <>
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

                      <div className="mb-4">
                        <label className="block text-[#7B2710] font-semibold mb-2">Descripción</label>
                        <textarea
                          name="description"
                          value={productData.description}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-[#8C9560] rounded-md"
                          rows="3"
                          required
                        ></textarea>
                      </div>
                    </>
                  )}

                  {selectedInterface === "personalizados" && (
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
                        <option value="piezas">Piezas</option>
                        <option value="piedras">Piedras</option>
                        <option value="metales">Metales</option>
                      </select>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-[#7B2710] font-semibold mb-2">Nueva Imagen (opcional)</label>
                    <input
                      type="file"
                      name="image"
                      onChange={handleInputChange}
                      className="w-full p-2 border border-[#8C9560] rounded-md"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center space-x-2 text-[#7B2710] font-semibold">
                      <input
                        type="checkbox"
                        name="active"
                        checked={productData.active}
                        onChange={(e) => setProductData({...productData, active: e.target.checked})}
                        className="rounded border-[#8C9560]"
                      />
                      <span>Producto activo (visible en la tienda)</span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="bg-[#7B2710] text-[#F5F1F1] py-2 px-4 rounded-md font-semibold hover:bg-[#DC9C5C] transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-[#8C9560] text-[#F5F1F1] py-2 px-4 rounded-md font-semibold hover:bg-[#DC9C5C] transition-all"
                    >
                      Actualizar Producto
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