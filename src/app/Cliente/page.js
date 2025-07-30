"use client";

import { useEffect, useState } from "react";
import { FiHome } from "react-icons/fi";
import { useRouter } from 'next/navigation';
import IconoCarrito from "@/components/IconoCarrito";
import { HiLogout } from "react-icons/hi";

const menuItems = [
  { 
    title: "Mis Compras",
    content: "purchases" 
  },
  { 
    title: "Mi Perfil",
    content: "profile" 
  },
  { 
    title: "Ayuda",
    content: "help" 
  },
  { 
    title: "Eliminar cuenta",
    content: "delete" 
  },
];

// Datos de ejemplo para compras
const samplePurchases = [
  {
    folio: "F123456",
    date: "2023-10-15",
    image: "/producto1.jpg",
    name: "Producto Ejemplo 1",
    total: 1250.50,
    status: "Enviado"
  },
  {
    folio: "F789012",
    date: "2023-11-02",
    image: "/producto2.jpg",
    name: "Producto Ejemplo 2",
    total: 899.99,
    status: "Entregado"
  },
];

export default function ClientePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [profileData, setProfileData] = useState({
    nombre: "",
    apellidos: "",
    correo: "",
    direccion: {
      calle: "",
      numeroExterior: "",
      numeroInterior: "",
      colonia: "",
      codigoPostal: ""
    },
    telefonoCelular: "",
    otroTelefono: ""
  });
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [message, setMessage] = useState("");

  const goBack = () => {
    router.back();
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // Inicializar datos del perfil con los del usuario
        setProfileData({
          nombre: userData.nombre || "",
          apellidos: userData.apellidos || "",
          correo: userData.correo || "",
          direccion: userData.direccion || {
            calle: "",
            numeroExterior: "",
            numeroInterior: "",
            colonia: "",
            codigoPostal: ""
          },
          telefonoCelular: userData.telefonoCelular || "",
          otroTelefono: userData.otroTelefono || ""
        });
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error al recuperar usuario:", error);
      router.push("/login");
    }
  }, [router]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes("direccion.")) {
      const field = name.split(".")[1];
      setProfileData(prev => ({
        ...prev,
        direccion: {
          ...prev.direccion,
          [field]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfileChanges = () => {
    // Aquí iría la lógica para guardar los cambios en el backend
    localStorage.setItem("user", JSON.stringify({...user, ...profileData}));
    setMessage("Cambios guardados correctamente");
    setTimeout(() => setMessage(""), 3000);
  };

  const savePasswordChanges = () => {
    // Validación y lógica para cambiar contraseña
    if (passwordData.new !== passwordData.confirm) {
      setMessage("Las contraseñas no coinciden");
      return;
    }
    setMessage("Contraseña cambiada correctamente");
    setTimeout(() => setMessage(""), 3000);
    setPasswordData({ current: "", new: "", confirm: "" });
    setShowPasswordForm(false);
  };

  const confirmDeleteAccount = () => {
    // Lógica para eliminar cuenta
    setShowDeleteConfirmation(false);
    handleLogout();
    setMessage("Cuenta eliminada correctamente");
  };

  if (!user) {
    return <p>Cargando...</p>;
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center p-4 sm:p-6 relative"
      style={{ backgroundImage: "url('/fondo.png')" }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative z-10 max-w-4xl mx-auto bg-[#F5F1F1] p-4 sm:p-6 rounded-lg shadow-lg border-4 border-[#762114]">
        <div className="flex flex-col sm:flex-row items-center mb-4">
          <div className="relative group"></div>
          <a href="/" className="text-[#7B2710] text-2xl sm:text-3xl mb-2 sm:mb-0 sm:mr-4 hover:text-[#DC9C5C]">
            <FiHome />
          </a>
          <h1 className="text-2xl sm:text-4xl font-serif text-[#7B2710] text-center">Bienvenid@, {user.nombre}!</h1>
        </div>
        <div className="absolute top-4 right-4 z-50 text-[#7B2710] hover:text-[#DC9C5C]">
          <IconoCarrito />
        </div>
        <p className="text-base sm:text-lg text-[#7B2710] mb-4 sm:mb-0">Correo: {user.correo}</p>
        
        {/* Menú vertical */}
        <div className="flex flex-col md:flex-row mt-6 gap-4">
          <nav className="bg-[#DC9C5C] p-2 sm:p-4 rounded-lg w-full md:w-64">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <button 
                    onClick={() => setActiveMenu(activeMenu === item.content ? null : item.content)}
                    className={`text-[#7B2710] font-serif font-bold px-4 py-2 hover:bg-[#8C9560] transition-colors rounded-lg w-full text-left ${activeMenu === item.content ? 'bg-[#8C9560]' : ''}`}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Contenido del menú seleccionado */}
          <div className="flex-1 bg-[#F5F1F1] p-4 rounded-lg">
            {message && (
              <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
                {message}
              </div>
            )}
            
            {activeMenu === "purchases" && (
              <div>
                <h2 className="text-2xl font-serif text-[#7B2710] mb-4">Mis Compras</h2>
                {samplePurchases.map((purchase, index) => (
                  <div key={index} className="mb-6 p-4 border-b border-[#DC9C5C]">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                        <img src={purchase.image} alt={purchase.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p><span className="font-bold">Folio:</span> {purchase.folio}</p>
                        <p><span className="font-bold">Fecha:</span> {purchase.date}</p>
                        <p><span className="font-bold">Artículo:</span> {purchase.name}</p>
                        <p><span className="font-bold">Total:</span> ${purchase.total.toFixed(2)}</p>
                        <p>
                          <span className="font-bold">Estado:</span> 
                          <span className={`ml-2 px-2 py-1 rounded ${
                            purchase.status === "En proceso" ? "bg-yellow-200 text-yellow-800" :
                            purchase.status === "Enviado" ? "bg-blue-200 text-blue-800" :
                            "bg-green-200 text-green-800"
                          }`}>
                            {purchase.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeMenu === "profile" && (
              <div>
                <h2 className="text-2xl font-serif text-[#7B2710] mb-4">Mi Perfil</h2>
                
                <div className="mb-6">
                  <h3 className="text-xl font-serif text-[#7B2710] mb-2">Mis Datos</h3>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#7B2710] mb-1">Nombre</label>
                      <input
                        type="text"
                        name="nombre"
                        value={profileData.nombre}
                        onChange={handleProfileChange}
                        className="w-full p-2 border border-[#DC9C5C] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#7B2710] mb-1">Apellidos</label>
                      <input
                        type="text"
                        name="apellidos"
                        value={profileData.apellidos}
                        onChange={handleProfileChange}
                        className="w-full p-2 border border-[#DC9C5C] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#7B2710] mb-1">Correo</label>
                      <input
                        type="email"
                        name="correo"
                        value={profileData.correo}
                        onChange={handleProfileChange}
                        className="w-full p-2 border border-[#DC9C5C] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#7B2710] mb-1">Teléfono Celular</label>
                      <input
                        type="tel"
                        name="telefonoCelular"
                        value={profileData.telefonoCelular}
                        onChange={handleProfileChange}
                        className="w-full p-2 border border-[#DC9C5C] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#7B2710] mb-1">Otro Teléfono</label>
                      <input
                        type="tel"
                        name="otroTelefono"
                        value={profileData.otroTelefono}
                        onChange={handleProfileChange}
                        className="w-full p-2 border border-[#DC9C5C] rounded"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <h4 className="text-lg font-serif text-[#7B2710] mb-2">Dirección</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[#7B2710] mb-1">Calle</label>
                          <input
                            type="text"
                            name="direccion.calle"
                            value={profileData.direccion.calle}
                            onChange={handleProfileChange}
                            className="w-full p-2 border border-[#DC9C5C] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#7B2710] mb-1">Número Exterior</label>
                          <input
                            type="text"
                            name="direccion.numeroExterior"
                            value={profileData.direccion.numeroExterior}
                            onChange={handleProfileChange}
                            className="w-full p-2 border border-[#DC9C5C] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#7B2710] mb-1">Número Interior</label>
                          <input
                            type="text"
                            name="direccion.numeroInterior"
                            value={profileData.direccion.numeroInterior}
                            onChange={handleProfileChange}
                            className="w-full p-2 border border-[#DC9C5C] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#7B2710] mb-1">Colonia</label>
                          <input
                            type="text"
                            name="direccion.colonia"
                            value={profileData.direccion.colonia}
                            onChange={handleProfileChange}
                            className="w-full p-2 border border-[#DC9C5C] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#7B2710] mb-1">Código Postal</label>
                          <input
                            type="text"
                            name="direccion.codigoPostal"
                            value={profileData.direccion.codigoPostal}
                            onChange={handleProfileChange}
                            className="w-full p-2 border border-[#DC9C5C] rounded"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 mt-4">
                      <button
                        type="button"
                        onClick={saveProfileChanges}
                        className="bg-[#7B2710] text-white px-4 py-2 rounded hover:bg-[#5a1d0c] transition-colors"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                </div>
                
                <div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="text-[#7B2710] font-serif font-bold hover:underline mb-4"
                  >
                    Cambiar Contraseña
                  </button>
                  
                  {showPasswordForm && (
                    <div className="bg-[#f8f8f8] p-4 rounded-lg border border-[#DC9C5C]">
                      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-[#7B2710] mb-1">Contraseña Actual</label>
                          <input
                            type="password"
                            name="current"
                            value={passwordData.current}
                            onChange={handlePasswordChange}
                            className="w-full p-2 border border-[#DC9C5C] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#7B2710] mb-1">Nueva Contraseña</label>
                          <input
                            type="password"
                            name="new"
                            value={passwordData.new}
                            onChange={handlePasswordChange}
                            className="w-full p-2 border border-[#DC9C5C] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#7B2710] mb-1">Confirmar Contraseña</label>
                          <input
                            type="password"
                            name="confirm"
                            value={passwordData.confirm}
                            onChange={handlePasswordChange}
                            className="w-full p-2 border border-[#DC9C5C] rounded"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={savePasswordChanges}
                            className="bg-[#7B2710] text-white px-4 py-2 rounded hover:bg-[#5a1d0c] transition-colors mr-2"
                          >
                            Guardar Contraseña
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPasswordForm(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeMenu === "help" && (
              <div>
                <h2 className="text-2xl font-serif text-[#7B2710] mb-4">Ayuda</h2>
                <p className="mb-4">¿Necesitas ayuda? Envíanos un mensaje:</p>
                <a 
                  href="https://wa.me/5211234567890" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <img src="/whatsapp-icon.png" alt="WhatsApp" className="w-6 h-6 mr-2" />
                  Enviar mensaje por WhatsApp
                </a>
              </div>
            )}
            
            {activeMenu === "delete" && (
              <div>
                <h2 className="text-2xl font-serif text-[#7B2710] mb-4">Eliminar Cuenta</h2>
                <p className="mb-4">Eliminar tu cuenta es permanente. Todos tus datos serán borrados y no podrás recuperarlos.</p>
                
                {!showDeleteConfirmation ? (
                  <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Eliminar Mi Cuenta
                  </button>
                ) : (
                  <div className="bg-[#f8f8f8] p-4 rounded-lg border border-red-200">
                    <p className="mb-4 font-bold">¿Estás segur@ de que quieres eliminar tu cuenta?</p>
                    <div className="flex gap-4">
                      <button
                        onClick={confirmDeleteAccount}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirmation(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                      >
                        No, cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!activeMenu && (
              <div className="text-center py-8">
                <p className="text-xl text-[#7B2710]">Selecciona una opción del menú para comenzar</p>
              </div>
            )}
          </div>
        </div>
        
        <button onClick={handleLogout} className="flex items-center text-[#7B2710] hover:text-[#DC9C5C] font-semibold mt-4">
          <HiLogout className="text-xl mr-2 font-bold" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}