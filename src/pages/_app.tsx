import { AppProps } from "next/app";
import { trpc } from "@/src/utils/trpc";

import "@/styles/globals.css";
import "@/styles/variationGraph.css";
import "@/styles/variationControls.css";

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default trpc.withTRPC(App);
