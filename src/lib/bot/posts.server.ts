import { getPost, randomPosts, togglePostLike, type BotPost } from "./db.server";
import { answerCallback, editMarkup, sendMessage, sendPhoto } from "./telegram.server";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function postKeyboard(post: BotPost, liked = false) {
  const first: { text: string; url?: string; callback_data?: string }[] = [];
  if (post.link) first.push({ text: "📖 Read full post", url: post.link });
  first.push({
    text: `${liked ? "❤️" : "🤍"} Like ${post.likes > 0 ? post.likes : ""}`.trim(),
    callback_data: `po:like:${post.id}`,
  });

  return {
    inline_keyboard: [
      first,
      [
        { text: "➡️ Next post", callback_data: "po:next" },
        { text: "🗂 More posts", callback_data: "po:more" },
      ],
    ],
  };
}

function postText(post: BotPost): string {
  const body = esc(post.body).replace(/\n{3,}/g, "\n\n");
  return body.length > 900 ? `${body.slice(0, 900)}…` : body;
}

export async function sendPost(chatId: number, post: BotPost): Promise<void> {
  const text = postText(post);
  const markup = postKeyboard(post);
  if (post.image_url) {
    const ok = await sendPhoto(chatId, post.image_url, text, markup);
    if (ok) return;
  }
  await sendMessage(chatId, text, markup);
}

export async function sendRandomPost(chatId: number): Promise<void> {
  const [post] = await randomPosts(1);
  if (!post) {
    await sendMessage(chatId, "📭 No posts published yet. Check back soon!");
    return;
  }
  await sendPost(chatId, post);
}

export async function sendMorePosts(chatId: number): Promise<void> {
  const posts = await randomPosts(3);
  if (posts.length === 0) {
    await sendMessage(chatId, "📭 No posts published yet. Check back soon!");
    return;
  }
  for (const post of posts) await sendPost(chatId, post);
}

/** Handles every `po:*` callback. */
export async function handlePostCallback(
  callbackId: string,
  chatId: number,
  messageId: number,
  userId: number | undefined,
  data: string,
): Promise<void> {
  const [, action = "", id = ""] = data.split(":");

  if (action === "like") {
    if (!userId) {
      await answerCallback(callbackId, "Could not identify you.");
      return;
    }
    const { liked, likes } = await togglePostLike(id, userId);
    await answerCallback(callbackId, liked ? "Liked ❤️" : "Like removed");
    const post = await getPost(id);
    if (post) await editMarkup(chatId, messageId, postKeyboard({ ...post, likes }, liked));
    return;
  }

  if (action === "next") {
    await answerCallback(callbackId, "Loading…");
    await sendRandomPost(chatId);
    return;
  }

  if (action === "more") {
    await answerCallback(callbackId, "Loading 3 posts…");
    await sendMorePosts(chatId);
    return;
  }

  await answerCallback(callbackId);
}
