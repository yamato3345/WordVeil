import { useEffect, useState } from "react";

const STORAGE_KEY = "wordveil.favorites.v1";

function readFavorites(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved)
      ? [...new Set(saved.filter((word): word is string => typeof word === "string" && word.length > 0))]
      : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favoriteWords, setFavoriteWords] = useState(readFavorites);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteWords));
    } catch (error) {
      console.error("Could not save favorite words on this device", error);
    }
  }, [favoriteWords]);

  const toggleFavorite = (word: string) => {
    setFavoriteWords((current) => current.includes(word)
      ? current.filter((favorite) => favorite !== word)
      : [...current, word]);
  };

  return { favoriteWords, toggleFavorite };
}
