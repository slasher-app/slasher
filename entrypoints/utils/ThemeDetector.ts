type Theme = "dark" | "light";

function detectTheme(): Theme {
  try {
    const body = document.body;
    const html = document.documentElement;

    const bg = window.getComputedStyle(body).backgroundColor;
    if (bg && bg.startsWith("rgb")) {
      const rgb = bg.match(/\d+/g)?.map(Number);
      if (rgb && rgb.length >= 3) {
        const [r, g, b] = rgb;
        // Calculate perceived brightness using luminance formula (ITU-R BT.601)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128 ? "dark" : "light";
      }
    }

    const attrTheme = html.getAttribute("data-theme") || body.getAttribute("data-theme");
    if (attrTheme) {
      const theme = attrTheme.toLowerCase();
      if (theme.includes("dark")) return "dark";
      if (theme.includes("light")) return "light";
    }

    const classes = [...html.classList, ...body.classList];
    if (classes.some(c => c.toLowerCase().includes("dark"))) return "dark";
    if (classes.some(c => c.toLowerCase().includes("light"))) return "light";

    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";

    return "light";
  } catch (error) {
    return "light";
  }
}

export {
  Theme,
  detectTheme
};
