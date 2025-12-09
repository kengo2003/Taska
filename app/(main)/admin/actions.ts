"use server";

import { FileData, DocumentListItem, kb } from "@/types/type";
import { error } from "console";

const BASE_URL = process.env.BACKEND_API_URL;
const API_TOKEN = process.env.API_TOKEN;

const getHeaders = () => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (API_TOKEN) {
    headers["Authorization"] = `Bearer ${API_TOKEN}`;
  }
  return headers;
};

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * ナレッジベース一覧取得
 */
export async function getKnowledgeBases() {
  if (!BASE_URL) throw new Error("BACKEND_API_URL is not defined");

  try {
    const res = await fetch(`${BASE_URL}/v1/datasets`, {
      cache: "no-store",
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("API Error Body:", errorText);
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const data = Array.isArray(json) ? json : json.data || [];

    return data.map((kb: kb) => ({
      id: String(kb.id),
      label: kb.name,
    }));
  } catch (error) {
    console.error("Critical Error in getKnowledgeBases:", error);
    return [];
  }
}

/**
 * 特定のナレッジベースIDに紐づくドキュメント一覧を取得・整形する
 */
export async function getDocumentsByKbId(kbId: string): Promise<FileData[]> {
  if (!BASE_URL) throw new Error("BACKEND_API_URL is not defined");

  try {
    // ドキュメント一覧を取得
    const listRes = await fetch(
      `${BASE_URL}/v1/datasets/${kbId}/documents?limit=100`,
      {
        cache: "no-store",
        headers: getHeaders(),
      }
    );

    if (!listRes.ok) throw new Error("ドキュメント一覧の取得に失敗しました");

    const listJson = await listRes.json();
    const documentsList: DocumentListItem[] = listJson.data || [];

    return documentsList.map((doc) => {
      const uploadDate = doc.created_at
        ? new Date(doc.created_at * 1000).toLocaleDateString("ja-JP")
        : "不明";

      const rawTokens = doc.tokens ?? doc.word_count ?? 0;
      const tokenCount = `${rawTokens.toLocaleString()} tokens`;

      const bytes = doc.data_source_detail_dict?.upload_file?.size || 0;
      const fileSize = bytes > 0 ? formatBytes(bytes) : "-";

      return {
        id: doc.id,
        fileName: doc.name,
        uploadDate: uploadDate,
        tokenCount: tokenCount,
        fileSize: fileSize,
        url: "",
      };
    });
  } catch (error) {
    console.error("getDocumentsByKbId error:", error);
    return [];
  }
}

export async function deleteDocuments(kbId: string, fileId: string) {
  if (!BASE_URL) throw new Error("BACKEND_API_URL is not defined");

  try {
    const res = await fetch(
      `${BASE_URL}/v1/datasets/${kbId}/documents/${fileId}`,
      {
        method: "DELETE",
        cache: "no-store",
        headers: getHeaders(),
      }
    );
    if (!res.ok) {
      const errorText = await res.text();
      console.error("deleteDocuments API error:", errorText);
      throw new Error(`${res.status}:${res.statusText}`);
    }
  } catch (error) {
    console.error("deleteDocuments error:", error);
    return [];
  }
}
