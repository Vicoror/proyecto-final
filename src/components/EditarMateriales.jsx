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
    setFormulario({ ...formulario, [name]: value });
  };

  const manejarArchivo = (e) => {
    setFormulario({ ...formulario, imagen: e.target.files[0] });
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
  };

  const manejarCancelar = () => {
    setFormulario({ tipo: "metal", id: null, nombre: "", precio: "", imagen: null, activar: "1" });
    setModoEdicion(false);
  };

  const manejarGuardar = async () => {
    const nombreValido = /^[a-zA-ZÀ-ÿ0-9.,%\s]*$/;
    const esImagen = (file) => /^image\/(jpeg|jpg|png|webp|gif|svg\+xml)$/.test(file?.type);

    if (!formulario.nombre || formulario.nombre.length > 25 || !nombreValido.test(formulario.nombre)) {
      return alert("Nombre inválido. Solo letras, números, acentos y puntuaciones como . , % están permitidos.");
    }

    if (!/^[0-9]+(\.[0-9]+)?$/.test(formulario.precio) || parseFloat(formulario.precio) > 50000) {
      return alert("El precio debe ser un número válido y no mayor a 50000.");
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select 
            name="tipo" 
            value={formulario.tipo} 
            onChange={manejarCambio}
            className="p-2 border rounded normal-case"
          >
            <option value="metal" className="normal-case">Metal</option>
            <option value="piedra" className="normal-case">Piedra</option>
            <option value="hilo" className="normal-case">Hilo</option>
          </select>

          <input
            name="nombre"
            value={formulario.nombre}
            onChange={manejarCambio}
            className="p-2 border rounded"
            placeholder="Nombre / Color"
          />

          <input
            name="precio"
            type="number"
            value={formulario.precio}
            onChange={manejarCambio}
            className="p-2 border rounded"
            placeholder="Precio x 10 gramos o 10 metros (hilo)"
          />

          <select
            name="activar"
            value={formulario.activar}
            onChange={manejarCambio}
            className="p-2 border rounded"
          >
            <option value="1">Activado</option>
            <option value="0">Desactivado</option>
          </select>

          <input type="file" onChange={manejarArchivo} />
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