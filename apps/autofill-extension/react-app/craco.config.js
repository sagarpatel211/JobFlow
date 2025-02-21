const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/components": path.resolve(__dirname, "src/components"),
      "@/lib": path.resolve(__dirname, "src/lib"),
      "lib": path.resolve(__dirname, "src/lib"),
      "components": path.resolve(__dirname, "src/components"),
    },
  },
};
