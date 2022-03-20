if (!globalThis.TextDecoder || !globalThis.TextEncoder) {
  require("fast-text-encoding");
}

export * from "./converver";
export * from "./def";
