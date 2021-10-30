if (!globalThis.TextDecoder || !globalThis.TextEncoder) {
  require("fast-text-encoding");
}

export * from "./def";
export * from "./check";
export * from "./common";
export * from "./converver";
