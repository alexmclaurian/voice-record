import "./globals.css";
import { DeepgramProvider } from '../lib/contexts/DeepgramContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DeepgramProvider>
          {children}
        </DeepgramProvider>
      </body>
    </html>
  );
}
