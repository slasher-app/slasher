import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss(), nodePolyfills()]
  }),
  manifest: {
    permissions: ["storage", "tabs"],
  },
});
