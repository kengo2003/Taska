"use client";

import { useEffect, useState, useActionState, useRef } from "react";
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
    initialState,
  );
  const [selectedTableId, setSelectedTableId] = useState<string>(initialKbId);
  const [categories, setCategories] = useState<KnowledgeBaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 初期化が完了したかを追跡するRef
  const initializedRef = useRef(false);

  // Effect 1: カテゴリデータの取得 (マウント時に一度だけ実行)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getKnowledgeBases();
        setCategories(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Effect 2: 初期選択の反映 (データ取得後、一度だけ実行)
  useEffect(() => {
    // まだデータがない、または既に初期化済みの場合は何もしない
    if (categories.length === 0 || initializedRef.current) return;

    if (initialKbId) {
      setSelectedTableId(initialKbId);
    } else {
      // 初期IDがない場合は先頭の要素を選択し、親に通知
      const firstId = categories[0].id;
      setSelectedTableId(firstId);
      onKbIdChange(firstId);
    }
    
    // 初期化済みフラグを立てる
    initializedRef.current = true;
  }, [categories, initialKbId, onKbIdChange]);

  useEffect(() => {
    if (state.success && onUploadSuccess) {
      onUploadSuccess();
    }
  }, [state.success, onUploadSuccess]);

  const handleSelectChange = (value: string) => {
    setSelectedTableId(value);
    onKbIdChange(value);
  };

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading categories...</div>;
  if (categories.length === 0) return <div className="p-4 text-sm text-red-500">ナレッジベースが見つかりません</div>;

  return (
    <div className="border border-dashed rounded-xl border-[#3DA8FF] p-4 md:p-5 w-full max-w-lg text-center bg-[#EFF8FF]">
      <p className="mb-2 text-sm md:text-base">追加したいナレッジを選択</p>
      <div className="mb-6">
        <Select value={selectedTableId} onValueChange={handleSelectChange}>
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
      <form
        action={formAction}
        className="flex flex-col gap-4 border p-4 md:p-6 rounded-lg shadow-sm w-full bg-white"
      >
        <input type="hidden" name="datasetId" value={selectedTableId} />
        <div className="text-left">
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
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50 w-full md:w-auto md:self-center"
        >
          {isPending ? "アップロード中..." : "アップロード開始"}
        </button>
      </form>
      {state.message && (
        <div
          className={`mt-4 p-4 rounded text-sm ${
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