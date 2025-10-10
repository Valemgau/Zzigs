// src/ThemeProvider.js
import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

// Thèmes clairs et sombres basiques, à adapter selon ton besoin
const themes = {
  light: {
    mode: "light",
    background: "#FFFFFF",
    text: "#18181B",
    primary: "#2970fa",
    // Ajoute ici d'autres couleurs si besoin
  },
  dark: {
    mode: "dark",
    background: "#18181B",
    text: "#FFFFFF",
    primary: "#9CC9FF",
    // Ajoute ici d'autres couleurs si besoin
  },
};

const ThemeContext = createContext({
  theme: themes.light,
});

export function ThemeProvider({ children }) {
  const colorScheme = useColorScheme?.() || "light";
  const theme = useMemo(
    () => (colorScheme === "dark" ? themes.dark : themes.light),
    [colorScheme]
  );

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext).theme;
}
