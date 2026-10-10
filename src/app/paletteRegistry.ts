import { createContext, useContext, type ReactNode } from "react";

/** Features (lessons, arcade, tutor…) contribute palette entries through this registry. */
export interface PaletteExtensionItem {
  id: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  keywords?: string[];
  run: () => void;
}

export interface PaletteExtensions {
  actions: PaletteExtensionItem[];
  groups: Array<{ heading: string; items: PaletteExtensionItem[] }>;
}

const EMPTY: PaletteExtensions = { actions: [], groups: [] };

export const PaletteExtensionsContext = createContext<PaletteExtensions>(EMPTY);

export function usePaletteExtensions(): PaletteExtensions {
  return useContext(PaletteExtensionsContext);
}
