import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
const ensurePwaIcon = () => ({
  name: "ensure-pwa-icon",
  buildStart() {
    const publicDir = path.resolve(__dirname, "public");
    const srcIcon = path.resolve(__dirname, "src/assets/logofsp.png");
    const publicIcon = path.resolve(publicDir, "logofsp.png");

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    if (fs.existsSync(srcIcon)) {
      fs.copyFileSync(srcIcon, publicIcon);
    }
  },
});

export default defineConfig(({ mode }) => ({
  base: '', // build para a raiz do domínio
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    ensurePwaIcon(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logofsp.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      },
      manifest: {
        name: "FUNSEP - Fundo de Saúde dos Servidores do Poder Judiciário",
        short_name: "FUNSEP",
        description: "Sistema de relatórios e gestão de associados",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#1E63E9",
        background_color: "#ffffff",
        icons: [
          {
            src: "/logofsp.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/logofsp.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/logofsp.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
