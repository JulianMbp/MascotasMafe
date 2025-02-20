import "@/styles/globals.css";
import "leaflet/dist/leaflet.css";
import type { AppProps } from "next/app";
import dynamic from 'next/dynamic';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

// Evitar problemas de SSR con react-leaflet
export default dynamic(() => Promise.resolve(MyApp), {
  ssr: false,
});
