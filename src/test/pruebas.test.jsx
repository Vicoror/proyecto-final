import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Login from '@/app/login/page';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

// Mock de las dependencias
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/components/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/Captcha', () => ({
  default: ({ onVerify }) => (
    <div data-testid="captcha" onClick={() => onVerify('mock-captcha-token')}>
      CAPTCHA Component
    </div>
  ),
}));

vi.mock('lucide-react', () => ({
  Home: () => <div>Home Icon</div>,
}));

// Mock para next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('Login Page', () => {
  const mockPush = vi.fn();
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de useRouter
    useRouter.mockReturnValue({
      push: mockPush,
    });

    // Mock de useAuth
    useAuth.mockReturnValue({
      login: mockLogin,
    });

    // Mock de localStorage
    Storage.prototype.setItem = vi.fn();

    // Mock de fetch global
    global.fetch = vi.fn();

    // Mock de alert
    global.alert = vi.fn();
  });

  it('debe renderizar correctamente todos los elementos', () => {
    render(<Login />);
    
    expect(screen.getByPlaceholderText('Correo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByText('Entrar')).toBeInTheDocument();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
    expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
    expect(screen.getByTestId('captcha')).toBeInTheDocument();
  });

  it('debe actualizar los estados de email y password al escribir en los inputs', () => {
    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText('Correo');
    const passwordInput = screen.getByPlaceholderText('Contraseña');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('debe mostrar error si se intenta enviar el formulario sin completar CAPTCHA', async () => {
    render(<Login />);
    
    const submitButton = screen.getByText('Entrar');
    
    fireEvent.click(submitButton);

    // Debug: muestra todo el HTML para ver dónde está el error
    // console.log(screen.debug());

    // Busca el error de manera más flexible
    const errorElement = await screen.findByText((content, element) => {
      return content.includes('CAPTCHA') && content.includes('completar');
    }, { timeout: 3000 });

    expect(errorElement).toBeInTheDocument();
  });

  it('debe completar el CAPTCHA correctamente', async () => {
    render(<Login />);
    
    const captcha = screen.getByTestId('captcha');
    fireEvent.click(captcha);

    // Verifica que el captchaToken se estableció correctamente
    const submitButton = screen.getByText('Entrar');
    fireEvent.click(submitButton);

    // No debería mostrar el error de CAPTCHA
    await waitFor(() => {
      const errorElements = screen.queryAllByText(/CAPTCHA|completar/i);
      expect(errorElements.length).toBe(0);
    });
  });

  it('debe deshabilitar el botón durante el loading', async () => {
    // Mock de fetch que nunca resuelve para simular loading infinito
    let resolveFetch;
    global.fetch.mockImplementationOnce(() => new Promise((resolve) => {
      resolveFetch = resolve;
    }));

    render(<Login />);
    
    // Completar CAPTCHA primero
    const captcha = screen.getByTestId('captcha');
    fireEvent.click(captcha);

    // Llenar formulario
    fireEvent.change(screen.getByPlaceholderText('Correo'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByText('Entrar');
    
    // Simular envío del formulario
    fireEvent.click(submitButton);

    // Esperar a que el botón se deshabilite
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    expect(submitButton.textContent).toBe('Cargando...');

    // Resolver la promesa para limpiar
    resolveFetch({ ok: true, json: () => Promise.resolve({ user: {} }) });
  });

  it('debe manejar errores de la API correctamente', async () => {
    // Mock de fetch para simular error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Credenciales inválidas' }),
    });

    render(<Login />);
    
    // Completar formulario
    fireEvent.change(screen.getByPlaceholderText('Correo'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'wrongpassword' },
    });
    
    // Completar CAPTCHA
    fireEvent.click(screen.getByTestId('captcha'));
    
    // Enviar formulario
    fireEvent.click(screen.getByText('Entrar'));

    // Busca todos los elementos con el texto y verifica que al menos uno existe
    const errorElements = await screen.findAllByText(/Credenciales inválidas/i);
    expect(errorElements.length).toBeGreaterThan(0);
  });

  it('debe redirigir a Admin para usuarios admin', async () => {
    // Mock de fetch para simular éxito
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        user: { 
          id: 1, 
          email: 'admin@example.com', 
          rol: 'admin' 
        } 
      }),
    });

    render(<Login />);
    
    // Completar formulario
    fireEvent.change(screen.getByPlaceholderText('Correo'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'adminpassword' },
    });
    
    // Completar CAPTCHA
    fireEvent.click(screen.getByTestId('captcha'));
    
    // Enviar formulario
    fireEvent.click(screen.getByText('Entrar'));

    // Debería redirigir a /Admin
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/Admin');
      expect(mockLogin).toHaveBeenCalledWith({
        id: 1,
        email: 'admin@example.com',
        rol: 'admin'
      });
    });
  });

  it('debe redirigir a Cliente para usuarios no admin', async () => {
    // Mock de fetch para simular éxito
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        user: { 
          id: 2, 
          email: 'user@example.com', 
          rol: 'user' 
        } 
      }),
    });

    render(<Login />);
    
    // Completar formulario
    fireEvent.change(screen.getByPlaceholderText('Correo'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'userpassword' },
    });
    
    // Completar CAPTCHA
    fireEvent.click(screen.getByTestId('captcha'));
    
    // Enviar formulario
    fireEvent.click(screen.getByText('Entrar'));

    // Debería redirigir a /Cliente
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/Cliente');
    });
  });

  it('debe guardar el usuario en localStorage al hacer login exitoso', async () => {
    const mockUser = { 
      id: 1, 
      email: 'test@example.com', 
      rol: 'admin' 
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser }),
    });

    render(<Login />);
    
    // Completar formulario
    fireEvent.change(screen.getByPlaceholderText('Correo'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'password123' },
    });
    
    // Completar CAPTCHA
    fireEvent.click(screen.getByTestId('captcha'));
    
    // Enviar formulario
    fireEvent.click(screen.getByText('Entrar'));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });
  });
});