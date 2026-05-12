import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MealSearchState {
  categoryFilter: string;
  recentQueries: string[];
  clearRecentQueries: () => void;
  rememberQuery: (query: string) => void;
  setCategoryFilter: (categoryFilter: string) => void;
}

export const useMealSearchStore = create<MealSearchState>()(
  persist(
    (set) => ({
      categoryFilter: "all",
      recentQueries: [],
      clearRecentQueries: () => set({ recentQueries: [] }),
      rememberQuery: (query) => {
        const normalizedQuery = query.trim();

        if (normalizedQuery.length < 2) {
          return;
        }

        set((state) => ({
          recentQueries: [
            normalizedQuery,
            ...state.recentQueries.filter(
              (item) => item.toLowerCase() !== normalizedQuery.toLowerCase()
            ),
          ].slice(0, 8),
        }));
      },
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
    }),
    {
      name: "smart-nutrition.meal-search",
      partialize: (state) => ({
        categoryFilter: state.categoryFilter,
        recentQueries: state.recentQueries,
      }),
    }
  )
);
