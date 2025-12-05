import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";

const FileUploadCard = () => {
  return (
    <div className="border border-dashed rounded-xl border-[#3DA8FF] p-5 w-lg text-center bg-[#EFF8FF]">
      <Image
        src={"/Icon.svg"}
        alt="file-upload"
        height={100}
        width={100}
        className="mx-auto"
      />
      <p className="py-5 text-base font-bold">ファイルをアップロード</p>
      <Button className="p-5 text-[#3DA8FF] bg-white border-[#3DA8FF] border hover:bg-[#3DA8FF]/20 hover:text-[#3DA8FF]">
        <Link href={"/"}>ファイルを選択</Link>
      </Button>
    </div>
  );
};

export default FileUploadCard;
