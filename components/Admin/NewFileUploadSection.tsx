import React from "react";
import FileUploadCard from "./FileUploadCard";

const NewFileUploadSection = () => {
  return (
    <div>
      <p className="py-5 font-bold text-lg">新規ファイルをアップロード</p>
      <FileUploadCard />
    </div>
  );
};

export default NewFileUploadSection;
