import type { WebhookEvent } from "@line/bot-sdk";

export type Bindings = {
  DB: D1Database;
  QUEUE: Queue;
  CHANNEL_ACCESS_TOKEN: string;
  CHANNEL_SECRET: string;
  OPENAI_API_KEY: string;
};

export type Role = "user" | "system" | "assistant";

export type RequestBody = {
  events: WebhookEvent[];
};

export type QueueData = {
  userId: string;
  content: string;
  replyToken: string;
};

export type QueueMessage = {
  body: QueueData;
  timestamp: string;
  id: string;
};

export type ChatGPTRequestMessage = {
  role: Role;
  content: string;
};

export type ChatGPTResponse = {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  usage: {
    prompt_token: number;
    completion_token: number;
    total_tokens: number;
  };
  choices: {
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string;
    index: number;
  }[];
};
