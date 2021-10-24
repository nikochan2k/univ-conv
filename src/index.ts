if (!globalThis.TextDecoder || !globalThis.TextEncoder) {
  require("fast-text-encoding");
}

export * from "./def";
export * from "./util";
export * from "./conv";
