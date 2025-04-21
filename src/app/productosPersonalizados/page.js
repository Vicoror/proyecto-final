"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiShoppingCart, FiUser, FiHome } from "react-icons/fi";
import Link from "next/link";

const piezas = [
  { nombre: "Anillo", precio: 1000, imagen: "/anillo.jpg" },
  { nombre: "Collar", precio: 1500, imagen: "/collar.jpg" },
  { nombre: "Pulsera", precio: 1200, imagen: "/pulsera.jpg" },
  { nombre: "Brazalete", precio: 1800, imagen: "/brazalete.jpg" },
  { nombre: "Aretes", precio: 900, imagen: "/aretes.jpg" }
];

const piedras = [
  { nombre: "Diamante", precio: 3000, imagen: "/diamante.jpg" },
  { nombre: "Rubí", precio: 2500, imagen: "/rubi.jpg" },
  { nombre: "Zafiro", precio: 2200, imagen: "/zafiro.jpg" },
  { nombre: "Amatista", precio: 1500, imagen: "/amatista.jpg" }
];

const metales = [
  { nombre: "Oro 18k", precio: 1500, imagen: "/oro.jpg" },
  { nombre: "Plata 925", precio: 800, imagen: "/plata.jpg" },
  { nombre: "Oro Blanco", precio: 1800, imagen: "/oro-blanco.jpg" },
  { nombre: "Titanio", precio: 1200, imagen: "/titanio.jpg" }
];


export default function ProductosPersonalizados() {
  const router = useRouter();
  const [piezaSeleccionada, setPiezaSeleccionada] = useState(null);
  const [piedraSeleccionada, setPiedraSeleccionada] = useState(null);
  const [metalSeleccionado, setMetalSeleccionado] = useState(null);
  const [precioTotal, setPrecioTotal] = useState(0);

  const calcularPrecio = () => {
    let total = 0;
    if (metalSeleccionado) total += metalSeleccionado.precio;
    if (piedraSeleccionada) total += piedraSeleccionada.precio;
    if (piezaSeleccionada) total += piezaSeleccionada.precio;
    setPrecioTotal(total);
  };

  const seleccionarMetal = (metal) => {
    setMetalSeleccionado(metal);
    calcularPrecio();
  };

  const seleccionarPiedra = (piedra) => {
    setPiedraSeleccionada(piedra);
    calcularPrecio();
  };

  const seleccionarPieza = (pieza) => {
    setPiezaSeleccionada(pieza);
    calcularPrecio();
  };

  const agregarAlCarrito = () => {
    if (metalSeleccionado && piedraSeleccionada && piezaSeleccionada) {
      alert("¡Joyas agregadas al carrito!");
      // Lógica para agregar al carrito aquí
    } else {
      alert("Por favor selecciona todas las opciones");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4 sm:p-6 relative"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black opacity-40"></div>
      
      {/* Header con navegación */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <Link href="/" className="flex items-center">
          <h1 
            className="text-3xl md:text-4xl font-bold text-[#7B2710] cursor-pointer transition-all duration-300 hover:scale-105"
            style={{ fontFamily: 'Alex Brush' }}
          >
            Bernarda Sierra
          </h1>
          <FiHome className="ml-2 text-[#7B2710] text-2xl" />
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-[#7B2710] hover:text-[#DC9C5C]">
            <FiUser className="text-2xl" />
          </Link>
          <button className="text-[#7B2710] hover:text-[#DC9C5C] relative">
            <FiShoppingCart className="text-2xl" />
            <span className="absolute -top-2 -right-2 bg-[#DC9C5C] text-[#F5F1F1] text-xs rounded-full w-5 h-5 flex items-center justify-center">
              0
            </span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 max-w-6xl mx-auto bg-[#F5F1F1] bg-opacity-90 p-6 rounded-lg shadow-lg border-4 border-[#762114]">
        <h2 className="text-3xl font-bold text-[#7B2710] mb-8 text-center">Personaliza tu Joya</h2>
        
        {/* Selectores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Selección de Pieza */}
          <div className="bg-[#8C9560] bg-opacity-70 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-[#F5F1F1] mb-4">Tipo de Pieza</h3>
            <div className="grid grid-cols-2 gap-3">
              {piezas.map((pieza, index) => (
                <button
                  key={index}
                  onClick={() => seleccionarPieza(pieza)}
                  className={`p-2 rounded-md transition-all ${piezaSeleccionada?.nombre === pieza.nombre ? 'bg-[#DC9C5C]' : 'bg-[#F5F1F1]'}`}
                >
                  <img 
                    src={pieza.imagen} 
                    alt={pieza.nombre}
                    className="w-full h-24 object-cover rounded"
                  />
                  <p className="text-[#7B2710] font-semibold mt-2">{pieza.nombre}</p>
                  <p className="text-[#762114]">${pieza.precio}</p>
                </button>
              ))}
            </div>
          </div>
          
                    {/* Selección de Piedra */}
                    <div className="bg-[#8C9560] bg-opacity-70 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-[#F5F1F1] mb-4">Tipo de Piedra</h3>
            <div className="grid grid-cols-2 gap-3">
              {piedras.map((piedra, index) => (
                <button
                  key={index}
                  onClick={() => seleccionarPiedra(piedra)}
                  className={`p-2 rounded-md transition-all ${piedraSeleccionada?.nombre === piedra.nombre ? 'bg-[#DC9C5C]' : 'bg-[#F5F1F1]'}`}
                >
                  <img 
                    src={piedra.imagen} 
                    alt={piedra.nombre}
                    className="w-full h-24 object-cover rounded"
                  />
                  <p className="text-[#7B2710] font-semibold mt-2">{piedra.nombre}</p>
                  <p className="text-[#762114]">${piedra.precio}</p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Selección de Metal */}
          <div className="bg-[#8C9560] bg-opacity-70 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-[#F5F1F1] mb-4">Tipo de Metal</h3>
            <div className="grid grid-cols-2 gap-3">
              {metales.map((metal, index) => (
                <button
                  key={index}
                  onClick={() => seleccionarMetal(metal)}
                  className={`p-2 rounded-md transition-all ${metalSeleccionado?.nombre === metal.nombre ? 'bg-[#DC9C5C]' : 'bg-[#F5F1F1]'}`}
                >
                  <img 
                    src={metal.imagen} 
                    alt={metal.nombre}
                    className="w-full h-24 object-cover rounded"
                  />
                  <p className="text-[#7B2710] font-semibold mt-2">{metal.nombre}</p>
                  <p className="text-[#762114]">${metal.precio}</p>
                </button>
              ))}
            </div>
          </div>   
        </div>

        {/* Resumen y precio */}
        <div className="mt-8 bg-[#762114] bg-opacity-80 p-4 rounded-lg">
          <h3 className="text-xl font-bold text-[#F5F1F1] mb-2">Tu Selección</h3>
          
          <div className="text-[#F5F1F1]">
            {metalSeleccionado && <p>Metal: {metalSeleccionado.nombre} (${metalSeleccionado.precio})</p>}
            {piedraSeleccionada && <p>Piedra: {piedraSeleccionada.nombre} (${piedraSeleccionada.precio})</p>}
            {piezaSeleccionada && <p>Pieza: {piezaSeleccionada.nombre} (${piezaSeleccionada.precio})</p>}
            
            <div className="border-t border-[#DC9C5C] my-2"></div>
            
            <p className="text-lg font-bold">Total: ${precioTotal}</p>
          </div>

          <button
            onClick={agregarAlCarrito}
            disabled={!metalSeleccionado || !piedraSeleccionada || !piezaSeleccionada}
            className="mt-4 bg-[#DC9C5C] hover:bg-[#8C9560] text-[#7B2710] font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
}