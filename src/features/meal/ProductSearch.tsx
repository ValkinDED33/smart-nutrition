// src/features/meal/ProductSearch.tsx
import { useState } from "react";
import { ProductCard } from "./ProductCard";
import type { Product } from "../../shared/types/product";
import { mockProducts } from "../../shared/lib/mockProducts";

export const ProductSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  // Поиск продукта по имени из mockProducts
  const handleSearch = () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const filtered = mockProducts.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  };

  return (
    <div>
      {/* Пошук по тексту */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input
          placeholder="Пошук продукту"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: "6px 10px" }}
        />
        <button onClick={handleSearch}>Знайти</button>
      </div>

      {/* Список знайдених продуктів */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {results.length === 0 && <p>Результатів немає</p>}
        {results.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
