# 🏗️ АРХИТЕКТУРНЫЙ РЕФАКТОРИНГ — DETAILED ACTION PLAN

**Цель:** Преобразовать монолитную архитектуру в modular систему с явными слоями.

**Timeframe:** 9 дней (можно сокращать если фокусироваться на meal module)

---

## ФАЗА 1: STRUCTURE & SETUP (1 день)

### 1.1 Создать папки (30 мин)
```bash
mkdir -p src/domain/{meal,profile,products,shared}
mkdir -p src/data/{meal,profile,products,shared}
mkdir -p src/integration/openFoodFacts
mkdir -p src/state/{meal,profile,products,sync}
mkdir -p src/features/{meal,profile,products}/hooks
mkdir -p src/features/{meal,profile,products}/usecases
```

### 1.2 Setup пустых индексов (30 мин)
Каждая папка должна иметь `index.ts` для явных экспортов.

### 1.3 Configure TypeScript paths (30 мин)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@domain/*": ["src/domain/*"],
      "@data/*": ["src/data/*"],
      "@integration/*": ["src/integration/*"],
      "@state/*": ["src/state/*"],
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

### 1.4 ESLint rules for layers (30 мин)
```js
// Enforce dependency direction:
// state → features → domain ✓
// domain → data ✓
// features → integration ✗ (only through data)
```

---

## ФАЗА 2: EXTRACT MEAL DOMAIN (2 дня)

### 2.1 Создать domain types (4 часа)
**Файл:** `src/domain/meal/types.ts`

```typescript
export interface MealEntry {
  id: string;
  product: Product;
  quantity: number;
  mealType: MealType;
  eatenAt: Date;
  origin: 'manual' | 'barcode' | 'recipe';
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  unit: 'g' | 'ml' | 'piece';
  source: 'USDA' | 'OpenFoodFacts' | 'Manual' | 'Recipe';
  nutrients: Nutrients;
}

export interface MealType {
  value: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  label: string;
}

// и другие types...
```

### 2.2 Извлечь calculations (4 часа)
**Файл:** `src/domain/meal/calculations.ts`

```typescript
export function calculateMealTotalNutrients(
  items: MealEntry[]
): Nutrients {
  // Чистая функция, без Redux, без побочных эффектов
}

export function groupEntriesByMealType(
  items: MealEntry[]
): Record<MealType, MealEntry[]> {
  // Чистая функция
}

export function calculateMacroProgress(
  consumed: Nutrients,
  goals: MacroGoals
): MacroProgress {
  // Чистая функция
}
```

### 2.3 Создать validators (2 часа)
**Файл:** `src/domain/meal/validators.ts`

```typescript
export function isValidQuantity(quantity: number): boolean {
  return quantity > 0;
}

export function isValidMealType(type: string): type is MealType {
  return ['breakfast', 'lunch', 'dinner', 'snack'].includes(type);
}

export function validateMealEntry(entry: Partial<MealEntry>): ValidationResult {
  // Возвращает ошибки если невалидно
}
```

### 2.4 Создать rules (2 часа)
**Файл:** `src/domain/meal/rules.ts`

```typescript
export class MealRules {
  static canAddMeal(profile: Profile, totalCalories: number): boolean {
    // Бизнес-правила для добавления
    return totalCalories <= profile.dailyCalories * 1.5;
  }

  static shouldSuggestRepeat(lastMeal: MealEntry): boolean {
    // Бизнес-правила для предложения repeat
    const hoursSince = (Date.now() - lastMeal.eatenAt.getTime()) / 3600000;
    return hoursSince >= 20 && hoursSince <= 26;
  }
}
```

---

## ФАЗА 3: CREATE DATA LAYER (1 день)

### 3.1 Meal Repository Interface (2 часа)
**Файл:** `src/data/meal/repository.ts`

```typescript
export interface IMealRepository {
  // Query
  getMeals(dateKey: string): Promise<MealEntry[]>;
  getMealsByRange(startDate: Date, endDate: Date): Promise<MealEntry[]>;
  getMealById(id: string): Promise<MealEntry | null>;

  // Command
  createMeal(entry: MealEntry): Promise<MealEntry>;
  updateMeal(id: string, updates: Partial<MealEntry>): Promise<MealEntry>;
  deleteMeal(id: string): Promise<void>;
  
  // Cache
  clearCache(): void;
}

export class LocalMealRepository implements IMealRepository {
  constructor(private db: LocalDatabase) {}
  
  async getMeals(dateKey: string): Promise<MealEntry[]> {
    // Реализация для localStorage/IndexedDB
  }
}

export class SyncedMealRepository implements IMealRepository {
  constructor(
    private local: LocalMealRepository,
    private remote: RemoteMealRepository,
    private sync: SyncManager
  ) {}
  
  async getMeals(dateKey: string): Promise<MealEntry[]> {
    // Синхронизированная реализация
    const localData = await this.local.getMeals(dateKey);
    const remoteData = await this.remote.getMeals(dateKey);
    return this.sync.merge(localData, remoteData);
  }
}
```

### 3.2 Product Repository (2 часа)
**Файл:** `src/data/products/repository.ts`

```typescript
export interface IProductRepository {
  search(query: string): Promise<Product[]>;
  getByBarcode(barcode: string): Promise<Product | null>;
  getById(id: string): Promise<Product | null>;
  save(product: Product): Promise<Product>;
  getRecent(limit: number): Promise<Product[]>;
}

export class ProductRepository implements IProductRepository {
  constructor(
    private local: LocalProductCache,
    private openFoodFacts: OpenFoodFactsClient
  ) {}

  async search(query: string): Promise<Product[]> {
    const local = await this.local.search(query);
    const remote = await this.openFoodFacts.search(query);
    return this.merge(local, remote);
  }
}
```

### 3.3 Cache Layer (2 часа)
**Файл:** `src/data/meal/cache.ts`

```typescript
export interface ICache<T> {
  get(key: string): T | null;
  set(key: string, value: T): void;
  clear(): void;
}

export class MealCache implements ICache<MealEntry> {
  private cache = new Map<string, MealEntry>();
  
  get(key: string): MealEntry | null {
    return this.cache.get(key) || null;
  }

  set(key: string, value: MealEntry): void {
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

---

## ФАЗА 4: INTEGRATION LAYER (1 день)

### 4.1 OpenFoodFacts Client (2 часа)
**Файл:** `src/integration/openFoodFacts/client.ts`

```typescript
export class OpenFoodFactsClient {
  async searchByName(query: string): Promise<OffProduct[]> {
    const response = await this.httpClient.get(`/api/v0/products`, {
      params: { search_terms: query }
    });
    return response.data.products;
  }

  async getByBarcode(barcode: string): Promise<OffProduct | null> {
    try {
      const response = await this.httpClient.get(
        `/api/v0/product/${barcode}`
      );
      return response.data.product;
    } catch (e) {
      return null;
    }
  }
}
```

### 4.2 Mapper (2 часа)
**Файл:** `src/integration/openFoodFacts/mappers.ts`

```typescript
export function mapOffProductToDomain(off: OffProduct): Product {
  return {
    id: `off-${off.code}`,
    name: off.product_name,
    brand: off.brands,
    barcode: off.code,
    unit: 'g',
    source: 'OpenFoodFacts',
    nutrients: {
      calories: off.nutriments['energy-kcal'] || 0,
      protein: off.nutriments.proteins || 0,
      fat: off.nutriments.fat || 0,
      carbs: off.nutriments.carbohydrates || 0,
      // ... other fields
    }
  };
}
```

### 4.3 Error Handling (2 часа)
**Файл:** `src/integration/shared/errors.ts`

```typescript
export class IntegrationError extends Error {
  constructor(
    public code: string,
    public details: Record<string, any>,
    message: string
  ) {
    super(message);
  }
}

export class OfflineError extends IntegrationError {
  constructor() {
    super('OFFLINE', {}, 'No internet connection');
  }
}
```

---

## ФАЗА 5: STATE LAYER REFACTOR (2 дня)

### 5.1 Тонкий Redux slice (4 часа)
**Файл:** `src/state/meal/slice.ts`

```typescript
export const mealSlice = createSlice({
  name: 'meal',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Только UI-state mutations!
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    addItemOptimistically(state, action) {
      state.items.push(action.payload);
    },
  },
});

// Бизнес-логика живёт в features/usecases, не здесь!
```

### 5.2 Powerful selectors (2 часа)
**Файл:** `src/state/meal/selectors.ts`

```typescript
export const selectMealsByDate = (date: string) =>
  createSelector(
    [selectAllMeals],
    (meals) => meals.filter(m => getLocalDateKey(m.eatenAt) === date)
  );

export const selectTodayMealsByType = createSelector(
  [selectMealsByDate(today)],
  (meals) => groupEntriesByMealType(meals) // Используем domain-функцию!
);

export const selectTodayNutrients = createSelector(
  [selectMealsByDate(today)],
  (meals) => calculateMealTotalNutrients(meals) // Domain-функция!
);
```

### 5.3 Async middleware (2 дня)
**Файл:** `src/state/meal/async.ts`

```typescript
export const addMealAsync = createAsyncThunk(
  'meal/add',
  async (
    payload: { product: Product; quantity: number },
    { rejectWithValue, dispatch }
  ) => {
    try {
      // 1. Валидировать (domain)
      if (!isValidQuantity(payload.quantity)) {
        return rejectWithValue('Invalid quantity');
      }

      // 2. Использовать repository (data)
      const repository = getRepository('meal');
      const entry = await repository.createMeal({
        ...payload,
        id: generateId(),
        eatenAt: new Date(),
        mealType: 'lunch',
        origin: 'manual',
      });

      // 3. Вернуть результат
      return entry;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

---

## ФАЗА 6: FEATURES LAYER (2 дня)

### 6.1 Use Cases (4 часа)
**Файл:** `src/features/meal/usecases/addMeal.ts`

```typescript
export class AddMealUseCase {
  constructor(
    private repository: IMealRepository,
    private validator: IMealValidator,
    private rules: MealRules,
    private eventBus: EventBus
  ) {}

  async execute(command: AddMealCommand): Promise<Result<MealEntry>> {
    // 1. Валидировать
    const validation = this.validator.validate(command);
    if (!validation.isValid) {
      return Result.fail(validation.errors);
    }

    // 2. Проверить бизнес-правила
    if (!this.rules.canAddMeal(command.profile, command.totalCalories)) {
      return Result.fail('Daily calorie limit exceeded');
    }

    // 3. Выполнить (с трансакцией)
    const entry = await this.repository.createMeal(
      this.mapCommandToEntity(command)
    );

    // 4. Публиковать событие
    this.eventBus.publish(new MealAddedEvent(entry));

    return Result.ok(entry);
  }
}
```

### 6.2 Custom Hooks (4 часа)
**Файл:** `src/features/meal/hooks/useMealOperations.ts`

```typescript
export function useMealOperations() {
  const dispatch = useDispatch();
  const addMealUseCase = useInjection(AddMealUseCase);

  const addMeal = useCallback(
    async (product: Product, quantity: number) => {
      dispatch(setLoading(true));
      try {
        const result = await addMealUseCase.execute({ product, quantity });
        
        if (result.isOk) {
          dispatch(addMealSuccess(result.value));
          // Синхронизировать с remote
          dispatch(syncMeals());
        } else {
          dispatch(addMealError(result.errors[0]));
        }
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, addMealUseCase]
  );

  return { addMeal };
}
```

### 6.3 Чистые компоненты (4 часа)
**Файл:** `src/features/meal/components/ProductCard.tsx` (UPDATE)

```typescript
interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onAdd: (quantity: number) => void;
  onToggleFavorite: () => void;
  isLoading?: boolean;
}

export function ProductCard({
  product,
  isFavorite,
  onAdd,
  onToggleFavorite,
  isLoading,
}: ProductCardProps) {
  // Компонент только отображает, не думает!
  const [quantity, setQuantity] = useState('100');

  const handleAdd = () => {
    const qty = Number(quantity);
    if (qty > 0) onAdd(qty);
  };

  return (
    <Card>
      {/* UI только */}
      <CardContent>
        <Typography>{product.name}</Typography>
        <TextField value={quantity} onChange={e => setQuantity(e.target.value)} />
        <Button onClick={handleAdd} disabled={isLoading}>
          Add
        </Button>
        <Button onClick={onToggleFavorite}>
          {isFavorite ? '⭐' : '☆'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## ФАЗА 7: ПЕРЕПОДКЛЮЧИТЬ В REDUX (1 день)

### 7.1 Dependency Injection (4 часа)
**Файл:** `src/app/di/container.ts`

```typescript
export class DIContainer {
  private services = new Map<string, any>();

  register(name: string, factory: () => any) {
    this.services.set(name, factory);
  }

  get<T>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) throw new Error(`Service not found: ${name}`);
    return factory();
  }
}

export const createContainer = (): DIContainer => {
  const container = new DIContainer();

  // Register repositories
  container.register('meal.repository', () => new SyncedMealRepository(...));
  container.register('product.repository', () => new ProductRepository(...));

  // Register usecases
  container.register('addMeal.usecase', () => new AddMealUseCase(...));
  container.register('repeatMeal.usecase', () => new RepeatMealUseCase(...));

  // Register integrations
  container.register('openFoodFacts', () => new OpenFoodFactsClient(...));

  return container;
};
```

### 7.2 Redux Wrapper (4 часа)
**Файл:** `src/state/meal/async-thunks.ts`

```typescript
// Redux async thunks используют DI-контейнер
export const addMealThunk = createAsyncThunk(
  'meal/addThunk',
  async (payload: AddMealPayload, { rejectWithValue }) => {
    const container = getGlobalContainer();
    const usecase = container.get(AddMealUseCase);
    
    const result = await usecase.execute(payload);
    
    if (result.isOk) {
      return result.value;
    } else {
      return rejectWithValue(result.errors);
    }
  }
);
```

---

## ФАЗА 8: ТЕСТЫ (1 день)

### 8.1 Domain unit tests (4 часа)
**Файл:** `src/domain/meal/calculations.test.ts`

```typescript
describe('calculateMealTotalNutrients', () => {
  it('should sum nutrients correctly', () => {
    const meals = [
      { quantity: 100, product: { nutrients: { calories: 100 } } },
      { quantity: 100, product: { nutrients: { calories: 50 } } },
    ];

    const result = calculateMealTotalNutrients(meals);

    expect(result.calories).toBe(150);
  });
});
```

### 8.2 Data repository tests (2 часа)
**Файл:** `src/data/meal/repository.test.ts`

```typescript
describe('MealRepository', () => {
  it('should merge local and remote data', async () => {
    const local = [meal1, meal2];
    const remote = [meal3];
    
    const repo = new SyncedMealRepository(
      mockLocalRepo(local),
      mockRemoteRepo(remote),
      mockSync()
    );

    const result = await repo.getMeals('2026-04-13');

    expect(result).toHaveLength(3);
  });
});
```

### 8.3 Feature hook tests (4 часа)
**Файл:** `src/features/meal/hooks/useMealOperations.test.ts`

```typescript
describe('useMealOperations', () => {
  it('should dispatch addMealSuccess on successful add', async () => {
    const { result } = renderHook(() => useMealOperations(), {
      wrapper: ReduxProvider,
    });

    await act(async () => {
      await result.current.addMeal(product, 100);
    });

    const state = store.getState();
    expect(state.meal.items).toHaveLength(1);
  });
});
```

---

## ФАЗА 9: MIGRATE ONE MODULE (2 дня)

### 9.1 Полностью мигрировать meal module
- ✅ Domain types
- ✅ Domain calculations
- ✅ Domain validators
- ✅ Domain rules
- ✅ Data repository
- ✅ Integration (OpenFoodFacts)
- ✅ State Redux (тонкий)
- ✅ Features (usecases + hooks)
- ✅ Tests (domain + data + features)

### 9.2 Протестировать end-to-end
- Добавление еды работает?
- Поиск работает?
- Синхронизация работает?
- Все тесты зелёные?

---

## 📋 ЧЕКЛИСТ ДЛЯ ПРОВЕРКИ

После каждой фазы:
- [ ] Все файлы созданы
- [ ] TypeScript не выдаёт ошибок
- [ ] Tests проходят
- [ ] Git commit с логичным сообщением
- [ ] Нет циклических зависимостей

---

## 🎯 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

После полного рефакторинга:
1. ✅ Код организован по слоям
2. ✅ Бизнес-логика отделена от UI
3. ✅ Легко писать unit-тесты
4. ✅ Легко добавлять новые фичи
5. ✅ Можно переиспользовать логику
6. ✅ Production-готовая архитектура

---

## 🚀 НАЧАЛО

**Рекомендуемый порядок для quick wins:**
1. Создать структуру папок (фаза 1)
2. Мигрировать meal module полностью (фазы 2-9)
3. Потом profile module (копировать паттерн)
4. Потом products module (копировать паттерн)

После meal module остальные modules мигрируются в 1-2 дня каждый (просто копирование паттерна).

**Total time for full refactor: 9-10 дней**  
**Time for first working module: 3-4 дня**
