import { AppProps } from "next/app";

import "@/styles/globals.css";
import "@/styles/variationGraph.css";
import "@/styles/variationControls.css";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
