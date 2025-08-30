import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss(), nodePolyfills()]
  }),
  manifestVersion: 3,
  manifest: {
    permissions: ["storage", "tabs"],
  },
});
