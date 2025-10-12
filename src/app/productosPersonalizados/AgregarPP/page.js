 "use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft } from "lucide-react";

export default function PaginaBase() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
   const [errores, setErrores] = useState({
    nombreModelo: "",
    categoria: "",
    imagen: "",
    tiempoEntrega: "",
    precioManoObra: ""
  });

  const [categorias] = useState([
    "Aretes",
    "Anillos",
    "Dije",
    "Pulsera",
    "Collar",
    "Cadena",
    "Brazalete",
  ]);

  const [metales, setMetales] = useState([]);
  const [piedras, setPiedras] = useState([]);
  const [hilos, setHilos] = useState([]);

  const [seleccionados, setSeleccionados] = useState({
    metales: {},
    piedras: {},
    hilos: {},
  });

  const [formulario, setFormulario] = useState({
    nombreModelo: "",
    categoria: "",
    metales: [],
    piedras: [],
    hilos: [],
    tiempoEntrega: "",
    precioManoObra: "",
    activar: true,
    imagen: null,
    descriptionPP: "",
  });

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
    }
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/productosPersonalizados");

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const htmlError = await res.text();
        throw new Error(`El servidor devolvió HTML: ${htmlError.substring(0, 100)}`);
      }

      const data = await res.json();
      setMetales(data.metales || []);
      setPiedras(data.piedras || []);
      setHilos(data.hilos || []);
    } catch (error) {
      setError(error.message);
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const sanitizarInput = (valor) => {
    // Elimina caracteres especiales que podrían usarse para inyección
    return valor.replace(/[<>"'`;]/g, "");
  };

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    let valorSanitizado = value;
    
    // Sanitizar solo campos de texto
    if (type === "text" || name === "nombreModelo" || name === "categoria") {
      valorSanitizado = sanitizarInput(value);
      
      // Validación en tiempo real para nombreModelo
      if (name === "nombreModelo") {
        const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{1,100}$/;
        setErrores(prev => ({
          ...prev,
          nombreModelo: regex.test(valorSanitizado) ? "" : "Solo se permiten letras y espacios (máx 100 caracteres)"
        }));
      }

      
    }

    setFormulario(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : valorSanitizado
    }));
  };
 const manejarArchivo = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    // Validar tipo de imagen
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!tiposPermitidos.includes(archivo.type)) {
      setErrores(prev => ({
        ...prev,
        imagen: "Formato no válido. Solo se aceptan JPG, PNG o WEBP"
      }));
      return;
    }

    // Validar tamaño (opcional: 5MB máximo)
    if (archivo.size > 5 * 1024 * 1024) {
      setErrores(prev => ({
        ...prev,
        imagen: "La imagen es demasiado grande (máx 5MB)"
      }));
      return;
    }

    setErrores(prev => ({ ...prev, imagen: "" }));
    setFormulario(prev => ({ ...prev, imagen: archivo }));
  };

  const manejarListaConGramos = (tipo, id, valor, marcadoManual = false) => {
    setFormulario((prev) => {
      let actual = prev[tipo].filter((item) => item.id !== id);

      if (marcadoManual) {
        if (valor === true) {
          actual.push({ id, valor: "", activar: true });
        }
      } else {
        if (valor >= 1 && valor <= 1000) {
          actual.push({ id, valor, activar: true });
        }
      }

      return { ...prev, [tipo]: actual };
    });
  };

  const validarFormulario = () => {
    const nuevosErrores = {
      nombreModelo: "",
      categoria: "",
      imagen: "",
      tiempoEntrega: "",
      precioManoObra: ""
    };

    // Validar nombre
    if (!formulario.nombreModelo.trim()) {
      nuevosErrores.nombreModelo = "El nombre es requerido";
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{1,100}$/.test(formulario.nombreModelo)) {
      nuevosErrores.nombreModelo = "Solo letras y espacios (máx 100 caracteres)";
    }

    // Validar descripción
      if (!formulario.descriptionPP.trim()) {
        nuevosErrores.descriptionPP = "La descripción es requerida";
      } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.:;*,%'"()¡!¿?]{1,500}$/.test(formulario.descriptionPP)) {
        nuevosErrores.descriptionPP = "Solo letras, números, espacios y puntuación permitida (máx. 500 caracteres)";
      }


    // Validar categoría
    if (!formulario.categoria) {
      nuevosErrores.categoria = "Seleccione una categoría";
    }

    // Validar imagen
    if (!formulario.imagen) {
      nuevosErrores.imagen = "La imagen es requerida";
    }

    // Validar tiempo de entrega
      if (formulario.tiempoEntrega === "" || formulario.tiempoEntrega === null || formulario.tiempoEntrega === undefined) {
    nuevosErrores.tiempoEntrega = "Este campo es requerido";
  } else {
    const dias = Number(formulario.tiempoEntrega);
    if (isNaN(dias)) {
      nuevosErrores.tiempoEntrega = "Debe ser un número válido";
    } else if (dias < 0) {
      nuevosErrores.tiempoEntrega = "No puede ser negativo";
    } else if (dias > 30) {
      nuevosErrores.tiempoEntrega = "Máximo 30 días";
    } else if (!Number.isInteger(dias)) {
      nuevosErrores.tiempoEntrega = "Debe ser un número entero";
    }
  }

    // Validar precio mano de obra (30-5000)
      const precio = Number(formulario.precioManoObra);
      if (!formulario.precioManoObra || isNaN(precio)) {
        nuevosErrores.precioManoObra = "Debe ser un número válido";
      } else if (precio < 30) {
        nuevosErrores.precioManoObra = "Mínimo $30";
      } else if (precio > 5000) {
        nuevosErrores.precioManoObra = "Máximo $5000";
      } else if (!Number.isInteger(precio)) {
        nuevosErrores.precioManoObra = "Debe ser un número entero";
    }

    setErrores(nuevosErrores);
    return !Object.values(nuevosErrores).some(error => error !== "");
  };

  const enviarFormulario = async () => {
    if (!validarFormulario()) return;

    const formData = new FormData();
    formData.append("nombreModelo", formulario.nombreModelo);
    formData.append("categoria", formulario.categoria);
    formData.append("tiempoEntrega", formulario.tiempoEntrega);
    formData.append("precioManoObra", formulario.precioManoObra);
    formData.append("activar", formulario.activar);
    formData.append("metales", JSON.stringify(formulario.metales));
    formData.append("piedras", JSON.stringify(formulario.piedras));
    formData.append("hilos", JSON.stringify(formulario.hilos));
    formData.append("imagen", formulario.imagen);
    formData.append("descriptionPP", formulario.descriptionPP);

    try {
      const res = await fetch("/api/productosPersonalizados", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Producto guardado correctamente");
        // Resetear formulario...
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error("Error al enviar:", error);
      alert("Error al guardar el producto");
    }
  };

  const manejarSeleccion = (tipo, id, valor, checked = null) => {
    setSeleccionados((prev) => {
      const actualizado = { ...prev[tipo] };
      if (checked === false || valor === "" || parseFloat(valor) <= 0) {
        delete actualizado[id];
      } else {
        actualizado[id] = parseFloat(valor);
      }
      return { ...prev, [tipo]: actualizado };
    });

    setFormulario((prev) => {
      const actual = Object.entries(seleccionados[tipo] || {}).map(([key, val]) => ({
        id: parseInt(key),
        valor: val,
      }));

      const sinEste = actual.filter((item) => item.id !== id);
      if (valor > 0) {
        sinEste.push({ id, valor: parseFloat(valor) });
      }
      return { ...prev, [tipo]: sinEste };
    });
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      <div className="absolute inset-0 bg-black/50 z-0" />
      <NavegadorAdmin />

      <main className="relative z-10 px-2 sm:px-0 pt-20 pb-8 w-full max-w-[99.5vw] mx-auto">
        <div className="w-full max-w-5xl px-1 mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-white ml-0 px-0 hover:text-[#F5F1F1]"
          >
            <ArrowLeft className="mr-2" size={30} />
            Anterior
          </button>
        </div>

        <section className="w-full bg-[#F5F1F1] rounded-xl shadow-2xl border-4 border-[#762114] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#7B2710] mb-6">Agregar Productos Personalizados</h2>

          <form className="space-y-4">
          {/* Nombre del modelo */}
          <div>
            <label className="block font-semibold text-[#7B2710]">
              Nombre del modelo
            </label>
            <input
              name="nombreModelo"
              value={formulario.nombreModelo}
              onChange={manejarCambio}
              className="w-full p-2 rounded border"
              placeholder="Ej. Pulsera Maya"
              maxLength={100}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formulario.nombreModelo.length}/100 caracteres</span>
            </div>
            {errores.nombreModelo && (
              <p className="text-red-500 text-sm mt-1">{errores.nombreModelo}</p>
            )}
          </div>

          {/* Categoría */}
          <div>
            <label className="block font-semibold text-[#7B2710]">Categoría</label>
            <select
              name="categoria"
              value={formulario.categoria}
              onChange={manejarCambio}
              className="w-full p-2 rounded border"
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción del producto */}
          <div>
            <label className="block font-semibold text-[#7B2710]">
              Descripción del producto
            </label>
            <textarea
              name="descriptionPP"
              value={formulario.descriptionPP}
              onChange={manejarCambio}
              className="w-full p-2 rounded border h-28 resize-y"
              placeholder={`Ej. 
          • Tamaño largo 20cm 
          • Material: Plata 925 
          • Incluye caja de regalo`}
              maxLength={500}
            ></textarea>

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formulario.descriptionPP.length}/500 caracteres</span>
            </div>

            {errores.descriptionPP && (
              <p className="text-red-500 text-sm mt-1">
                {errores.descriptionPP}
              </p>
            )}
          </div>

            {/* 🔩 Metales */}
              <div>
                <label className="block font-semibold text-[#7B2710] mb-2">Metales</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {metales.map((m) => {
                    const elemento = formulario.metales.find((item) => item.id === m.id);
                    const estaSeleccionado = !!elemento;

                    return (
                      <label
                        key={m.id}
                        className={`flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          estaSeleccionado ? "bg-[#EADDD7] border-[#7B2710]" : "bg-white border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-3 w-full">
                            <input
                              type="checkbox"
                              className="accent-[#7B2710] w-5 h-5"
                              checked={estaSeleccionado}
                              onChange={(e) =>
                                manejarListaConGramos("metales", m.id, e.target.checked, true)
                              }
                            />
                            <span className="text-[#333] font-semibold">{m.nombre}</span>
                          </div>

                          {estaSeleccionado && (
                            <input
                              type="number"
                              placeholder="Gramos"
                              min="0.1"
                              max="1000"
                              step="0.1"
                              value={elemento.valor}
                              onChange={(e) => {
                                let valor = e.target.value;

                                // limitar a un solo decimal
                                if (valor.includes('.')) {
                                  const [entero, decimal] = valor.split('.');
                                  if (decimal.length > 1) return; // no permitir más de un decimal
                                }

                                manejarListaConGramos("metales", m.id, parseFloat(valor));
                              }}
                              className="w-24 p-1 border rounded"
                            />
                          )}
                        </div>

                        {estaSeleccionado && (
                          <p className="text-xs text-gray-500 mt-1 ml-8 text-right">Máximo 1000 gramos</p>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 💎 Piedras */}
              <div>
                <label className="block font-semibold text-[#7B2710] mb-2">Piedras</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {piedras.map((p) => {
                    const elemento = formulario.piedras.find((item) => item.id === p.id);
                    const estaSeleccionado = !!elemento;

                    return (
                      <label
                        key={p.id}
                        className={`flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          estaSeleccionado ? "bg-[#EADDD7] border-[#7B2710]" : "bg-white border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-3 w-full">
                            <input
                              type="checkbox"
                              className="accent-[#7B2710] w-5 h-5"
                              checked={estaSeleccionado}
                              onChange={(e) =>
                                manejarListaConGramos("piedras", p.id, e.target.checked, true)
                              }
                            />
                            <span className="text-[#333] font-semibold">{p.nombre}</span>
                          </div>

                          {estaSeleccionado && (
                            <input
                              type="number"
                              placeholder="Gramos"
                              min="0.1"
                              max="1000"
                              step="0.1"
                              value={elemento.valor}
                              onChange={(e) => {
                                let valor = e.target.value;
                                if (valor.includes('.')) {
                                  const [entero, decimal] = valor.split('.');
                                  if (decimal.length > 1) return;
                                }
                                manejarListaConGramos("piedras", p.id, parseFloat(valor));
                              }}
                              className="w-24 p-1 border rounded"
                            />
                          )}
                        </div>

                        {estaSeleccionado && (
                          <p className="text-xs text-gray-500 mt-1 ml-8 text-right">Máximo 1000 gramos</p>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 🧵 Hilos */}
              <div>
                <label className="block font-semibold text-[#7B2710] mb-2">Hilos (metros)</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {hilos.map((h) => {
                    const elemento = formulario.hilos.find((item) => item.id === h.id);
                    const estaSeleccionado = !!elemento;

                    return (
                      <label
                        key={h.id}
                        className={`flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          estaSeleccionado ? "bg-[#EADDD7] border-[#7B2710]" : "bg-white border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-3 w-full">
                            <input
                              type="checkbox"
                              className="accent-[#7B2710] w-5 h-5"
                              checked={estaSeleccionado}
                              onChange={(e) =>
                                manejarListaConGramos("hilos", h.id, e.target.checked, true)
                              }
                            />
                            <span className="text-[#333] font-semibold">{h.nombre}</span>
                          </div>

                          {estaSeleccionado && (
                            <input
                              type="number"
                              placeholder="Metros"
                              min="0.1"
                              max="1000"
                              step="0.1"
                              value={elemento.valor}
                              onChange={(e) => {
                                let valor = e.target.value;
                                if (valor.includes('.')) {
                                  const [entero, decimal] = valor.split('.');
                                  if (decimal.length > 1) return;
                                }
                                manejarListaConGramos("hilos", h.id, parseFloat(valor));
                              }}
                              className="w-24 p-1 border rounded"
                            />
                          )}
                        </div>

                        {estaSeleccionado && (
                          <p className="text-xs text-gray-500 mt-1 ml-8 text-right">Máximo 1000 metros</p>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>


            <div>
              <label className="block font-semibold text-[#7B2710]">Tiempo de entrega (días)</label>
              <input
                type="number"
                name="tiempoEntrega"
                value={formulario.tiempoEntrega}
                onChange={(e) => {
                  const value = e.target.value;
                  // Solo permitir valores numéricos entre 0 y 30
                  if (value === '' || (Number(value) >= 0 && Number(value) <= 30)) {
                    setFormulario({
                      ...formulario,
                      tiempoEntrega: value
                    });
                  }
                }}
                min="0"
                max="30"
                className="w-full p-2 rounded border"
                placeholder="0-30 días"
                onKeyDown={(e) => {
                  // Bloquear teclas no numéricas (excepto comandos de edición)
                  if (!/[0-9]/.test(e.key) && 
                      e.key !== 'Backspace' && 
                      e.key !== 'Delete' && 
                      e.key !== 'ArrowLeft' && 
                      e.key !== 'ArrowRight' &&
                      e.key !== 'Tab') {
                    e.preventDefault();
                  }
                }}
              />
              {formulario.tiempoEntrega > 30 && (
                <p className="text-red-500 text-sm mt-1">El tiempo máximo permitido es 30 días</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-[#7B2710]">Precio mano de obra ($)</label>
              <input
                type="text"
                name="precioManoObra"
                value={formulario.precioManoObra}
                onChange={(e) => {
                  const valor = e.target.value;

                  // Permitir solo números con máximo 1 decimal y hasta 6 caracteres
                  if (
                    valor === '' ||
                    (/^\d{0,4}(\.\d{0,1})?$/.test(valor) && valor.length <= 6)
                  ) {
                    setFormulario({
                      ...formulario,
                      precioManoObra: valor
                    });

                    // Validación en tiempo real
                    if (valor !== '') {
                      const numero = parseFloat(valor);
                      if (numero < 30) {
                        setErrores({ ...errores, precioManoObra: 'Mínimo $30' });
                      } else if (numero > 5000) {
                        setErrores({ ...errores, precioManoObra: 'Máximo $5000' });
                      } else {
                        setErrores({ ...errores, precioManoObra: '' });
                      }
                    } else {
                      setErrores({ ...errores, precioManoObra: '' }); // vacío no da error
                    }
                  }
                }}
                min="30"
                max="5000"
                className={`w-full p-2 rounded border ${
                  errores.precioManoObra ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Mínimo 30$ Máximo 5000$"
              />
              {errores.precioManoObra && (
                <p className="text-red-500 text-sm mt-1">{errores.precioManoObra}</p>
              )}
            </div>


            <div className="flex items-center gap-2">
              <label className="font-semibold text-[#7B2710]">¿Activar producto?</label>
              <input
                type="checkbox"
                name="activar"
                checked={formulario.activar}
                onChange={manejarCambio}
              />
            </div>

            <div>
              <label className="block font-semibold text-[#7B2710]">Imagen del producto</label>
               <input 
                    type="file" 
                    name="imagen" 
                    onChange={manejarArchivo} 
                    accept="image/jpeg, image/png, image/webp"
                  />
                  {errores.imagen && <p className="text-red-500 text-sm mt-1">{errores.imagen}</p>}
                </div>

            <button
              type="button"
              onClick={enviarFormulario}
              className="bg-[#7B2710] text-white font-semibold py-2 px-4 rounded hover:bg-[#5c1d0a]"
            >
              Guardar producto
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-[#8C9560] text-white font-semibold py-2 px-4 rounded hover:bg-[#DC9C5C] ml-2"
            >
              Cancelar
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}