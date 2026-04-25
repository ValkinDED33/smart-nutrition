export type CommunityFriendStatus = "online" | "offline";
export type CommunityPostType = "recipe" | "article" | "experience";

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

export interface CommunityPost {
  id: string;
  type: CommunityPostType;
  title: string;
  body: string;
  ingredients: string[];
  authorName: string;
  createdAt: string;
  likes: number;
}
