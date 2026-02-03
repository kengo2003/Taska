// types/type.ts

export interface FileData {
  id: string;
  fileName: string;
  uploadDate: string;
  tokenCount: string;
  fileSize: string;
  url: string;
}

export interface DocumentListItem {
  id: string;
  name: string;
  created_at?: number;
  tokens?: number;
  word_count?: number;
  data_source_detail_dict?: {
    upload_file?: {
      size?: number;
    };
  };
}

export interface kb {
  id: string;
  name: string;
}

export interface KnowledgeBaseOption {
  id: string;
  label: string;
}

export type UploadState = {
  success: boolean;
  message: string;
  data?: JSON;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  attachments?: {
    name: string;
    url: string;
    type: "image" | "file";
  }[];
};

export type ChatSession = {
  id: string;
  title: string;
  date: string;
  messages: Message[];
  difyConversationId: string;
  type?: 'qa' | 'resume';
};