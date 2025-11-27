import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss(), nodePolyfills()],
  }),
  manifest: {
    permissions: ["storage", "tabs"],
    browser_specific_settings: {
      gecko: {
        // @ts-ignore
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});
