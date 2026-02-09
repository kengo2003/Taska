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

// ★修正: メッセージの添付ファイル型を定義
export type MessageAttachment = {
  name: string;
  url: string;
  type: "image" | "file";
};

// ★修正: route.tsで使用されている LocalAttachment をエイリアスとして定義
export type LocalAttachment = MessageAttachment;

export type Message = {
  role: "user" | "assistant" | "system"; // systemを追加
  content: string;
  date?: string; // ★追加: メッセージごとの送信日時 (例: "2025/02/06 12:30")
  attachments?: MessageAttachment[];
};

export type ChatSession = {
  id: string;
  title: string;
  date: string; // セッションの最終更新日時
  email?: string; // ★追加: 利用者のメールアドレス
  messages: Message[];
  difyConversationId?: string; // 互換性のためオプショナル推奨
  type?: "qa" | "resume";
};

export interface MenuButtonProps {
  text: string;
  link: string;
  className: string;
}

export interface DifyFile {
  type: "image" | "document" | "video" | "audio";
  transfer_method: "local_file" | "remote_url";
  upload_file_id?: string;
  url?: string;
}

export interface UploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

export interface ChatPayload {
  inputs: Record<string, unknown>;
  query: string;
  response_mode: "blocking" | "streaming";
  user: string;
  conversation_id?: string;
  files?: DifyFile[];
}