"use client";

import { useEffect, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
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

const FileUploadCard = () => {
  const [state, formAction] = useActionState(uploadDocuments, initialState);
  const router = useRouter();
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
        if (state.success) {
          router.refresh();
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
    <div className="border border-dashed rounded-xl border-[#3DA8FF] p-5 w-lg text-center bg-[#EFF8FF]">
      <p>削除したいナレッジを選択</p>
      <div className="mb-6">
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
      {/* {selectedTableId && (
          <FileListSection kbId={selectedTableId} key={selectedTableId} />
        )} */}
      {/* <Image
        src={"/Icon.svg"}
        alt="file-upload"
        height={100}
        width={100}
        className="mx-auto"
      /> */}
      {/* <p className="py-5 text-base font-bold">ファイルをアップロード</p> */}
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
