import { Hono } from "hono";
import { queue } from "./queue";
import type { Bindings, RequestBody } from "./type";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/api/webhook", async (c) => {
  // Extract From Request Body
  const data = await c.req.json<RequestBody>();
  const event = data.events[0];
  if (event.type !== "message" || event.message.type !== "text") {
    return new Response("body error", { status: 400 });
  }
  const { source, replyToken } = event;
  if (source.type !== "user") {
    return new Response("body error", { status: 400 });
  }
  const { userId } = source;
  const { text } = event.message;
  const queueData = {
    userId,
    content: text,
    replyToken,
  };
  await c.env.QUEUE.send(queueData);
  return c.json({ message: "ok" });
});

export default {
  fetch: app.fetch,
  queue,
};
