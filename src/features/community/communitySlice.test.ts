import { describe, expect, it } from "vitest";
import reducer, {
  commentCommunityPost,
  likeProgressCard,
  normalizeCommunityState,
  publishProgressCard,
  sendCommunityMessage,
} from "./communitySlice";

describe("communitySlice", () => {
  it("normalizes shared chat, comments, and progress cards", () => {
    const state = normalizeCommunityState({
      friends: [],
      messages: [],
      roomMessages: [{ id: "room-1", authorName: "Anna", text: "Hi" }],
      posts: [{ id: "post-1", title: "Recipe", body: "Good", type: "recipe" }],
      comments: [{ id: "comment-1", postId: "post-1", authorName: "Oleh", text: "Nice" }],
      progressCards: [
        {
          id: "progress-1",
          authorName: "Marta",
          metricLabel: "Weight",
          metricValue: "-1 kg",
          caption: "Steady week",
          likes: 2,
        },
      ],
      favoritePostIds: [],
      score: 4,
    });

    expect(state.roomMessages).toHaveLength(1);
    expect(state.comments).toHaveLength(1);
    expect(state.progressCards[0]?.likes).toBe(2);
  });

  it("caps synced social text, collections, and score", () => {
    const state = normalizeCommunityState({
      friends: Array.from({ length: 150 }, (_, index) => ({
        id: `friend-${index}`,
        name: "A".repeat(200),
      })),
      messages: [],
      roomMessages: [{ text: "M".repeat(900), authorName: "B".repeat(120) }],
      posts: [{ title: "T".repeat(300), body: "Body", type: "recipe" }],
      comments: [],
      progressCards: [],
      favoritePostIds: ["x".repeat(200)],
      score: 999999999,
    });

    expect(state.friends).toHaveLength(100);
    expect(state.friends[0]?.name).toHaveLength(80);
    expect(state.roomMessages[0]?.text).toHaveLength(600);
    expect(state.roomMessages[0]?.authorName).toHaveLength(80);
    expect(state.posts[0]?.title).toHaveLength(120);
    expect(state.favoritePostIds[0]).toHaveLength(96);
    expect(state.score).toBe(1000000);
  });

  it("adds chat messages, post comments, and progress card likes", () => {
    let state = reducer(
      undefined,
      sendCommunityMessage({ authorName: "User", text: "Hello team" })
    );

    expect(state.roomMessages.at(-1)?.text).toBe("Hello team");

    state = reducer(
      state,
      commentCommunityPost({
        postId: "post-1",
        authorName: "User",
        text: "Trying this today",
      })
    );

    expect(state.comments.at(-1)?.text).toBe("Trying this today");

    state = reducer(
      state,
      publishProgressCard({
        authorName: "User",
        metricLabel: "Protein streak",
        metricValue: "5 days",
        caption: "Finally hit the target consistently.",
      })
    );

    const cardId = state.progressCards[0]?.id ?? "";
    state = reducer(state, likeProgressCard(cardId));

    expect(state.progressCards[0]?.likes).toBe(1);
  });
});
