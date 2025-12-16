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
    <div>
      <p className="py-5 font-bold text-lg">新規ファイルをアップロード</p>
      <FileUploadCard
        onUploadSuccess={onUploadSuccess}
        initialKbId={currentKbId}
        onKbIdChange={onKbIdChange}
      />
    </div>
  );
};

export default NewFileUploadSection;
