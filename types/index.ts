// src/types/index.ts
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  attachments?: {
    name: string;
    url: string;
    type: 'image' | 'file';
  }[];
};

export type ChatSession = {
  id: string;
  title: string;
  date: string;
  messages: Message[];
};