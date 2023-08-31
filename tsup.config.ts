import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/main.ts"],
	platform: "node",
	format: ["esm"],
});
