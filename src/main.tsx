import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const raiz = document.getElementById("root");
if (!raiz) {
	throw new Error("Falta o elemento #root no index.html.");
}

createRoot(raiz).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
