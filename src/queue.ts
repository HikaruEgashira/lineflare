import type { TextMessage } from "@line/bot-sdk";
import type {
  Bindings,
  QueueMessage,
  ChatGPTRequestMessage,
  ChatGPTResponse,
} from "./type";

export async function queue(
  batch: MessageBatch<Error>,
  env: Bindings
): Promise<void> {
  let messages = JSON.stringify(batch.messages);
  const queueMessages = JSON.parse(messages) as QueueMessage[];
  for await (const message of queueMessages) {
    const { userId, content, replyToken } = message.body;
    // DBに登録する
    await env.DB.prepare(
      `insert into messages(user_id, role, content) values (?, "user", ?)`
    )
      .bind(userId, content)
      .run();
    // DBを参照する
    const { results } = await env.DB.prepare(
      `select role, content from messages where user_id = ?1 order by id`
    )
      .bind(userId)
      .all<ChatGPTRequestMessage>();
    const chatGPTcontents = results ?? [];
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: chatGPTcontents,
        }),
      });
      const body = await res.json<ChatGPTResponse>();
      // DBに登録する
      await env.DB.prepare(
        `insert into messages(user_id, role, content) values (?, "assistant", ?)`
      )
        .bind(userId, body.choices[0].message.content)
        .run();
      const accessToken: string = env.CHANNEL_ACCESS_TOKEN;
      const response: TextMessage = {
        type: "text",
        text: body.choices[0].message.content,
      };
      await fetch("https://api.line.me/v2/bot/message/reply", {
        body: JSON.stringify({
          replyToken: replyToken,
          messages: [response],
        }),
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
      }
    }
  }
}
