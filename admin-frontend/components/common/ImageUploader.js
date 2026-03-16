import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import api from "@/utils/apiSetup";
import {
  selectError,
  selectUploading,
  setError,
  setPasser,
  setUploading,
} from "@/store/features/userSlice";

const ImageUploader = ({
  imgUrl,
  content,
  name,
  bucket_name,
  file_name,
}) => {
  const file = useRef(null);
  const [previewURL, setPreviewURL] = useState(imgUrl);
  const uploading = useSelector(selectUploading);
  const dispatch = useDispatch();

  const handleUpload = (e) => {
    e.preventDefault();
    file.current = e.target.files[0];
    setPreviewURL(URL.createObjectURL(file.current));
  };

  useEffect(() => {
    if (imgUrl) {
      setPreviewURL(imgUrl);
    }
  }, [imgUrl]);

  useEffect(() => {
    if (uploading) {
      handleSaveChanges();
    }
  }, [uploading]);

  const handleSaveChanges = async () => {
    if (!file.current) {
      dispatch(setUploading(false));
      dispatch(setError("No file selected"));
      return;
    }

    try {
      // Step 1: Get a presigned URL from the backend
      const response = await api.post("/images/generate-presigned-url", {
        fileName: `${file_name}-${file.current.name}`,
        fileType: file.current.type,
        folder: bucket_name || "uploads",
      });

      const { uploadUrl, fileUrl } = response.data;

      // Step 2: Upload the file directly to S3 using the presigned URL
      await fetch(uploadUrl, {
        method: "PUT",
        body: file.current,
        headers: {
          "Content-Type": file.current.type,
        },
      });

      console.log("File uploaded successfully:", fileUrl);
      dispatch(setPasser([name, fileUrl]));
      dispatch(setUploading(false));
      dispatch(setError(null));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      dispatch(setUploading(false));
      console.error("Upload error:", error);
      const errorMessage = error?.message || "Error occurred during upload";
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-20 flex flex-col justify-around h-[400px] w-full items-center border-dashed border-[#0C74D4] border-4 bg-slate-200">
      <div className="w-full h-full my-8" onClick={() => file.current.click()}>
        <p className="font-medium">{content}</p>
        <input
          type="file"
          name="upload_img"
          onChange={handleUpload}
          accept="image/*"
          ref={file}
          hidden
        />
      </div>
      {previewURL && (
        <div>
          <Image
            src={previewURL}
            width={200}
            height={200}
            className="rounded-md"
            alt="Preview"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
