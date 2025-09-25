"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function EditarMateriales() {
  const [materiales, setMateriales] = useState({ metales: [], piedras: [], hilos: [] });
  const [formulario, setFormulario] = useState({
    tipo: "metal",
    id: null,
    nombre: "",
    precio: "",
    imagen: null,
    activar: "1"
  });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorImagen, setErrorImagen] = useState("");

  useEffect(() => {
    obtenerMateriales();
  }, []);

  const obtenerMateriales = async () => {
    try {
      const res = await axios.get("/api/materiales");
      setMateriales(res.data);
    } catch (error) {
      console.error("Error al cargar materiales:", error);
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    
    if (name === "nombre") {
  // Regex:
  //  - Solo letras, números, acentos y espacios
  //  - No más de 3 números seguidos
  //  - No más de 2 letras iguales seguidas
  const regex = /^(?!.*\d{4})(?!.*([a-zA-ZÀ-ÿ])\1{2,})[a-zA-ZÀ-ÿ0-9\s]*$/;

  // Quitar espacios al inicio (evita llenar solo con espacios)
  const trimmedValue = value.trimStart();

  if (trimmedValue === "" || regex.test(trimmedValue)) {
    if (trimmedValue.length <= 35) {
      // Evitar que sea solo números
      if (!/^\d+$/.test(trimmedValue)) {
        setFormulario({ ...formulario, [name]: trimmedValue });
      }
    }
  }
}

    else if (name === "precio") {
      // Validar que solo sean números entre 0 y 5000
      const regex = /^[0-9]*\.?[0-9]*$/;
      if (value === "" || regex.test(value)) {
        if (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 5000)) {
          setFormulario({ ...formulario, [name]: value });
        }
      }
    } else {
      setFormulario({ ...formulario, [name]: value });
    }
  };

const manejarArchivo = (e) => {
  const file = e.target.files[0];
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (!file) {
    setErrorImagen("Debes seleccionar una imagen.");
    setFormulario({ ...formulario, imagen: null });
    return;
  }

  if (!validTypes.includes(file.type)) {
    setErrorImagen("Formato inválido. Solo se permiten imágenes (JPEG, JPG, PNG, WEBP, GIF).");
    setFormulario({ ...formulario, imagen: null });
    e.target.value = ""; // limpiar input
    return;
  }

  setFormulario({ ...formulario, imagen: file });
  setErrorImagen("");
};

const manejarSubmit = (e) => {
  e.preventDefault();
  if (!formulario.imagen) {
    setErrorImagen("La imagen es obligatoria.");
    return;
  }

  // Aquí ya podrías enviar tu formulario
  console.log("Formulario listo con imagen:", formulario.imagen);
};



  const manejarEditar = (tipo, item) => {
    setFormulario({
      tipo,
      id: item[`id_${tipo}`],
      nombre: tipo === "metal" ? item.nombreM : tipo === "piedra" ? item.nombrePiedra : item.color,
      precio: tipo === "metal" ? item.precioM : tipo === "piedra" ? item.precioP : item.precioH,
      imagen: null,
      activar: tipo === "metal" ? item.activarM : tipo === "piedra" ? item.activarP : item.activarH
    });
    setModoEdicion(true);
    setErrorImagen("");
  };

  const manejarCancelar = () => {
    setFormulario({ tipo: "metal", id: null, nombre: "", precio: "", imagen: null, activar: "1" });
    setModoEdicion(false);
    setErrorImagen("");
  };

const manejarGuardar = async () => {
  const nombreValido = /^[a-zA-ZÀ-ÿ0-9\s]*$/;
  const esImagen = (file) => /^image\/(jpeg|jpg|png|webp|gif)$/.test(file?.type);

  if (!formulario.nombre || formulario.nombre.length > 35 || !nombreValido.test(formulario.nombre)) {
    return alert("Nombre inválido. Solo letras, números y acentos están permitidos (máximo 35 caracteres).");
  }

  if (!/^[0-9]+(\.[0-9]+)?$/.test(formulario.precio) || parseFloat(formulario.precio) > 5000) {
    return alert("El precio debe ser un número válido entre 0 y 5000.");
  }

  // 🔴 Validación de imagen obligatoria SOLO si es nuevo
  if (!modoEdicion && !formulario.imagen) {
    setErrorImagen("La imagen es obligatoria.");
    return;
  }

  if (formulario.imagen) {
    const img = new Image();
    img.src = URL.createObjectURL(formulario.imagen);
    img.onload = async () => {
      if (img.width > 1200 || img.height > 1200) {
        return alert("La imagen debe tener un tamaño máximo de 1200x1200.");
      }
      if (!esImagen(formulario.imagen)) {
        return alert("El archivo debe ser una imagen (jpg, png, webp, etc.).");
      }
      await enviarFormulario();
    };
  } else {
    // Aquí solo entra si está en edición y no cambió la imagen
    await enviarFormulario();
  }
};


  const enviarFormulario = async () => {
    const formData = new FormData();
    formData.append("tipo", formulario.tipo);
    if (formulario.id) formData.append("id", formulario.id);

    if (formulario.tipo === "metal") {
      formData.append("nombreM", formulario.nombre);
      formData.append("precioM", formulario.precio);
      formData.append("activarM", formulario.activar);
    } else if (formulario.tipo === "piedra") {
      formData.append("nombrePiedra", formulario.nombre);
      formData.append("precioP", formulario.precio);
      formData.append("activarP", formulario.activar);
    } else {
      formData.append("color", formulario.nombre);
      formData.append("precioH", formulario.precio);
      formData.append("activarH", formulario.activar);
    }

    if (formulario.imagen) formData.append("imagen", formulario.imagen);

    try {
      setLoading(true);
      await axios.post("/api/materiales", formData);
      alert(modoEdicion ? "Material editado con éxito." : "Material guardado con éxito.");
      await obtenerMateriales();
      manejarCancelar();
    } catch (error) {
      console.error("Error al guardar material:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderTabla = (tipo) => {
    const nombrePlural = {
      metal: "metales",
      piedra: "piedras",
      hilo: "hilos"
    }[tipo];
    return (
      <div className="overflow-auto mb-8">
        <h3 className="text-xl font-bold mb-2 text-[#7B2710]">{tipo.charAt(0).toUpperCase() + tipo.slice(1)} </h3>
        <table className="w-full border bg-white text-center">
          <thead className="bg-[#DC9C5C] text-white">
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Imagen</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {materiales[nombrePlural]?.map((item) => (
              <tr key={item[`id_${tipo}`]} className="border-b">
                <td>{tipo === "metal" ? item.nombreM : tipo === "piedra" ? item.nombrePiedra : item.color}</td>
                <td>${tipo === "metal" ? item.precioM : tipo === "piedra" ? item.precioP : item.precioH}</td>
                <td className="flex justify-center items-center">
                  {item[tipo === "metal" ? "imagenM" : tipo === "piedra" ? "imagenPiedra" : "imagenH"] && (
                    <img
                      src={item[tipo === "metal" ? "imagenM" : tipo === "piedra" ? "imagenPiedra" : "imagenH"]}
                      alt=""
                      className="w-15 h-12 object-cover rounded"
                    />
                  )}
                </td>
                <td>
                  <span
                    className={
                      (tipo === "metal" ? item.activarM : tipo === "piedra" ? item.activarP : item.activarH) === "1"
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {(tipo === "metal" ? item.activarM : tipo === "piedra" ? item.activarP : item.activarH) === "1"
                      ? "Activado"
                      : "Desactivado"}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => manejarEditar(tipo, item)}
                    className="bg-[#8C9560] text-white px-2 py-1 rounded hover:bg-green-700"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-0  bg-[#F5F1F1] min-h-screen">
      <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Editar Materiales</h2>

        {renderTabla("metal")}
        {renderTabla("piedra")}
        {renderTabla("hilo")}

        <div className="bg-white p-4 rounded shadow-md border mt-6">
          <h3 className="text-lg font-semibold text-[#7B2710] mb-2">
            {modoEdicion ? "Editar Material" : "Agregar Material"}
          </h3>
          <div className="grid gap-6">
            <select
              name="tipo" 
              value={formulario.tipo} 
              onChange={manejarCambio}
              className="p-2 border rounded normal-case h-10"
            >
              <option value="metal" className="normal-case">Metal</option>
              <option value="piedra" className="normal-case">Piedra</option>
              <option value="hilo" className="normal-case">Hilo</option>
            </select>

            <div>
              <input
                name="nombre"
                value={formulario.nombre}
                onChange={manejarCambio}
                className="p-2 border rounded w-full h-10"
                placeholder="Nombre / Color"
                maxLength={35}
              />
              <p className="text-xs text-gray-500 mt-1">Máximo 35 caracteres (solo letras, números y acentos)</p>
            </div>

            <div>
              <input
                name="precio"
                type="text"
                value={formulario.precio}
                onChange={manejarCambio}
                className="p-2 border rounded w-full h-10"
                placeholder="Precio x 10 gramos o 10 metros (hilo)"
              />
              <p className="text-xs text-gray-500 mt-2">Solo números entre 0 y 5000</p>
            </div>

            <select
              name="activar"
              value={formulario.activar}
              onChange={manejarCambio}
              className="p-2 border rounded h-10"
            >
              <option value="1">Activado</option>
              <option value="0">Desactivado</option>
            </select>

            <div className="md:col-span-2">
              <input 
                type="file" 
                onChange={manejarArchivo} 
                accept="image/jpeg, image/jpg, image/png, image/webp, image/gif"
              />
              {errorImagen && <p className="text-red-500 text-sm mt-1">{errorImagen}</p>}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={manejarGuardar}
              disabled={loading}
              className="bg-[#7B2710] text-white px-4 py-2 rounded hover:bg-[#5a1e0c]"
            >
              {modoEdicion ? "Guardar Cambios" : "Agregar"}
            </button>

            {modoEdicion && (
              <button
                onClick={manejarCancelar}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}