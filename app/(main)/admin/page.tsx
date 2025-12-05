import Title from "@/components/common/Title";
import FileTableSection from "@/components/Admin/FileTableSection";
import NewFileUploadSection from "@/components/Admin/NewFileUploadSection";

const page = () => {
  return (
    <div>
      <Title text="管理者画面" />
      <FileTableSection />
      <hr className="mt-5" />
      <NewFileUploadSection />
    </div>
  );
};

export default page;
