import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CommunityFriend,
  CommunityContentReport,
  CommunityContentStatus,
  CommunityMessage,
  CommunityPost,
  CommunityPostComment,
  CommunityPostType,
  CommunityProgressCard,
  CommunityRoomMessage,
} from "../../shared/types/community";

interface CommunityState {
  friends: CommunityFriend[];
  messages: CommunityMessage[];
  roomMessages: CommunityRoomMessage[];
  posts: CommunityPost[];
  comments: CommunityPostComment[];
  reports: CommunityContentReport[];
  progressCards: CommunityProgressCard[];
  favoritePostIds: string[];
  score: number;
}

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const normalizeText = (value: unknown, fallback = "", maxLength = 280) =>
  String(value ?? fallback)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

const normalizeIngredients = (ingredients: unknown) =>
  Array.isArray(ingredients)
    ? ingredients
        .map((item) => normalizeText(item))
        .filter(Boolean)
        .slice(0, 12)
    : [];

const normalizePostType = (type: unknown): CommunityPostType => {
  if (type === "recipe" || type === "advice" || type === "experience" || type === "discussion") {
    return type;
  }

  return type === "article" ? "advice" : "experience";
};

const normalizeStatus = (status: unknown): CommunityContentStatus =>
  status === "pending" || status === "approved" || status === "rejected"
    ? status
    : "approved";

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
  const title = normalizeText(item.title, "", 120);
  const body = normalizeText(item.body, "", 1200);

  if (!title || !body) {
    return null;
  }

  return {
    id: normalizeText(item.id, createId("community-post"), 96),
    type: normalizePostType(item.type),
    title,
    body,
    ingredients: normalizeIngredients(item.ingredients),
    authorId: normalizeText(item.authorId, "", 96) || undefined,
    authorName: normalizeText(item.authorName, "Smart Nutrition", 80),
    status: normalizeStatus(item.status),
    moderationReason: normalizeText(item.moderationReason, "", 240) || null,
    reviewedAt: normalizeText(item.reviewedAt, "", 40) || null,
    reviewedBy: normalizeText(item.reviewedBy, "", 80) || null,
    publishedAt: normalizeText(item.publishedAt, "", 40) || null,
    createdAt: normalizeText(item.createdAt, new Date().toISOString(), 40),
    likes: Number.isFinite(Number(item.likes)) ? Math.max(Number(item.likes), 0) : 0,
  };
};

const normalizeFriend = (value: unknown): CommunityFriend | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<CommunityFriend>;
  const name = normalizeText(item.name, "", 80);

  if (!name) {
    return null;
  }

  return {
    id: normalizeText(item.id, createId("community-friend"), 96),
    name,
    handle: normalizeText(item.handle, `@${name.toLowerCase().replace(/\s+/g, "")}`, 80),
    status: item.status === "online" ? "online" : "offline",
    lastActiveAt: normalizeText(item.lastActiveAt, new Date().toISOString(), 40),
  };
};

const normalizeMessage = (value: unknown): CommunityMessage | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<CommunityMessage>;
  const text = normalizeText(item.text, "", 600);
  const friendId = normalizeText(item.friendId, "", 96);

  if (!text || !friendId) {
    return null;
  }

  return {
    id: normalizeText(item.id, createId("community-message"), 96),
    friendId,
    author: item.author === "friend" ? "friend" : "self",
    text,
    createdAt: normalizeText(item.createdAt, new Date().toISOString(), 40),
  };
};

const normalizeRoomMessage = (value: unknown): CommunityRoomMessage | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<CommunityRoomMessage>;
  const text = normalizeText(item.text, "", 600);

  if (!text) {
    return null;
  }

  return {
    id: normalizeText(item.id, createId("community-room-message"), 96),
    authorName: normalizeText(item.authorName, "Smart User", 80),
    text,
    createdAt: normalizeText(item.createdAt, new Date().toISOString(), 40),
  };
};

const normalizeComment = (value: unknown): CommunityPostComment | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<CommunityPostComment>;
  const postId = normalizeText(item.postId, "", 96);
  const text = normalizeText(item.text, "", 600);

  if (!postId || !text) {
    return null;
  }

  return {
    id: normalizeText(item.id, createId("community-comment"), 96),
    postId,
    authorName: normalizeText(item.authorName, "Smart User", 80),
    text,
    createdAt: normalizeText(item.createdAt, new Date().toISOString(), 40),
  };
};

const normalizeReport = (value: unknown): CommunityContentReport | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<CommunityContentReport>;
  const targetType =
    item.targetType === "comment" || item.targetType === "progress" ? item.targetType : "post";
  const targetId = normalizeText(item.targetId, "", 96);
  const reason = normalizeText(item.reason, "", 600);

  if (!targetId || !reason) {
    return null;
  }

  return {
    id: normalizeText(item.id, createId("community-report"), 96),
    targetType,
    targetId,
    reason,
    reporterId: normalizeText(item.reporterId, "", 96) || undefined,
    reporterName: normalizeText(item.reporterName, "Smart User", 80),
    status:
      item.status === "reviewed" || item.status === "dismissed" ? item.status : "open",
    createdAt: normalizeText(item.createdAt, new Date().toISOString(), 40),
    reviewedAt: normalizeText(item.reviewedAt, "", 40) || null,
    reviewedBy: normalizeText(item.reviewedBy, "", 80) || null,
  };
};

const normalizeProgressCard = (value: unknown): CommunityProgressCard | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<CommunityProgressCard>;
  const metricLabel = normalizeText(item.metricLabel, "", 80);
  const metricValue = normalizeText(item.metricValue, "", 80);
  const caption = normalizeText(item.caption, "", 600);

  if (!metricLabel || !metricValue || !caption) {
    return null;
  }

  return {
    id: normalizeText(item.id, createId("community-progress"), 96),
    authorName: normalizeText(item.authorName, "Smart User", 80),
    metricLabel,
    metricValue,
    caption,
    createdAt: normalizeText(item.createdAt, new Date().toISOString(), 40),
    likes: Number.isFinite(Number(item.likes)) ? Math.max(Number(item.likes), 0) : 0,
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
  roomMessages: [
    {
      id: "room-message-1",
      authorName: "Marta",
      text: "Сегодня делаю лёгкий ужин и держу воду по 250 мл чекпоинтами.",
      createdAt: "2026-04-25T17:20:00.000Z",
    },
    {
      id: "room-message-2",
      authorName: "Coach Denis",
      text: "Если вес стоит, сначала смотрим среднюю неделю, воду и точность логирования.",
      createdAt: "2026-04-25T17:28:00.000Z",
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
      status: "approved",
      moderationReason: null,
      reviewedAt: "2026-04-25T08:12:00.000Z",
      reviewedBy: "Coach Denis",
      publishedAt: "2026-04-25T08:12:00.000Z",
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
      status: "approved",
      moderationReason: null,
      reviewedAt: "2026-04-24T11:48:00.000Z",
      reviewedBy: "Coach Denis",
      publishedAt: "2026-04-24T11:48:00.000Z",
      createdAt: "2026-04-24T11:45:00.000Z",
      likes: 9,
    },
    {
      id: "post-3",
      type: "advice",
      title: "Plateau week checklist",
      body: "Before cutting calories again, verify logging accuracy, water, sleep, and average steps.",
      ingredients: [],
      authorName: "Coach Denis",
      status: "approved",
      moderationReason: null,
      reviewedAt: "2026-04-23T09:03:00.000Z",
      reviewedBy: "Admin",
      publishedAt: "2026-04-23T09:03:00.000Z",
      createdAt: "2026-04-23T09:00:00.000Z",
      likes: 18,
    },
  ],
  comments: [
    {
      id: "comment-1",
      postId: "post-1",
      authorName: "Oleh",
      text: "Добавил ягоды вместо банана, тоже отлично зашло.",
      createdAt: "2026-04-25T09:05:00.000Z",
    },
  ],
  reports: [],
  progressCards: [
    {
      id: "progress-1",
      authorName: "Anna",
      metricLabel: "Weight",
      metricValue: "-2.4 kg",
      caption: "Три недели без жёстких запретов, просто стабильный белок и вода.",
      createdAt: "2026-04-25T12:00:00.000Z",
      likes: 16,
    },
    {
      id: "progress-2",
      authorName: "Marta",
      metricLabel: "Water streak",
      metricValue: "7 days",
      caption: "250 мл стаканы наконец сделали привычку понятной.",
      createdAt: "2026-04-24T18:40:00.000Z",
      likes: 11,
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
      if (post.status === "rejected") {
        return false;
      }

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

const spamSignals = [
  "http://",
  "https://",
  "buy now",
  "casino",
  "crypto",
  "free money",
  "telegram",
  "whatsapp",
];

const analyzePostDraft = (
  posts: CommunityPost[],
  draft: { title: string; body: string; ingredients?: string[] }
) => {
  const title = normalizeText(draft.title, "", 120);
  const body = normalizeText(draft.body, "", 1200);
  const fullText = normalizeToken(`${title} ${body}`);
  const duplicate = findDuplicateCommunityPost(posts, draft);

  if (spamSignals.some((signal) => fullText.includes(signal))) {
    return {
      status: "rejected" as const,
      reason: "Spam-like content was detected.",
      duplicate,
    };
  }

  if (body.length < 24 || title.split(/\s+/).filter(Boolean).length < 2) {
    return {
      status: "rejected" as const,
      reason: "Post needs a clearer title and meaningful content.",
      duplicate,
    };
  }

  if (duplicate) {
    return {
      status: "pending" as const,
      reason: `Possible duplicate of "${duplicate.title}".`,
      duplicate,
    };
  }

  return {
    status: "pending" as const,
    reason: null,
    duplicate: null,
  };
};

export const normalizeCommunityState = (value: unknown): CommunityState => {
  if (!value || typeof value !== "object") {
    return initialState;
  }

  const state = value as Partial<CommunityState>;

  return {
    friends: Array.isArray(state.friends)
      ? (state.friends.map(normalizeFriend).filter(Boolean) as CommunityFriend[])
          .slice(0, 100)
      : initialState.friends,
    messages: Array.isArray(state.messages)
      ? (state.messages.map(normalizeMessage).filter(Boolean) as CommunityMessage[])
          .slice(0, 500)
      : initialState.messages,
    roomMessages: Array.isArray(state.roomMessages)
      ? (state.roomMessages.map(normalizeRoomMessage).filter(Boolean) as CommunityRoomMessage[])
          .slice(0, 300)
      : initialState.roomMessages,
    posts: Array.isArray(state.posts)
      ? (state.posts.map(normalizePost).filter(Boolean) as CommunityPost[])
          .slice(0, 200)
      : initialState.posts,
    comments: Array.isArray(state.comments)
      ? (state.comments.map(normalizeComment).filter(Boolean) as CommunityPostComment[])
          .slice(0, 1000)
      : initialState.comments,
    reports: Array.isArray(state.reports)
      ? (state.reports.map(normalizeReport).filter(Boolean) as CommunityContentReport[])
          .slice(0, 500)
      : initialState.reports,
    progressCards: Array.isArray(state.progressCards)
      ? (state.progressCards.map(normalizeProgressCard).filter(Boolean) as CommunityProgressCard[])
          .slice(0, 200)
      : initialState.progressCards,
    favoritePostIds: Array.isArray(state.favoritePostIds)
      ? state.favoritePostIds
          .map((item) => normalizeText(item, "", 96))
          .filter(Boolean)
          .slice(0, 500)
      : initialState.favoritePostIds,
    score: Number.isFinite(Number(state.score))
      ? Math.min(Math.max(Number(state.score), 0), 1000000)
      : initialState.score,
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
      const name = normalizeText(action.payload.name, "", 80);

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
      const friendId = normalizeText(action.payload.friendId, "", 96);
      const text = normalizeText(action.payload.text, "", 600);

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
    sendCommunityMessage(
      state,
      action: PayloadAction<{ text: string; authorName: string }>
    ) {
      const text = normalizeText(action.payload.text, "", 600);

      if (!text) {
        return;
      }

      state.roomMessages.push({
        id: createId("community-room-message"),
        authorName: normalizeText(action.payload.authorName, "You", 80),
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
        authorId?: string;
        authorName: string;
        ingredients?: string[];
      }>
    ) {
      const title = normalizeText(action.payload.title, "", 120);
      const body = normalizeText(action.payload.body, "", 1200);

      if (!title || !body) {
        return;
      }

      const ingredients = normalizeIngredients(action.payload.ingredients);
      const moderation = analyzePostDraft(state.posts, {
        title,
        body,
        ingredients,
      });

      state.posts.unshift({
        id: createId("community-post"),
        type: normalizePostType(action.payload.type),
        title,
        body,
        ingredients,
        authorId: normalizeText(action.payload.authorId, "", 96) || undefined,
        authorName: normalizeText(action.payload.authorName, "You", 80),
        status: moderation.status,
        moderationReason: moderation.reason,
        reviewedAt: moderation.status === "rejected" ? new Date().toISOString() : null,
        reviewedBy: moderation.status === "rejected" ? "Auto moderation" : null,
        publishedAt: null,
        createdAt: new Date().toISOString(),
        likes: 0,
      });
      state.score += moderation.status === "rejected" ? 2 : 15;
    },
    commentCommunityPost(
      state,
      action: PayloadAction<{ postId: string; text: string; authorName: string }>
    ) {
      const postId = normalizeText(action.payload.postId, "", 96);
      const text = normalizeText(action.payload.text, "", 600);

      if (
        !postId ||
        !text ||
        !state.posts.some((item) => item.id === postId && item.status === "approved")
      ) {
        return;
      }

      state.comments.push({
        id: createId("community-comment"),
        postId,
        authorName: normalizeText(action.payload.authorName, "You", 80),
        text,
        createdAt: new Date().toISOString(),
      });
      state.score += 3;
    },
    reportCommunityContent(
      state,
      action: PayloadAction<{
        targetType: CommunityContentReport["targetType"];
        targetId: string;
        reason: string;
        reporterId?: string;
        reporterName: string;
      }>
    ) {
      const targetId = normalizeText(action.payload.targetId, "", 96);
      const reason = normalizeText(action.payload.reason, "", 600);

      if (!targetId || !reason) {
        return;
      }

      const alreadyReported = state.reports.some(
        (report) =>
          report.status === "open" &&
          report.targetType === action.payload.targetType &&
          report.targetId === targetId &&
          report.reporterId === action.payload.reporterId
      );

      if (alreadyReported) {
        return;
      }

      state.reports.unshift({
        id: createId("community-report"),
        targetType: action.payload.targetType,
        targetId,
        reason,
        reporterId: normalizeText(action.payload.reporterId, "", 96) || undefined,
        reporterName: normalizeText(action.payload.reporterName, "Smart User", 80),
        status: "open",
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
      });
    },
    publishProgressCard(
      state,
      action: PayloadAction<{
        authorName: string;
        metricLabel: string;
        metricValue: string;
        caption: string;
      }>
    ) {
      const metricLabel = normalizeText(action.payload.metricLabel, "", 80);
      const metricValue = normalizeText(action.payload.metricValue, "", 80);
      const caption = normalizeText(action.payload.caption, "", 600);

      if (!metricLabel || !metricValue || !caption) {
        return;
      }

      state.progressCards.unshift({
        id: createId("community-progress"),
        authorName: normalizeText(action.payload.authorName, "You", 80),
        metricLabel,
        metricValue,
        caption,
        createdAt: new Date().toISOString(),
        likes: 0,
      });
      state.score += 20;
    },
    reviewCommunityPost(
      state,
      action: PayloadAction<{
        postId: string;
        decision: "approve" | "reject";
        moderatorName: string;
        reason?: string;
      }>
    ) {
      const post = state.posts.find((item) => item.id === action.payload.postId);

      if (!post) {
        return;
      }

      const now = new Date().toISOString();
      post.status = action.payload.decision === "approve" ? "approved" : "rejected";
      post.reviewedAt = now;
      post.reviewedBy = normalizeText(action.payload.moderatorName, "Moderator", 80);
      post.publishedAt = post.status === "approved" ? now : null;
      post.moderationReason =
        post.status === "rejected"
          ? normalizeText(action.payload.reason, "Rejected by moderator.", 240)
          : null;
    },
    deleteCommunityPostAsSpam(
      state,
      action: PayloadAction<{ postId: string; moderatorName: string }>
    ) {
      const post = state.posts.find((item) => item.id === action.payload.postId);

      if (!post) {
        return;
      }

      post.status = "rejected";
      post.reviewedAt = new Date().toISOString();
      post.reviewedBy = normalizeText(action.payload.moderatorName, "Moderator", 80);
      post.moderationReason = "Deleted as spam.";
      post.publishedAt = null;
      state.favoritePostIds = state.favoritePostIds.filter((id) => id !== post.id);
      state.comments = state.comments.filter((comment) => comment.postId !== post.id);
    },
    deleteCommunityCommentAsModerator(
      state,
      action: PayloadAction<{ commentId: string; moderatorName: string }>
    ) {
      const commentId = normalizeText(action.payload.commentId, "", 96);

      if (!commentId) {
        return;
      }

      state.comments = state.comments.filter((comment) => comment.id !== commentId);
      state.reports.forEach((report) => {
        if (report.targetType === "comment" && report.targetId === commentId) {
          report.status = "reviewed";
          report.reviewedAt = new Date().toISOString();
          report.reviewedBy = normalizeText(action.payload.moderatorName, "Moderator", 80);
        }
      });
    },
    mergeCommunityPosts(
      state,
      action: PayloadAction<{
        sourcePostId: string;
        targetPostId: string;
        moderatorName: string;
      }>
    ) {
      const source = state.posts.find((item) => item.id === action.payload.sourcePostId);
      const target = state.posts.find((item) => item.id === action.payload.targetPostId);

      if (!source || !target || source.id === target.id) {
        return;
      }

      target.likes += source.likes;
      target.ingredients = [
        ...new Set([...target.ingredients, ...source.ingredients]),
      ].slice(0, 12);
      state.comments.forEach((comment) => {
        if (comment.postId === source.id) {
          comment.postId = target.id;
        }
      });
      source.status = "rejected";
      source.reviewedAt = new Date().toISOString();
      source.reviewedBy = normalizeText(action.payload.moderatorName, "Moderator", 80);
      source.moderationReason = `Merged into "${target.title}".`;
      source.publishedAt = null;
      state.favoritePostIds = [
        ...new Set(
          state.favoritePostIds.map((id) => (id === source.id ? target.id : id))
        ),
      ];
    },
    toggleFavoritePost(state, action: PayloadAction<string>) {
      const postId = normalizeText(action.payload, "", 96);

      if (!postId) {
        return;
      }

      if (!state.posts.some((item) => item.id === postId && item.status === "approved")) {
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
      const post = state.posts.find(
        (item) => item.id === action.payload && item.status === "approved"
      );

      if (!post) {
        return;
      }

      post.likes += 1;
      state.score += 1;
    },
    likeProgressCard(state, action: PayloadAction<string>) {
      const card = state.progressCards.find((item) => item.id === action.payload);

      if (!card) {
        return;
      }

      card.likes += 1;
      state.score += 1;
    },
  },
});

export const {
  replaceCommunityState,
  addFriend,
  sendDirectMessage,
  sendCommunityMessage,
  publishCommunityPost,
  commentCommunityPost,
  publishProgressCard,
  reviewCommunityPost,
  deleteCommunityPostAsSpam,
  deleteCommunityCommentAsModerator,
  mergeCommunityPosts,
  toggleFavoritePost,
  likeCommunityPost,
  likeProgressCard,
  reportCommunityContent,
} = communitySlice.actions;

export default communitySlice.reducer;
