import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CommunityFriend,
  CommunityMessage,
  CommunityPost,
  CommunityPostType,
} from "../../shared/types/community";

interface CommunityState {
  friends: CommunityFriend[];
  messages: CommunityMessage[];
  posts: CommunityPost[];
  favoritePostIds: string[];
  score: number;
}

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const normalizeText = (value: unknown, fallback = "") =>
  String(value ?? fallback)
    .trim()
    .replace(/\s+/g, " ");

const normalizeIngredients = (ingredients: unknown) =>
  Array.isArray(ingredients)
    ? ingredients
        .map((item) => normalizeText(item))
        .filter(Boolean)
        .slice(0, 12)
    : [];

const normalizeToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const normalizePost = (value: unknown): CommunityPost | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<CommunityPost>;
  const title = normalizeText(item.title);
  const body = normalizeText(item.body);

  if (!title || !body) {
    return null;
  }

  return {
    id: normalizeText(item.id, createId("community-post")),
    type:
      item.type === "recipe" || item.type === "article" || item.type === "experience"
        ? item.type
        : "experience",
    title,
    body,
    ingredients: normalizeIngredients(item.ingredients),
    authorName: normalizeText(item.authorName, "Smart Nutrition"),
    createdAt: normalizeText(item.createdAt, new Date().toISOString()),
    likes: Number.isFinite(Number(item.likes)) ? Math.max(Number(item.likes), 0) : 0,
  };
};

const normalizeFriend = (value: unknown): CommunityFriend | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<CommunityFriend>;
  const name = normalizeText(item.name);

  if (!name) {
    return null;
  }

  return {
    id: normalizeText(item.id, createId("community-friend")),
    name,
    handle: normalizeText(item.handle, `@${name.toLowerCase().replace(/\s+/g, "")}`),
    status: item.status === "online" ? "online" : "offline",
    lastActiveAt: normalizeText(item.lastActiveAt, new Date().toISOString()),
  };
};

const normalizeMessage = (value: unknown): CommunityMessage | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<CommunityMessage>;
  const text = normalizeText(item.text);
  const friendId = normalizeText(item.friendId);

  if (!text || !friendId) {
    return null;
  }

  return {
    id: normalizeText(item.id, createId("community-message")),
    friendId,
    author: item.author === "friend" ? "friend" : "self",
    text,
    createdAt: normalizeText(item.createdAt, new Date().toISOString()),
  };
};

const initialState: CommunityState = {
  friends: [
    {
      id: "friend-anna",
      name: "Anna",
      handle: "@anna.fit",
      status: "online",
      lastActiveAt: "2026-04-25T18:30:00.000Z",
    },
    {
      id: "friend-oleh",
      name: "Oleh",
      handle: "@oleh.mealprep",
      status: "offline",
      lastActiveAt: "2026-04-24T21:10:00.000Z",
    },
  ],
  messages: [
    {
      id: "message-1",
      friendId: "friend-anna",
      author: "friend",
      text: "Собрала белковый завтрак на завтра. Хочешь рецепт?",
      createdAt: "2026-04-25T18:31:00.000Z",
    },
    {
      id: "message-2",
      friendId: "friend-anna",
      author: "self",
      text: "Да, пришли, пожалуйста.",
      createdAt: "2026-04-25T18:34:00.000Z",
    },
  ],
  posts: [
    {
      id: "post-1",
      type: "recipe",
      title: "High-protein breakfast jar",
      body: "Greek yogurt, oats, banana, and chia. Simple prep for busy mornings.",
      ingredients: ["Greek yogurt", "oats", "banana", "chia"],
      authorName: "Anna",
      createdAt: "2026-04-25T08:10:00.000Z",
      likes: 14,
    },
    {
      id: "post-2",
      type: "experience",
      title: "How I broke a hydration slump",
      body: "I switched to 250 ml checkpoints and water finally became easier to track.",
      ingredients: [],
      authorName: "Marta",
      createdAt: "2026-04-24T11:45:00.000Z",
      likes: 9,
    },
    {
      id: "post-3",
      type: "article",
      title: "Plateau week checklist",
      body: "Before cutting calories again, verify logging accuracy, water, sleep, and average steps.",
      ingredients: [],
      authorName: "Coach Denis",
      createdAt: "2026-04-23T09:00:00.000Z",
      likes: 18,
    },
  ],
  favoritePostIds: ["post-1"],
  score: 180,
};

export const findDuplicateCommunityPost = (
  posts: CommunityPost[],
  draft: { title: string; ingredients?: string[] }
) => {
  const normalizedTitle = normalizeToken(draft.title);
  const normalizedIngredients = normalizeIngredients(draft.ingredients).map(normalizeToken);

  return (
    posts.find((post) => {
      if (normalizeToken(post.title) === normalizedTitle) {
        return true;
      }

      if (normalizedIngredients.length === 0 || post.ingredients.length === 0) {
        return false;
      }

      const postIngredients = post.ingredients.map(normalizeToken);
      const overlap = normalizedIngredients.filter((item) => postIngredients.includes(item)).length;

      return overlap >= Math.min(2, normalizedIngredients.length);
    }) ?? null
  );
};

export const normalizeCommunityState = (value: unknown): CommunityState => {
  if (!value || typeof value !== "object") {
    return initialState;
  }

  const state = value as Partial<CommunityState>;

  return {
    friends: Array.isArray(state.friends)
      ? (state.friends.map(normalizeFriend).filter(Boolean) as CommunityFriend[])
      : initialState.friends,
    messages: Array.isArray(state.messages)
      ? (state.messages.map(normalizeMessage).filter(Boolean) as CommunityMessage[])
      : initialState.messages,
    posts: Array.isArray(state.posts)
      ? (state.posts.map(normalizePost).filter(Boolean) as CommunityPost[])
      : initialState.posts,
    favoritePostIds: Array.isArray(state.favoritePostIds)
      ? state.favoritePostIds.map((item) => normalizeText(item)).filter(Boolean)
      : initialState.favoritePostIds,
    score: Number.isFinite(Number(state.score)) ? Math.max(Number(state.score), 0) : initialState.score,
  };
};

const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {
    replaceCommunityState(_, action: PayloadAction<unknown>) {
      return normalizeCommunityState(action.payload);
    },
    addFriend(state, action: PayloadAction<{ name: string }>) {
      const name = normalizeText(action.payload.name);

      if (!name) {
        return;
      }

      state.friends.unshift({
        id: createId("community-friend"),
        name,
        handle: `@${name.toLowerCase().replace(/\s+/g, "")}`,
        status: "offline",
        lastActiveAt: new Date().toISOString(),
      });
      state.score += 10;
    },
    sendDirectMessage(
      state,
      action: PayloadAction<{ friendId: string; text: string }>
    ) {
      const friendId = normalizeText(action.payload.friendId);
      const text = normalizeText(action.payload.text);

      if (!friendId || !text) {
        return;
      }

      state.messages.push({
        id: createId("community-message"),
        friendId,
        author: "self",
        text,
        createdAt: new Date().toISOString(),
      });
      state.score += 2;
    },
    publishCommunityPost(
      state,
      action: PayloadAction<{
        type: CommunityPostType;
        title: string;
        body: string;
        authorName: string;
        ingredients?: string[];
      }>
    ) {
      const title = normalizeText(action.payload.title);
      const body = normalizeText(action.payload.body);

      if (!title || !body) {
        return;
      }

      state.posts.unshift({
        id: createId("community-post"),
        type: action.payload.type,
        title,
        body,
        ingredients: normalizeIngredients(action.payload.ingredients),
        authorName: normalizeText(action.payload.authorName, "You"),
        createdAt: new Date().toISOString(),
        likes: 0,
      });
      state.score += 25;
    },
    toggleFavoritePost(state, action: PayloadAction<string>) {
      const postId = normalizeText(action.payload);

      if (!postId) {
        return;
      }

      const index = state.favoritePostIds.indexOf(postId);

      if (index >= 0) {
        state.favoritePostIds.splice(index, 1);
        return;
      }

      state.favoritePostIds.push(postId);
      state.score += 5;
    },
    likeCommunityPost(state, action: PayloadAction<string>) {
      const post = state.posts.find((item) => item.id === action.payload);

      if (!post) {
        return;
      }

      post.likes += 1;
      state.score += 1;
    },
  },
});

export const {
  replaceCommunityState,
  addFriend,
  sendDirectMessage,
  publishCommunityPost,
  toggleFavoritePost,
  likeCommunityPost,
} = communitySlice.actions;

export default communitySlice.reducer;
