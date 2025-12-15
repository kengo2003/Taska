"use client";

import { useState } from "react";
import Title from "@/components/common/Title";
import FileTableSection from "@/components/Admin/FileTableSection";
import NewFileUploadSection from "@/components/Admin/NewFileUploadSection";

const Page = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadKbId, setUploadKbId] = useState<string>("");

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  return (
    <div>
      <Title text="管理者画面" />
      <FileTableSection refreshTrigger={refreshTrigger} />
      <hr className="mt-5" />
      <NewFileUploadSection
        key={refreshTrigger}
        onUploadSuccess={handleUploadSuccess}
        currentKbId={uploadKbId}
        onKbIdChange={setUploadKbId}
      />
    </div>
  );
};

export default Page;
