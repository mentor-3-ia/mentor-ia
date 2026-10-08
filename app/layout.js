export const metadata = {
  title: 'Mentor-IA · Orientación vocacional y becas',
  description: 'Orientador vocacional con IA para jóvenes del Perú. Descubre tu perfil RIASEC y encuentra becas reales.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, background: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
