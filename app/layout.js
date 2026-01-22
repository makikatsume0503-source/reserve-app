import './globals.css';

export const metadata = {
  title: 'Reserve App',
  description: 'Salon Customer Management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
