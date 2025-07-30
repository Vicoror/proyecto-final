// app/layout.js
import { CartProvider } from '@/components/CartContext';
import { Geist, Geist_Mono } from 'next/font/google';
import { Alex_Brush } from 'next/font/google';
import './styles/globals.css';
import { AuthProvider } from "@/components/AuthContext";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
}); 

const alexBrush = Alex_Brush({
  subsets: ['latin'],
  weight: '400',
});

export const metadata = {
  title: 'Bernarda Sierra',
  description: 'Joyería artesanal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}



