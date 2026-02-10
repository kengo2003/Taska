import FileUploadCard from "./FileUploadCard";

type Props = {
  onUploadSuccess: () => void;
  currentKbId: string;
  onKbIdChange: (id: string) => void;
};

const NewFileUploadSection = ({
  onUploadSuccess,
  currentKbId,
  onKbIdChange,
}: Props) => {
  return (
    <div className="w-full">
      <p className="py-4 md:py-5 font-bold text-base md:text-lg px-1">
        新規ファイルをアップロード
      </p>
      <FileUploadCard
        onUploadSuccess={onUploadSuccess}
        initialKbId={currentKbId}
        onKbIdChange={onKbIdChange}
      />
    </div>
  );
};

export default NewFileUploadSection;
