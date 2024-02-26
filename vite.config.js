import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import { vitePages } from "vite-plugin-pages"
import { ViteSSG } from "vite-ssg"
import Vue from "@vitejs/plugin-vue"

export default defineConfig({
  // build: {
  //   base: "/BeautyFin/dist/assets/",
  // },
  plugins: [
    Vue(),
    vitePages(),
    VitePWA(),
    ViteSSG(),
    "vite-plugin-gh-pages",
    {
      name: "vite-plugin-gh-pages",
      options: {
        base: "/BeautyFin/",
      },
    },
  ],
})
