import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from "react-hot-toast";
import { useAuth } from '@/components/AuthContext';

const PerfilUsuario = () => {
  const { user, loading } = useAuth();
  const [profileData, setProfileData] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    direccion: {
      calle: '',
      numExt: '',
      numInt: '',
      colonia: '',
      codPostal: '',
      municipio: '',
      estado: '',
      infAdicional: ''
    },
    telefonos: {
      principal: '',
      secundario: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const userId = user?.id_cliente ?? null;
  
  

  // Cargar datos del usuario al montar el componente
 useEffect(() => {
  if (loading) return;
  if (!userId) {
    console.warn('No hay usuario autenticado');
    return;
  }

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/datosFormulario', {
          headers: {
            'x-user-id': user.id_cliente
          }
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [loading, user]); // 👈 depende de loading y user

  // Validaciones de campos
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'nombre':
        case 'apellidos':
        // Eliminar cualquier carácter que no sea letra o acento
        const cleanedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, ' ');
        
        if (cleanedValue.length < 2 || cleanedValue.length > 35) {
            newErrors[name] = 'Debe tener entre 2 y 35 letras (sin caracteres especiales)';
        } else if (value !== cleanedValue) {
            // Si el valor original difiere del limpiado, mostrar error y autocorregir
            newErrors[name] = 'Solo se permiten letras y acentos';
            // Autocorrección (opcional)
            if (name === 'nombre') {
            setProfileData(prev => ({...prev, nombre: cleanedValue}));
            } else {
            setProfileData(prev => ({...prev, apellidos: cleanedValue}));
            }
        } else {
            delete newErrors[name];
        }
        break;
      
      case 'correo':
            // Limpiar el valor (opcional, solo si necesitas filtrar caracteres)
            const cleanedEmail = value.slice(0, 50); // Cortar a 50 caracteres máximo
            
            if (cleanedEmail.length > 50) {
                newErrors[name] = 'El correo no puede exceder 50 caracteres';
                // Opcional: Autocorregir el valor
                if (name === 'correo') {
                setProfileData(prev => ({...prev, correo: cleanedEmail}));
                }
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
                newErrors[name] = 'Correo electrónico inválido';
            } else {
                delete newErrors[name];
            }
            break;
                
      case 'telefonos.principal':
      case 'telefonos.secundario':
        if (value && !/^[0-9]{10}$/.test(value)) {
          newErrors[name] = 'Debe tener 10 dígitos';
        } else {
          delete newErrors[name];
        }
        break;
      
      case 'direccion.calle':
      case 'direccion.colonia':
      case 'direccion.municipio':
      case 'direccion.estado':
        if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,#-]{3,100}$/.test(value)) {
          newErrors[name] = 'Caracteres inválidos (3-100 caracteres)';
        } else {
          delete newErrors[name];
        }
        break;
      
      case 'direccion.numExt':
        if (!/^[a-zA-Z0-9\s-]{1,10}$/.test(value)) {
          newErrors[name] = 'Máximo 10 caracteres alfanuméricos';
        } else {
          delete newErrors[name];
        }
        break;
      
      case 'direccion.numInt':
        if (value && !/^[a-zA-Z0-9\s-]{1,10}$/.test(value)) {
          newErrors[name] = 'Máximo 10 caracteres alfanuméricos';
        } else {
          delete newErrors[name];
        }
        break;
      
      case 'direccion.codPostal':
        if (!/^[0-9]{5}$/.test(value)) {
          newErrors[name] = 'Debe tener 5 dígitos';
        } else {
          delete newErrors[name];
        }
        break;
      
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en los inputs
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('direccion.')) {
      const field = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        direccion: {
          ...prev.direccion,
          [field]: value
        }
      }));
      validateField(name, value);
    } else if (name.startsWith('telefonos.')) {
      const field = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        telefonos: {
          ...prev.telefonos,
          [field]: value
        }
      }));
      validateField(name, value);
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
      validateField(name, value);
    }
  };
    // Guardar cambios
    const saveProfileChanges = async () => {
    // Validar todos los campos antes de enviar
    const isValid = Object.entries(profileData).every(([key, value]) => {
        if (typeof value === 'object') {
        return Object.entries(value).every(([subKey, subValue]) => {
            return validateField(`${key}.${subKey}`, subValue);
        });
        }
        return validateField(key, value);
    });
    
    if (!isValid) {
        toast.error('Por favor corrige los errores antes de guardar');
        return;
    }
    
    try {
        setIsLoading(true);
        await axios.put('/api/datosFormulario', profileData);
        toast.success('Datos guardados correctamente');
    } catch (error) {
        console.error('Error al guardar:', error);
        toast.error('Error al guardar los cambios');
    } finally {
        setIsLoading(false);
    }
    };

  return (
    <div className="mb-6">
      <h3 className="text-xl font-serif text-[#7B2710] mb-2">Mis Datos</h3>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sección de Datos Personales */}
        <div>
          <label className="block text-[#7B2710] mb-1">Nombre*</label>
          <input
            type="text"
            name="nombre"
            value={profileData.nombre}
            onChange={handleProfileChange}
            className="w-full p-2 border border-[#DC9C5C] rounded"
            maxLength={20}
          />
          {errors.nombre && <p className="text-red-500 text-sm">{errors.nombre}</p>}
        </div>
        
        <div>
          <label className="block text-[#7B2710] mb-1">Apellidos*</label>
          <input
            type="text"
            name="apellidos"
            value={profileData.apellidos}
            onChange={handleProfileChange}
            className="w-full p-2 border border-[#DC9C5C] rounded"
            maxLength={25}
          />
          {errors.apellidos && <p className="text-red-500 text-sm">{errors.apellidos}</p>}
        </div>
        
        <div>
          <label className="block text-[#7B2710] mb-1">Correo Electrónico*</label>
          <input
            type="email"
            name="correo"
            value={profileData.correo}
            onChange={handleProfileChange}
            className="w-full p-2 border border-[#DC9C5C] rounded"
            maxLength={35}
          />
          {errors.correo && <p className="text-red-500 text-sm">{errors.correo}</p>}
        </div>
        
        {/* Sección de Contacto */}
        <div>
          <label className="block text-[#7B2710] mb-1">Teléfono Principal*</label>
          <div className="flex">
            <span className="p-2 bg-gray-200 border border-[#DC9C5C] rounded-l">+52</span>
            <input
              type="tel"
              name="telefonos.principal"
              value={profileData.telefonos.principal}
              onChange={handleProfileChange}
              className="w-full p-2 border-t border-r border-b border-[#DC9C5C] rounded-r"
              maxLength={10}
              placeholder="10 dígitos"
               pattern="[0-9]*" // Esto evita caracteres no numéricos en dispositivos móviles
              inputMode="numeric" // Muestra teclado numérico en móviles
            />
          </div>
          {errors['telefonos.principal'] && <p className="text-red-500 text-sm">{errors['telefonos.principal']}</p>}
        </div>
        
        <div>
          <label className="block text-[#7B2710] mb-1">Teléfono Secundario</label>
          <div className="flex">
            <span className="p-2 bg-gray-200 border border-[#DC9C5C] rounded-l">+52</span>
            <input
              type="tel"
              name="telefonos.secundario"
              value={profileData.telefonos.secundario}
              onChange={handleProfileChange}
              className="w-full p-2 border-t border-r border-b border-[#DC9C5C] rounded-r"
              maxLength={10}
              placeholder="10 dígitos"
               pattern="[0-9]*" // Esto evita caracteres no numéricos en dispositivos móviles
            inputMode="numeric" // Muestra teclado numérico en móviles
            />
          </div>
          {errors['telefonos.secundario'] && <p className="text-red-500 text-sm">{errors['telefonos.secundario']}</p>}
        </div>
        
        {/* Sección de Dirección */}
        <div className="md:col-span-2">
          <h4 className="text-lg font-serif text-[#7B2710] mb-2">Dirección</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[#7B2710] mb-1">Calle*</label>
              <input
                type="text"
                name="direccion.calle"
                value={profileData.direccion.calle}
                onChange={handleProfileChange}
                className="w-full p-2 border border-[#DC9C5C] rounded"
                maxLength={30}
              />
              {errors['direccion.calle'] && <p className="text-red-500 text-sm">{errors['direccion.calle']}</p>}
            </div>
            
            <div>
              <label className="block text-[#7B2710] mb-1">Número Exterior*</label>
              <input
                type="text"
                name="direccion.numExt"
                value={profileData.direccion.numExt}
                onChange={handleProfileChange}
                className="w-full p-2 border border-[#DC9C5C] rounded"
                maxLength={10}
              />
              {errors['direccion.numExt'] && <p className="text-red-500 text-sm">{errors['direccion.numExt']}</p>}
            </div>
            
            <div>
              <label className="block text-[#7B2710] mb-1">Número Interior</label>
              <input
                type="text"
                name="direccion.numInt"
                value={profileData.direccion.numInt}
                onChange={handleProfileChange}
                className="w-full p-2 border border-[#DC9C5C] rounded"
                maxLength={10}
              />
              {errors['direccion.numInt'] && <p className="text-red-500 text-sm">{errors['direccion.numInt']}</p>}
            </div>
            
            <div>
              <label className="block text-[#7B2710] mb-1">Colonia*</label>
              <input
                type="text"
                name="direccion.colonia"
                value={profileData.direccion.colonia}
                onChange={handleProfileChange}
                className="w-full p-2 border border-[#DC9C5C] rounded"
                maxLength={30}
              />
              {errors['direccion.colonia'] && <p className="text-red-500 text-sm">{errors['direccion.colonia']}</p>}
            </div>
            
            <div>
              <label className="block text-[#7B2710] mb-1">Código Postal*</label>
              <input
                type="text"
                name="direccion.codPostal"
                value={profileData.direccion.codPostal}
                onChange={handleProfileChange}
                className="w-full p-2 border border-[#DC9C5C] rounded"
                maxLength={5}
              />
              {errors['direccion.codPostal'] && <p className="text-red-500 text-sm">{errors['direccion.codPostal']}</p>}
            </div>
            
            <div>
              <label className="block text-[#7B2710] mb-1">Municipio*</label>
              <input
                type="text"
                name="direccion.municipio"
                value={profileData.direccion.municipio}
                onChange={handleProfileChange}
                className="w-full p-2 border border-[#DC9C5C] rounded"
                maxLength={30}
              />
              {errors['direccion.municipio'] && <p className="text-red-500 text-sm">{errors['direccion.municipio']}</p>}
            </div>
            
            <div>
  <label className="block text-[#7B2710] mb-1">Estado*</label>
  <select
    name="direccion.estado"
    value={profileData.direccion.estado}
    onChange={handleProfileChange}
    className="w-full p-2 border border-[#DC9C5C] rounded focus:ring-2 focus:ring-[#7B2710] focus:border-[#7B2710] transition-all"
    required
  >
    <option value="">Selecciona un estado</option>
    <option value="Aguascalientes">Aguascalientes</option>
    <option value="Baja California">Baja California</option>
    <option value="Baja California Sur">Baja California Sur</option>
    <option value="Campeche">Campeche</option>
    <option value="Chiapas">Chiapas</option>
    <option value="Chihuahua">Chihuahua</option>
    <option value="Ciudad de México">Ciudad de México</option>
    <option value="Coahuila">Coahuila</option>
    <option value="Colima">Colima</option>
    <option value="Durango">Durango</option>
    <option value="Estado de México">Estado de México</option>
    <option value="Guanajuato">Guanajuato</option>
    <option value="Guerrero">Guerrero</option>
    <option value="Hidalgo">Hidalgo</option>
    <option value="Jalisco">Jalisco</option>
    <option value="Michoacán">Michoacán</option>
    <option value="Morelos">Morelos</option>
    <option value="Nayarit">Nayarit</option>
    <option value="Nuevo León">Nuevo León</option>
    <option value="Oaxaca">Oaxaca</option>
    <option value="Puebla">Puebla</option>
    <option value="Querétaro">Querétaro</option>
    <option value="Quintana Roo">Quintana Roo</option>
    <option value="San Luis Potosí">San Luis Potosí</option>
    <option value="Sinaloa">Sinaloa</option>
    <option value="Sonora">Sonora</option>
    <option value="Tabasco">Tabasco</option>
    <option value="Tamaulipas">Tamaulipas</option>
    <option value="Tlaxcala">Tlaxcala</option>
    <option value="Veracruz">Veracruz</option>
    <option value="Yucatán">Yucatán</option>
    <option value="Zacatecas">Zacatecas</option>
  </select>
  {errors['direccion.estado'] && (
    <p className="text-red-500 text-sm mt-1">{errors['direccion.estado']}</p>
  )}
</div>
            
            <div className="md:col-span-3">
              <label className="block text-[#7B2710] mb-1">Referencias o Información Adicional</label>
              <textarea
                name="direccion.infAdicional"
                value={profileData.direccion.infAdicional}
                onChange={handleProfileChange}
                className="w-full p-2 border border-[#DC9C5C] rounded"
                rows={3}
                maxLength={100}
              />
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2 mt-4">
          <button
            type="button"
            onClick={saveProfileChanges}
            disabled={isLoading || Object.keys(errors).length > 0}
            className={`bg-[#7B2710] text-white px-4 py-2 rounded hover:bg-[#5a1d0c] transition-colors ${(isLoading || Object.keys(errors).length > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PerfilUsuario;