if (!globalThis.TextDecoder || !globalThis.TextEncoder) {
  require("fast-text-encoding");
}

export * from "./def";
export * from "./check";
export * from "./converters/common";
export * from "./merge";
export * from "./converver";
