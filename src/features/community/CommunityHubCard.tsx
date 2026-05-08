import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import type { CommunityPostType } from "../../shared/types/community";
import { useLanguage } from "../../shared/language";
import {
  addFriend,
  commentCommunityPost,
  deleteCommunityPostAsSpam,
  findDuplicateCommunityPost,
  likeCommunityPost,
  likeProgressCard,
  mergeCommunityPosts,
  publishCommunityPost,
  publishProgressCard,
  reviewCommunityPost,
  sendCommunityMessage,
  sendDirectMessage,
  toggleFavoritePost,
} from "./communitySlice";

const communityCopy = {
  uk: {
    title: "Community Hub",
    subtitle:
      "Друзі, приватні повідомлення, рецепт-форум і особисті бали в одному місці.",
    tabs: {
      friends: "Друзі",
      chat: "Чат",
      forum: "Форум",
      progress: "Прогрес",
    },
    level: "Рівень",
    points: "Очки",
    favorites: "Збережено",
    addFriend: "Додати друга",
    friendName: "Ім'я або нік",
    online: "Онлайн",
    offline: "Офлайн",
    lastActive: "Остання активність",
    noFriends: "Ще немає друзів. Додайте перший контакт.",
    selectFriend: "Оберіть друга, щоб побачити діалог.",
    globalChat: "Загальний чат",
    privateChat: "Приватний чат",
    noRoomMessages: "У загальному чаті поки тихо.",
    typeCommunityMessage: "Повідомлення в загальний чат",
    typeMessage: "Напишіть повідомлення",
    send: "Надіслати",
    postType: "Тип публікації",
    titleField: "Заголовок",
    bodyField: "Текст",
    ingredientsField: "Інгредієнти через кому",
    publish: "Опублікувати",
    queued: "Надіслано на перевірку",
    forumViews: {
      popular: "Популярне",
      new: "Нове",
      recipes: "Рецепти",
      discussion: "Обговорення",
    },
    status: {
      pending: "На перевірці",
      approved: "Опубліковано",
      rejected: "Відхилено",
    },
    moderation: "Модерація форуму",
    approve: "Схвалити",
    reject: "Відхилити",
    deleteSpam: "Видалити спам",
    mergeDuplicate: "Об'єднати дубль",
    comments: "Коментарі",
    addComment: "Коментувати",
    typeComment: "Напишіть коментар",
    shareProgress: "Поділитися прогресом",
    metricLabel: "Метрика",
    metricValue: "Значення",
    progressCaption: "Короткий опис",
    progressFeed: "Картки прогресу",
    noProgressCards: "Карток прогресу поки немає.",
    like: "Like",
    save: "Save",
    unsave: "Unsave",
    duplicate:
      "Схожа публікація вже є. Відправлю на перевірку з позначкою дубля.",
    emptyPosts: "Публікацій поки немає.",
    types: {
      recipe: "Рецепт",
      advice: "Порада",
      experience: "Досвід",
      discussion: "Обговорення",
    },
  },
  pl: {
    title: "Community Hub",
    subtitle:
      "Znajomi, prywatne wiadomości, forum z przepisami i osobiste punkty w jednym miejscu.",
    tabs: {
      friends: "Znajomi",
      chat: "Czat",
      forum: "Forum",
      progress: "Postęp",
    },
    level: "Poziom",
    points: "Punkty",
    favorites: "Zapisane",
    addFriend: "Dodaj znajomego",
    friendName: "Imię lub nick",
    online: "Online",
    offline: "Offline",
    lastActive: "Ostatnia aktywność",
    noFriends: "Nie masz jeszcze znajomych. Dodaj pierwszy kontakt.",
    selectFriend: "Wybierz znajomego, aby zobaczyć rozmowę.",
    globalChat: "Czat ogólny",
    privateChat: "Czat prywatny",
    noRoomMessages: "Na czacie ogólnym jest jeszcze cicho.",
    typeCommunityMessage: "Wiadomość na czat ogólny",
    typeMessage: "Napisz wiadomość",
    send: "Wyślij",
    postType: "Typ publikacji",
    titleField: "Tytuł",
    bodyField: "Treść",
    ingredientsField: "Składniki po przecinku",
    publish: "Opublikuj",
    queued: "Wysłano do moderacji",
    forumViews: {
      popular: "Popularne",
      new: "Nowe",
      recipes: "Przepisy",
      discussion: "Dyskusje",
    },
    status: {
      pending: "W moderacji",
      approved: "Opublikowano",
      rejected: "Odrzucono",
    },
    moderation: "Moderacja forum",
    approve: "Zatwierdź",
    reject: "Odrzuć",
    deleteSpam: "Usuń spam",
    mergeDuplicate: "Scal duplikat",
    comments: "Komentarze",
    addComment: "Skomentuj",
    typeComment: "Napisz komentarz",
    shareProgress: "Udostępnij postęp",
    metricLabel: "Metryka",
    metricValue: "Wartość",
    progressCaption: "Krótki opis",
    progressFeed: "Karty postępu",
    noProgressCards: "Brak kart postępu.",
    like: "Like",
    save: "Save",
    unsave: "Unsave",
    duplicate:
      "Podobna publikacja już istnieje. Wyślę ją do moderacji z oznaczeniem duplikatu.",
    emptyPosts: "Brak publikacji.",
    types: {
      recipe: "Przepis",
      advice: "Porada",
      experience: "Doświadczenie",
      discussion: "Dyskusja",
    },
  },
} as const;

type TabValue = "friends" | "chat" | "forum" | "progress";
type ForumView = "popular" | "new" | "recipes" | "discussion";

const formatDateTime = (value: string, language: "uk" | "pl") =>
  new Date(value).toLocaleString(language === "pl" ? "pl-PL" : "uk-UA", {
    dateStyle: "short",
    timeStyle: "short",
  });

export const CommunityHubCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const community = useSelector((state: RootState) => state.community);
  const { language } = useLanguage();
  const copy = communityCopy[language];
  const [tab, setTab] = useState<TabValue>("friends");
  const [forumView, setForumView] = useState<ForumView>("popular");
  const [friendName, setFriendName] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState(
    community.friends[0]?.id ?? ""
  );
  const [roomMessageDraft, setRoomMessageDraft] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [postType, setPostType] = useState<CommunityPostType>("recipe");
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postIngredients, setPostIngredients] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [progressMetricLabel, setProgressMetricLabel] = useState("");
  const [progressMetricValue, setProgressMetricValue] = useState("");
  const [progressCaption, setProgressCaption] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const level = Math.max(1, Math.floor(community.score / 120) + 1);
  const authorName = user?.name ?? "You";
  const isModerator =
    user?.role === "NUTRITIONIST" ||
    user?.role === "MODERATOR" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";
  const selectedFriend =
    community.friends.find((item) => item.id === selectedFriendId) ?? null;
  const conversation = useMemo(
    () =>
      selectedFriendId
        ? community.messages.filter((item) => item.friendId === selectedFriendId)
        : [],
    [community.messages, selectedFriendId]
  );
  const moderationQueue = useMemo(
    () => community.posts.filter((post) => post.status === "pending"),
    [community.posts]
  );
  const visiblePosts = useMemo(() => {
    const posts = community.posts.filter(
      (post) =>
        post.status === "approved" ||
        post.authorId === user?.id ||
        (isModerator && post.status !== "rejected")
    );
    const filtered = posts.filter((post) => {
      if (forumView === "recipes") {
        return post.type === "recipe";
      }

      if (forumView === "discussion") {
        return post.type === "discussion" || post.type === "experience";
      }

      return true;
    });

    return [...filtered].sort((left, right) => {
      if (forumView === "popular") {
        return right.likes - left.likes;
      }

      return Date.parse(right.createdAt) - Date.parse(left.createdAt);
    });
  }, [community.posts, forumView, isModerator, user?.id]);

  const publishPost = () => {
    const ingredients = postIngredients
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const duplicate = findDuplicateCommunityPost(community.posts, {
      title: postTitle,
      ingredients,
    });

    if (duplicate) {
      setDuplicateWarning(copy.duplicate);
    }

    if (!user || !postTitle.trim() || !postBody.trim()) {
      return;
    }

    dispatch(
      publishCommunityPost({
        type: postType,
        title: postTitle,
        body: postBody,
        authorId: user.id,
        authorName: user.name,
        ingredients,
      })
    );
    setPostTitle("");
    setPostBody("");
    setPostIngredients("");
    setDuplicateWarning(copy.queued);
  };

  const sendRoomMessage = () => {
    if (!roomMessageDraft.trim()) {
      return;
    }

    dispatch(sendCommunityMessage({ text: roomMessageDraft, authorName }));
    setRoomMessageDraft("");
  };

  const publishComment = (postId: string) => {
    const text = commentDrafts[postId] ?? "";

    if (!text.trim()) {
      return;
    }

    dispatch(commentCommunityPost({ postId, text, authorName }));
    setCommentDrafts((drafts) => ({ ...drafts, [postId]: "" }));
  };

  const shareProgressCard = () => {
    if (
      !progressMetricLabel.trim() ||
      !progressMetricValue.trim() ||
      !progressCaption.trim()
    ) {
      return;
    }

    dispatch(
      publishProgressCard({
        authorName,
        metricLabel: progressMetricLabel,
        metricValue: progressMetricValue,
        caption: progressCaption,
      })
    );
    setProgressMetricLabel("");
    setProgressMetricValue("");
    setProgressCaption("");
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={`${copy.level}: ${level}`} color="success" />
          <Chip label={`${copy.points}: ${community.score}`} />
          <Chip label={`${copy.favorites}: ${community.favoritePostIds.length}`} variant="outlined" />
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, value: TabValue) => setTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab value="friends" label={copy.tabs.friends} />
          <Tab value="chat" label={copy.tabs.chat} />
          <Tab value="forum" label={copy.tabs.forum} />
          <Tab value="progress" label={copy.tabs.progress} />
        </Tabs>

        {tab === "friends" && (
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              <TextField
                fullWidth
                label={copy.friendName}
                value={friendName}
                onChange={(event) => setFriendName(event.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => {
                  if (!friendName.trim()) {
                    return;
                  }

                  dispatch(addFriend({ name: friendName }));
                  setFriendName("");
                }}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                {copy.addFriend}
              </Button>
            </Stack>

            {community.friends.length === 0 ? (
              <Alert severity="info">{copy.noFriends}</Alert>
            ) : (
              community.friends.map((friend) => (
                <Paper key={friend.id} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                  >
                    <Stack spacing={0.4}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {friend.name} <Typography component="span">{friend.handle}</Typography>
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {copy.lastActive}: {formatDateTime(friend.lastActiveAt, language)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={friend.status === "online" ? copy.online : copy.offline}
                        color={friend.status === "online" ? "success" : "default"}
                        size="small"
                      />
                      <Button
                        onClick={() => {
                          setSelectedFriendId(friend.id);
                          setTab("chat");
                        }}
                      >
                        Chat
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        )}

        {tab === "chat" && (
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 800 }}>{copy.globalChat}</Typography>
            {community.roomMessages.length === 0 ? (
              <Alert severity="info">{copy.noRoomMessages}</Alert>
            ) : (
              <Stack spacing={1}>
                {community.roomMessages.map((message) => (
                  <Paper key={message.id} variant="outlined" sx={{ p: 1.3, borderRadius: 2 }}>
                    <Stack spacing={0.4}>
                      <Typography sx={{ fontWeight: 700 }}>{message.authorName}</Typography>
                      <Typography>{message.text}</Typography>
                      <Typography color="text.secondary" variant="caption">
                        {formatDateTime(message.createdAt, language)}
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              <TextField
                fullWidth
                label={copy.typeCommunityMessage}
                value={roomMessageDraft}
                onChange={(event) => setRoomMessageDraft(event.target.value)}
              />
              <Button
                variant="contained"
                onClick={sendRoomMessage}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                {copy.send}
              </Button>
            </Stack>

            <Divider />
            <Typography sx={{ fontWeight: 800 }}>{copy.privateChat}</Typography>
            {selectedFriend ? (
              <>
                <Typography sx={{ fontWeight: 700 }}>{selectedFriend.name}</Typography>
                <Stack spacing={1}>
                  {conversation.map((message) => (
                    <Paper
                      key={message.id}
                      variant="outlined"
                      sx={{
                        p: 1.3,
                        borderRadius: 4,
                        alignSelf: message.author === "self" ? "flex-end" : "stretch",
                        backgroundColor:
                          message.author === "self"
                            ? "rgba(236,253,245,0.9)"
                            : "rgba(248,250,252,0.9)",
                      }}
                    >
                      <Typography color="text.primary">{message.text}</Typography>
                    </Paper>
                  ))}
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                  <TextField
                    fullWidth
                    label={copy.typeMessage}
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                  />
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (!selectedFriendId || !messageDraft.trim()) {
                        return;
                      }

                      dispatch(
                        sendDirectMessage({
                          friendId: selectedFriendId,
                          text: messageDraft,
                        })
                      );
                      setMessageDraft("");
                    }}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    {copy.send}
                  </Button>
                </Stack>
              </>
            ) : (
              <Alert severity="info">{copy.selectFriend}</Alert>
            )}
          </Stack>
        )}

        {tab === "forum" && (
          <Stack spacing={1.5}>
            <TextField
              select
              fullWidth
              label={copy.postType}
              value={postType}
              onChange={(event) => setPostType(event.target.value as CommunityPostType)}
            >
              <MenuItem value="recipe">{copy.types.recipe}</MenuItem>
              <MenuItem value="advice">{copy.types.advice}</MenuItem>
              <MenuItem value="experience">{copy.types.experience}</MenuItem>
              <MenuItem value="discussion">{copy.types.discussion}</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label={copy.titleField}
              value={postTitle}
              onChange={(event) => setPostTitle(event.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={copy.bodyField}
              value={postBody}
              onChange={(event) => setPostBody(event.target.value)}
            />
            {postType === "recipe" && (
              <TextField
                fullWidth
                label={copy.ingredientsField}
                value={postIngredients}
                onChange={(event) => setPostIngredients(event.target.value)}
              />
            )}
            {duplicateWarning && <Alert severity="warning">{duplicateWarning}</Alert>}
            <Button
              variant="contained"
              onClick={publishPost}
              sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
            >
              {copy.publish}
            </Button>

            {isModerator && moderationQueue.length > 0 && (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack spacing={1.2}>
                  <Typography sx={{ fontWeight: 800 }}>{copy.moderation}</Typography>
                  {moderationQueue.map((post) => {
                    const duplicateTarget = community.posts.find(
                      (candidate) =>
                        candidate.id !== post.id &&
                        candidate.status === "approved" &&
                        candidate.title.trim().toLowerCase() ===
                          post.title.trim().toLowerCase()
                    );

                    return (
                      <Paper key={post.id} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                        <Stack spacing={0.8}>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip label={copy.types[post.type]} size="small" />
                            <Chip label={copy.status[post.status]} color="warning" size="small" />
                          </Stack>
                          <Typography sx={{ fontWeight: 800 }}>{post.title}</Typography>
                          <Typography color="text.secondary">{post.body}</Typography>
                          {post.moderationReason && (
                            <Alert severity="warning">{post.moderationReason}</Alert>
                          )}
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Button
                              onClick={() =>
                                dispatch(
                                  reviewCommunityPost({
                                    postId: post.id,
                                    decision: "approve",
                                    moderatorName: authorName,
                                  })
                                )
                              }
                            >
                              {copy.approve}
                            </Button>
                            <Button
                              color="error"
                              onClick={() =>
                                dispatch(
                                  reviewCommunityPost({
                                    postId: post.id,
                                    decision: "reject",
                                    moderatorName: authorName,
                                    reason: "Rejected by moderator.",
                                  })
                                )
                              }
                            >
                              {copy.reject}
                            </Button>
                            <Button
                              color="error"
                              onClick={() =>
                                dispatch(
                                  deleteCommunityPostAsSpam({
                                    postId: post.id,
                                    moderatorName: authorName,
                                  })
                                )
                              }
                            >
                              {copy.deleteSpam}
                            </Button>
                            {duplicateTarget && (
                              <Button
                                onClick={() =>
                                  dispatch(
                                    mergeCommunityPosts({
                                      sourcePostId: post.id,
                                      targetPostId: duplicateTarget.id,
                                      moderatorName: authorName,
                                    })
                                  )
                                }
                              >
                                {copy.mergeDuplicate}
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Paper>
            )}

            <Tabs
              value={forumView}
              onChange={(_, value: ForumView) => setForumView(value)}
              variant="scrollable"
              allowScrollButtonsMobile
            >
              <Tab value="popular" label={copy.forumViews.popular} />
              <Tab value="new" label={copy.forumViews.new} />
              <Tab value="recipes" label={copy.forumViews.recipes} />
              <Tab value="discussion" label={copy.forumViews.discussion} />
            </Tabs>

            {visiblePosts.length === 0 ? (
              <Alert severity="info">{copy.emptyPosts}</Alert>
            ) : (
              visiblePosts.map((post) => {
                const saved = community.favoritePostIds.includes(post.id);
                const comments = community.comments.filter(
                  (comment) => comment.postId === post.id
                );
                const canInteract = post.status === "approved";

                return (
                  <Paper key={post.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip label={copy.types[post.type]} size="small" />
                        <Chip
                          label={copy.status[post.status]}
                          color={
                            post.status === "approved"
                              ? "success"
                              : post.status === "rejected"
                                ? "error"
                                : "warning"
                          }
                          size="small"
                        />
                        <Chip label={`${post.likes} likes`} variant="outlined" size="small" />
                        <Chip label={post.authorName} variant="outlined" size="small" />
                      </Stack>
                      <Typography sx={{ fontWeight: 800 }}>{post.title}</Typography>
                      <Typography color="text.secondary">{post.body}</Typography>
                      <Typography color="text.secondary" variant="caption">
                        {formatDateTime(post.createdAt, language)}
                      </Typography>
                      {post.ingredients.length > 0 && (
                        <Typography variant="body2">
                          {post.ingredients.join(", ")}
                        </Typography>
                      )}
                      {post.moderationReason && post.status !== "approved" && (
                        <Alert severity={post.status === "rejected" ? "error" : "warning"}>
                          {post.moderationReason}
                        </Alert>
                      )}
                      {canInteract && (
                        <>
                          <Stack direction="row" spacing={1}>
                            <Button onClick={() => dispatch(likeCommunityPost(post.id))}>
                              {copy.like}
                            </Button>
                            <Button onClick={() => dispatch(toggleFavoritePost(post.id))}>
                              {saved ? copy.unsave : copy.save}
                            </Button>
                          </Stack>
                          <Divider />
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {copy.comments}
                          </Typography>
                          {comments.map((comment) => (
                            <Paper
                              key={comment.id}
                              variant="outlined"
                              sx={{ p: 1.2, borderRadius: 2, backgroundColor: "rgba(248,250,252,0.8)" }}
                            >
                              <Stack spacing={0.3}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  {comment.authorName}
                                </Typography>
                                <Typography variant="body2">{comment.text}</Typography>
                              </Stack>
                            </Paper>
                          ))}
                          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                            <TextField
                              fullWidth
                              size="small"
                              label={copy.typeComment}
                              value={commentDrafts[post.id] ?? ""}
                              onChange={(event) =>
                                setCommentDrafts((drafts) => ({
                                  ...drafts,
                                  [post.id]: event.target.value,
                                }))
                              }
                            />
                            <Button
                              onClick={() => publishComment(post.id)}
                              sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                              {copy.addComment}
                            </Button>
                          </Stack>
                        </>
                      )}
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>
        )}

        {tab === "progress" && (
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 800 }}>{copy.shareProgress}</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              <TextField
                fullWidth
                label={copy.metricLabel}
                value={progressMetricLabel}
                onChange={(event) => setProgressMetricLabel(event.target.value)}
              />
              <TextField
                fullWidth
                label={copy.metricValue}
                value={progressMetricValue}
                onChange={(event) => setProgressMetricValue(event.target.value)}
              />
            </Stack>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label={copy.progressCaption}
              value={progressCaption}
              onChange={(event) => setProgressCaption(event.target.value)}
            />
            <Button
              variant="contained"
              onClick={shareProgressCard}
              sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
            >
              {copy.shareProgress}
            </Button>

            <Divider />
            <Typography sx={{ fontWeight: 800 }}>{copy.progressFeed}</Typography>
            {community.progressCards.length === 0 ? (
              <Alert severity="info">{copy.noProgressCards}</Alert>
            ) : (
              community.progressCards.map((card) => (
                <Paper key={card.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={card.authorName} size="small" />
                      <Chip label={`${card.likes} likes`} variant="outlined" size="small" />
                    </Stack>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                      <Chip color="success" label={card.metricLabel} />
                      <Typography component="p" variant="h6" sx={{ fontWeight: 900 }}>
                        {card.metricValue}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary">{card.caption}</Typography>
                    <Typography color="text.secondary" variant="caption">
                      {formatDateTime(card.createdAt, language)}
                    </Typography>
                    <Button
                      onClick={() => dispatch(likeProgressCard(card.id))}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      {copy.like}
                    </Button>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
