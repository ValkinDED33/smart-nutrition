export type CommunityFriendStatus = "online" | "offline";
export type CommunityPostType = "recipe" | "advice" | "experience" | "discussion";
export type CommunityContentStatus = "pending" | "approved" | "rejected";

export interface CommunityFriend {
  id: string;
  name: string;
  handle: string;
  status: CommunityFriendStatus;
  lastActiveAt: string;
}

export interface CommunityMessage {
  id: string;
  friendId: string;
  author: "self" | "friend";
  text: string;
  createdAt: string;
}

export interface CommunityRoomMessage {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface CommunityPostComment {
  id: string;
  postId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  type: CommunityPostType;
  title: string;
  body: string;
  ingredients: string[];
  authorId?: string;
  authorName: string;
  status: CommunityContentStatus;
  moderationReason?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  likes: number;
}

export interface CommunityProgressCard {
  id: string;
  authorName: string;
  metricLabel: string;
  metricValue: string;
  caption: string;
  createdAt: string;
  likes: number;
}
