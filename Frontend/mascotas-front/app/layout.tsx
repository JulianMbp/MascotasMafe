import { Inter } from 'next/font/google'
import '../styles/globals.css'; // Ajusta la ruta del CSS

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Mascotas App',
  description: 'Aplicación de gestión de mascotas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
} 