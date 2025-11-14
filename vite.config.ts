import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  // ⬇️ IMPORTANT CHANGE
  base: "/",
  // or simply omit `base` completely, default is "/"
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "XXXFriseursalon",
        short_name: "Friseursalon",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve("src"),
      "@widgets": path.resolve("src/widgets"),
      "@features": path.resolve("src/features"),
      "@entities": path.resolve("src/entities"),
    },
  },
})
