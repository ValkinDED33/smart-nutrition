/**
 * Fuzzy search with Levenshtein distance, synonyms, and multi-language support
 */

const levenshteinDistance = (left: string, right: string): number => {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const matrix: number[][] = Array.from({ length: left.length + 1 }, (_, rowIndex) =>
    Array.from({ length: right.length + 1 }, (_, columnIndex) =>
      rowIndex === 0 ? columnIndex : columnIndex === 0 ? rowIndex : 0
    )
  );

  for (let rowIndex = 1; rowIndex <= left.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= right.length; columnIndex += 1) {
      const substitutionCost = left[rowIndex - 1] === right[columnIndex - 1] ? 0 : 1;

      matrix[rowIndex]![columnIndex] = Math.min(
        matrix[rowIndex - 1]![columnIndex]! + 1,
        matrix[rowIndex]![columnIndex - 1]! + 1,
        matrix[rowIndex - 1]![columnIndex - 1]! + substitutionCost
      );
    }
  }

  return matrix[left.length]![right.length]!;
};

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const SYNONYM_MAP: Record<string, string[]> = {
  // Українська
  йогурт: ['грецький', 'skyr', 'йогурт', 'йогурту'],
  яйце: ['яйцо', 'яйця', 'білок', 'жовток'],
  масло: ['олія', 'жир', 'маслом', 'маслі'],
  мясо: ['курка', 'куриця', 'яловичина', 'свинина', 'м\'ясо'],
  хлеб: ['хліб', 'булка', 'бутерброд'],
  сір: ['сыр', 'сыру', 'твердий', 'моцарела'],
  молоко: ['молока', 'молочне', 'кисломолочний'],
  борщ: ['борщу', 'борщем'],
  суп: ['супу', 'щи', 'щів', 'рисовий'],
  каша: ['крупа', 'овсяна', 'гречка', 'рис'],
  салат: ['овощной', 'салату', 'свежий'],
  рибу: ['риба', 'рыба', 'рыбой', 'семга', 'форель', 'тунец'],
  
  // Polski
  jogurt: ['jogurt grecki', 'skyr', 'greckie', 'mleczny'],
  jajko: ['jajka', 'białko', 'żółtko'],
  mięso: ['kurczak', 'wołowina', 'wieprzowina', 'drób'],
  chleb: ['bułka', 'piekarniczy'],
  ser: ['sernik', 'mozzarela', 'twardy'],
  mleko: ['mleka', 'mleczny', 'mleczna'],
  zupa: ['zupka', 'rosół', 'barszcz'],
  kasza: ['żytnia', 'jagielna', 'manna', 'ryż'],
  ryba: ['łosoś', 'tuńczyk', 'dorads'],
  
  // English
  yogurt: ['yoghurt', 'greek', 'skyr', 'kefir'],
  egg: ['eggs', 'white', 'yolk', 'boiled', 'fried'],
  meat: ['chicken', 'beef', 'pork', 'turkey', 'ham'],
  bread: ['bun', 'roll', 'sandwich', 'toast'],
  cheese: ['cheddar', 'mozzarella', 'swiss', 'parmesan'],
  milk: ['dairy', 'lactose'],
  soup: ['broth', 'consommé', 'bisque'],
  rice: ['grain', 'risotto', 'pilaf'],
  fish: ['salmon', 'tuna', 'cod', 'herring'],
};

const expandSearchTokens = (normalized: string): string[] => {
  const baseTokens = normalized.split(/\s+/).filter(Boolean);
  const expanded = new Set<string>();

  baseTokens.forEach(token => {
    expanded.add(token);

    // Додай синоніми
    if (SYNONYM_MAP[token]) {
      SYNONYM_MAP[token].forEach(syn => expanded.add(normalizeText(syn)));
    }
  });

  return Array.from(expanded);
};

export function fuzzySearchProducts<T extends { id: string; name: string; brand?: string }>(
  query: string,
  products: T[],
  maxResults = 20
): Array<{ item: T; score: number }> {
  if (!query.trim()) {
    return [];
  }

  const normalized = normalizeText(query);
  const expandedTokens = expandSearchTokens(normalized);

  const results: Array<{ item: T; score: number; reason: string }> = [];

  products.forEach(product => {
    const itemText = normalizeText(`${product.name} ${product.brand || ''}`.trim());
    const itemTokens = itemText.split(/\s+/).filter(Boolean);

    let score = 0;

    // 1. Точное совпадение (вага 100)
    if (itemText === normalized) {
      score = 100;
    }

    // 2. Точное совпадение хоча б одного токена (вага 90)
    if (score === 0 && expandedTokens.some(token => itemTokens.includes(token))) {
      score = 90;
    }

    // 3. Опечатки (Levenshtein ≤ 2) (вага 70-80)
    if (score === 0) {
      itemTokens.forEach(token => {
        expandedTokens.forEach(qToken => {
          const distance = levenshteinDistance(qToken, token);
          if (distance === 1) {
            score = Math.max(score, 80);
          } else if (distance === 2 && qToken.length >= 5) {
            score = Math.max(score, 70);
          }
        });
      });
    }

    // 4. Префіксне совпадение (вага 60)
    if (score === 0 && itemTokens.some(token => token.startsWith(normalized))) {
      score = 60;
    }

    // 5. Часткове совпадение (вага 40-50)
    if (score === 0) {
      expandedTokens.forEach(token => {
        if (itemText.includes(token)) {
          score = Math.max(score, 50);
        }
      });
    }

    // 6. Токен-префікс (вага 30)
    if (score === 0) {
      expandedTokens.forEach(token => {
        itemTokens.forEach(itemToken => {
          if (itemToken.startsWith(token)) {
            score = Math.max(score, 30);
          }
        });
      });
    }

    if (score > 0) {
      results.push({ item: product, score, reason: 'match' });
    }
  });

  return results
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.item.name.length - b.item.name.length;
    })
    .slice(0, maxResults);
}
