import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
});

window.addEventListener("focus", () => {
  updateSW();
});

createRoot(document.getElementById("root")!).render(<App />);
