import React from "react";
import { FileListSection } from "./FileListSection";

const FileTableSection = () => {
  return (
    <div>
      <p className="py-5 font-bold text-lg">アップロード済みのファイル一覧</p>
      <FileListSection />
    </div>
  );
};

export default FileTableSection;
