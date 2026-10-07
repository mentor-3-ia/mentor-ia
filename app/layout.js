
export const metadata = {
  title: 'Mentor-IA',
  description: 'Orientación vocacional y becas para jóvenes del Perú',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f7f7f8' }}>
        {children}
      </body>
    </html>
  );
}
