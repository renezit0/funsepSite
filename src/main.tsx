import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

const isHttpProtocol =
  typeof window !== "undefined" &&
  (window.location.protocol === "http:" || window.location.protocol === "https:");

if (isHttpProtocol) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true);
    },
  });

  window.addEventListener("focus", () => {
    updateSW();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
