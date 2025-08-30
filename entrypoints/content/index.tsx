import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "~/assets/tailwind.css";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "slasher-app",
      position: "inline",
      anchor: "body",
      append: "first",
      onMount: (container, _, shadowContainer) => {
        shadowContainer.style.visibility = "visible";
        // Don"t mount react app directly on <body>
        const wrapper = document.createElement("div");
        container.append(wrapper);

        const root = ReactDOM.createRoot(wrapper);
        root.render(<App />);
        return { root, wrapper };
      },
      onRemove: (elements) => {
        elements?.root.unmount();
        elements?.wrapper.remove();
      },
    });

    ui.mount();
  },
});
