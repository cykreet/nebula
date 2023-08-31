import { config } from "../config.js";

export function isInitiator(input: string): boolean {
  return config.initiators.includes(input.toLowerCase());
}
