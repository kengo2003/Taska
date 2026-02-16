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

export interface UploadState {
  success: boolean;
  message: string;
  data?: JSON;
}

export interface MessageAttachment {
  name: string;
  url: string;
  type: "image" | "file";
}

export type LocalAttachment = MessageAttachment;

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  date?: string;
  attachments?: MessageAttachment[];
  sources?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  email?: string;
  messages: Message[];
  difyConversationId?: string;
  type?: "qa" | "resume";
  sources?: string[];
}

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
