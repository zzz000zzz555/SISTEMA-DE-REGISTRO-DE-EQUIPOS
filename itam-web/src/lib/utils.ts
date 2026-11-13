import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const BASE_PATH = "/SISTEMA-DE-REGISTRO-DE-EQUIPOS";
export function withBase(path: string) {
  if (path.startsWith("http")) return path;
  return BASE_PATH + (path.startsWith("/") ? path : "/" + path);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}