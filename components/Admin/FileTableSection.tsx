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

const FileTableSection = ({ refreshTrigger }: { refreshTrigger: number }) => {
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

  if (loading)
    return (
      <div className="p-4 text-sm text-gray-500">Loading categories...</div>
    );
  if (categories.length === 0)
    return (
      <div className="p-4 text-sm text-red-500">
        ナレッジベースが見つかりません
      </div>
    );

  return (
    <div className="w-full">
      <p className="py-4 md:py-5 font-bold text-base md:text-lg px-1">
        アップロード済みのファイル一覧
      </p>

      <div className="mb-4 md:mb-6 w-full md:w-64 px-1 md:px-0">
        <Select value={selectedTableId} onValueChange={setSelectedTableId}>
          <SelectTrigger className="bg-white">
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
        <div className="w-full overflow-x-hidden">
          <FileListSection
            kbId={selectedTableId}
            key={`${selectedTableId}-${refreshTrigger}`}
          />
        </div>
      )}
    </div>
  );
};

export default FileTableSection;
