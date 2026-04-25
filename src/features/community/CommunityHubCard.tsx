import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Chip,
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
  findDuplicateCommunityPost,
  likeCommunityPost,
  publishCommunityPost,
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
    typeMessage: "Напишіть повідомлення",
    send: "Надіслати",
    postType: "Тип публікації",
    titleField: "Заголовок",
    bodyField: "Текст",
    ingredientsField: "Інгредієнти через кому",
    publish: "Опублікувати",
    duplicate:
      "Схожа публікація вже є. Спробуйте оновити заголовок або склад, щоб уникнути дублювання.",
    emptyPosts: "Публікацій поки немає.",
    types: {
      recipe: "Рецепт",
      article: "Стаття",
      experience: "Досвід",
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
    typeMessage: "Napisz wiadomość",
    send: "Wyślij",
    postType: "Typ publikacji",
    titleField: "Tytuł",
    bodyField: "Treść",
    ingredientsField: "Składniki po przecinku",
    publish: "Opublikuj",
    duplicate:
      "Podobna publikacja już istnieje. Zmień tytuł albo skład, aby uniknąć duplikatu.",
    emptyPosts: "Brak publikacji.",
    types: {
      recipe: "Przepis",
      article: "Artykuł",
      experience: "Doświadczenie",
    },
  },
} as const;

type TabValue = "friends" | "chat" | "forum";

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
  const [friendName, setFriendName] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState(
    community.friends[0]?.id ?? ""
  );
  const [messageDraft, setMessageDraft] = useState("");
  const [postType, setPostType] = useState<CommunityPostType>("recipe");
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postIngredients, setPostIngredients] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const level = Math.max(1, Math.floor(community.score / 120) + 1);
  const selectedFriend =
    community.friends.find((item) => item.id === selectedFriendId) ?? null;
  const conversation = useMemo(
    () =>
      selectedFriendId
        ? community.messages.filter((item) => item.friendId === selectedFriendId)
        : [],
    [community.messages, selectedFriendId]
  );

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
      return;
    }

    if (!user || !postTitle.trim() || !postBody.trim()) {
      return;
    }

    dispatch(
      publishCommunityPost({
        type: postType,
        title: postTitle,
        body: postBody,
        authorName: user.name,
        ingredients,
      })
    );
    setPostTitle("");
    setPostBody("");
    setPostIngredients("");
    setDuplicateWarning(null);
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
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
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
              <MenuItem value="article">{copy.types.article}</MenuItem>
              <MenuItem value="experience">{copy.types.experience}</MenuItem>
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

            {community.posts.length === 0 ? (
              <Alert severity="info">{copy.emptyPosts}</Alert>
            ) : (
              community.posts.map((post) => {
                const saved = community.favoritePostIds.includes(post.id);

                return (
                  <Paper key={post.id} variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip label={copy.types[post.type]} size="small" />
                        <Chip label={`${post.likes} likes`} variant="outlined" size="small" />
                      </Stack>
                      <Typography sx={{ fontWeight: 800 }}>{post.title}</Typography>
                      <Typography color="text.secondary">{post.body}</Typography>
                      {post.ingredients.length > 0 && (
                        <Typography variant="body2">
                          {post.ingredients.join(", ")}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1}>
                        <Button onClick={() => dispatch(likeCommunityPost(post.id))}>Like</Button>
                        <Button onClick={() => dispatch(toggleFavoritePost(post.id))}>
                          {saved ? "Unsave" : "Save"}
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
