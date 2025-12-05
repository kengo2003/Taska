"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Edit2, Trash2, Check, X } from "lucide-react";
import Image from "next/image";
import { FileData } from "@/types/type";
import { TEST_FILES } from "@/test/TestFileData";

export function FileListSection() {
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingFileName, setEditingFileName] = useState("");
  const [files, setFiles] = useState<FileData[]>(TEST_FILES);

  const handlePreview = (file: FileData) => {
    setSelectedFile(file);
  };

  const handleEdit = (file: FileData) => {
    setEditingId(file.id);
    setEditingFileName(file.fileName);
  };

  const handleSave = (fileId: number) => {
    setFiles(
      files.map((file) =>
        file.id === fileId ? { ...file, fileName: editingFileName } : file
      )
    );
    setEditingId(null);
    setEditingFileName("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingFileName("");
  };

  const handleDelete = (file: FileData) => {
    alert(`削除: ${file.fileName}`);
  };

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 text-center">No.</TableHead>
              <TableHead>ファイル名</TableHead>
              <TableHead>追加日</TableHead>
              <TableHead>トークン数</TableHead>
              <TableHead>ファイルサイズ</TableHead>
              <TableHead className="w-40 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file, index) => (
              <TableRow
                key={file.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="text-center text-muted-foreground font-medium">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">
                  {editingId === file.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingFileName}
                        onChange={(e) => setEditingFileName(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSave(file.id)}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    file.fileName
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {file.uploadDate}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {file.tokenCount}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {file.fileSize}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(file)}
                      title="プレビュー"
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(file)}
                      title="編集"
                      className="h-8 w-8 p-0"
                      disabled={editingId !== null}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file)}
                      title="削除"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedFile}
        onOpenChange={(open) => !open && setSelectedFile(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.fileName}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-6 bg-muted rounded-lg">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">追加日</p>
                <p className="font-medium">{selectedFile?.uploadDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">トークン数</p>
                <p className="font-medium">{selectedFile?.tokenCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  ファイルサイズ
                </p>
                <p className="font-medium">{selectedFile?.fileSize}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  ファイル内容プレビュー
                </p>
                <div className="w-full h-48 bg-background border border-border rounded flex items-center justify-center">
                  {selectedFile?.url && (
                    <Image
                      src={selectedFile?.url}
                      alt="File preview"
                      className="w-full h-full object-cover rounded"
                      width={200}
                      height={200}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
