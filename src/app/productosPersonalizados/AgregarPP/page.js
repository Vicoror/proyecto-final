 "use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavegadorAdmin from "@/components/NavegadorAdmin";
import { ArrowLeft } from "lucide-react";

export default function PaginaBase() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormulario({ ...formulario, [name]: checked });
    } else {
      setFormulario({ ...formulario, [name]: value });
    }
  };

  const manejarArchivo = (e) => {
    if (e.target.files[0]) {
      setFormulario((prev) => ({
        ...prev,
        imagen: e.target.files[0],
      }));
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

  const validarFormulario = () => {
    const letras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{1,35}$/;
    if (!letras.test(formulario.nombreModelo)) return alert("Nombre inválido. Sólo se aceptan letras");
    if (!categorias.includes(formulario.categoria)) return alert("Categoría inválida");
    if (formulario.tiempoEntrega > 30) return alert("Máximo 30 días");
    if (!Number.isInteger(Number(formulario.precioManoObra))) return alert("El precio debe ser un número entero");
    if (formulario.precioManoObra > 5000) return alert("El precio Máximo es de $5000");
    return true;
  };

  const enviarFormulario = async () => {
        if (!validarFormulario()) return;

        const formData = new FormData();
        formData.append("nombreModelo", formulario.nombreModelo);
        formData.append("categoria", formulario.categoria);
        formData.append("tiempoEntrega", formulario.tiempoEntrega);
        formData.append("precioManoObra", formulario.precioManoObra);
        formData.append("activar", formulario.activar ? "true" : "false");

        // ⚠️ Usamos los arreglos actualizados directamente desde el estado "formulario"
        formData.append("metales", JSON.stringify(formulario.metales));
        formData.append("piedras", JSON.stringify(formulario.piedras));
        formData.append("hilos", JSON.stringify(formulario.hilos));

        if (formulario.imagen) {
          formData.append("imagen", formulario.imagen);
        }

        try {
          const respuesta = await fetch("/api/productosPersonalizados", {
            method: "POST",
            body: formData,
          });

          const resultado = await respuesta.json();
          if (respuesta.ok) {
            alert("Producto guardado correctamente");
            // Reiniciar formulario y selección después de guardar exitosamente
              setFormulario({
                nombreModelo: "",
                categoria: "",
                metales: [],
                piedras: [],
                hilos: [],
                tiempoEntrega: "",
                precioManoObra: "",
                activar: true,
                imagen: null,
              });

              setSeleccionados({
                metales: {},
                piedras: {},
                hilos: {},
              });

            console.log("✅ Materiales enviados:", {
              metales: formulario.metales,
              piedras: formulario.piedras,
              hilos: formulario.hilos,
            });
          } else {
            alert("Error: " + resultado.mensaje);
          }
        } catch (error) {
          console.error("Error al enviar:", error);
          alert("Error al guardar el producto");
        }
      };

          const manejarListaConGramos = (tipo, id, valor, marcadoManual = false) => {
              setFormulario((prev) => {
                // Copiamos el arreglo actual sin el ítem que coincide con el id
                let actual = prev[tipo].filter((item) => item.id !== id);

                if (marcadoManual) {
                  // Si el checkbox fue marcado (true), agregamos con valor 1 por defecto
                  if (valor === true) {
                    actual.push({ id, valor: 1, activar: true });
                  }
                  // Si se desmarcó (valor === false), no agregamos nada, así se elimina
                } else {
                  // Cambió el valor numérico, actualizamos sólo si está en rango
                  if (valor >= 1 && valor <= 1000) {
                    actual.push({ id, valor, activar: true });
                  } else if (valor <= 0 || valor === "") {
                    // Si valor no válido o 0, no agregamos (eliminamos)
                    // ya filtramos arriba, no hacemos nada aquí
                  }
                }

                return { ...prev, [tipo]: actual };
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
            <div>
              <label className="block font-semibold text-[#7B2710]">Nombre del modelo</label>
              <input
                name="nombreModelo"
                value={formulario.nombreModelo}
                onChange={manejarCambio}
                className="w-full p-2 rounded border"
                placeholder="Ej. Pulsera Maya"
                maxLength={35}
              />
            </div>

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
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
                      className={`flex items-center justify-between gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        estaSeleccionado ? "bg-[#EADDD7] border-[#7B2710]" : "bg-white border-gray-300"
                      }`}
                    >
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
                          min="1"
                          max="1000"
                          value={elemento.valor}
                          onChange={(e) =>
                            manejarListaConGramos("metales", m.id, parseFloat(e.target.value))
                          }
                          className="w-24 p-1 border rounded"
                        />
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
                      className={`flex items-center justify-between gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        estaSeleccionado ? "bg-[#EADDD7] border-[#7B2710]" : "bg-white border-gray-300"
                      }`}
                    >
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
                          min="1"
                          max="1000"
                          value={elemento.valor}
                          onChange={(e) =>
                            manejarListaConGramos("piedras", p.id, parseFloat(e.target.value))
                          }
                          className="w-24 p-1 border rounded"
                        />
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
                      className={`flex items-center justify-between gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        estaSeleccionado ? "bg-[#EADDD7] border-[#7B2710]" : "bg-white border-gray-300"
                      }`}
                    >
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
                          min="1"
                          max="1000"
                          value={elemento.valor}
                          onChange={(e) =>
                            manejarListaConGramos("hilos", h.id, parseFloat(e.target.value))
                          }
                          className="w-24 p-1 border rounded"
                        />
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
                onChange={manejarCambio}
                min="1"
                max="30"
                className="w-full p-2 rounded border"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#7B2710]">Precio mano de obra</label>
              <input
                type="number"
                name="precioManoObra"
                value={formulario.precioManoObra}
                onChange={manejarCambio}
                min="0"
                max="5000"
                className="w-full p-2 rounded border"
              />
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
              <input type="file" name="imagen" onChange={manejarArchivo} />
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