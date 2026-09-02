import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss()],
  esbuild: {
    legalComments: "none"
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production")
  },
  resolve: {
    alias: {
      "@": root
    }
  },
  build: {
    minify: "esbuild",
    outDir: path.join(root, "assets/build"),
    emptyOutDir: true,
    lib: {
      entry: path.join(root, "scripts/menu-entry.tsx"),
      name: "SnowMenu",
      formats: ["iife"],
      fileName: () => "menu.js",
      cssFileName: "menu"
    }
  }
});
