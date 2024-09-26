export default defineNitroConfig({
  // Nitro options
  logLevel: 1,
  esbuild: {
    options: {
      target: "esnext",
    },
  },
});
