"use client";

import { useEffect, useState, useActionState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getKnowledgeBases, uploadDocuments } from "@/app/(main)/admin/actions";
import { KnowledgeBaseOption, UploadState } from "@/types/type";

const initialState: UploadState = {
  success: false,
  message: "",
};

type Props = {
  onUploadSuccess?: () => void;
  initialKbId: string;
  onKbIdChange: (id: string) => void;
};

const FileUploadCard = ({
  onUploadSuccess,
  initialKbId,
  onKbIdChange,
}: Props) => {
  const [state, formAction, isPending] = useActionState(
    uploadDocuments,
    initialState
  );
  const [selectedTableId, setSelectedTableId] = useState<string>(initialKbId);
  const [categories, setCategories] = useState<KnowledgeBaseOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getKnowledgeBases();
        setCategories(data);
        if (data.length > 0) {
          if (initialKbId) {
            setSelectedTableId(initialKbId);
          } // 初回ロード時
          else {
            const firstId = data[0].id;
            setSelectedTableId(firstId);
            onKbIdChange(firstId);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (state.success && onUploadSuccess) {
      onUploadSuccess();
    }
  }, [state.success, onUploadSuccess]);

  const handleSelectChange = (value: string) => {
    setSelectedTableId(value);
    onKbIdChange(value);
  };

  if (loading) return <div>Loading categories...</div>;
  if (categories.length === 0) return <div>ナレッジベースが見つかりません</div>;
  return (
    <div className="border border-dashed rounded-xl border-[#3DA8FF] p-5 w-lg text-center bg-[#EFF8FF]">
      <p>削除したいナレッジを選択</p>
      <div className="mb-6">
        <Select value={selectedTableId} onValueChange={handleSelectChange}>
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
      <form
        action={formAction}
        className="flex flex-col gap-4 border p-6 rounded-lg shadow-sm w-full max-w-md"
      >
        <input type="hidden" name="datasetId" value={selectedTableId} />
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            ドキュメントを選択
          </label>
          <input
            type="file"
            name="file"
            required
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={!selectedTableId || isPending}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          アップロード開始
        </button>
      </form>
      {state.message && (
        <div
          className={`p-4 rounded ${
            state.success
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {state.message}
        </div>
      )}
    </div>
  );
};

export default FileUploadCard;
