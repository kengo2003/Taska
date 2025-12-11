"use client";

import { useEffect, useState } from "react";
import { FileListSection } from "./FileListSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getKnowledgeBases } from "@/app/(main)/admin/actions";
import { KnowledgeBaseOption } from "@/types/type";

const FileTableSection = () => {
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [categories, setCategories] = useState<KnowledgeBaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getKnowledgeBases();
        setCategories(data);
        if (data.length > 0) {
          setSelectedTableId(data[0].id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);
  if (loading) return <div>Loading categories...</div>;
  if (categories.length === 0) return <div>ナレッジベースが見つかりません</div>;

  return (
    <div>
      <p className="py-5 font-bold text-lg">アップロード済みのファイル一覧</p>

      <div className="mb-6 w-64">
        <Select value={selectedTableId} onValueChange={setSelectedTableId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedTableId && (
        <FileListSection kbId={selectedTableId} key={selectedTableId} />
      )}
    </div>
  );
};

export default FileTableSection;
