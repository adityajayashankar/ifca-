import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import AWS from "aws-sdk";

const ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "";
const SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "";
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "ap-south-1";

AWS.config.update({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_ACCESS_KEY,
});

const DependentImageUploader = ({
  imgUrl,
  content,
  name,
  setForm,
  bucket_name,
  file_name,
  bucket,
  uploading,
  setUploading,
  setError,
  error,
  urlRef,
}) => {
  const file = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(imgUrl);
  // const baseURL = {
  //   "community-images-0":
  //     "https://subspace-test0.s3.ap-south-1.amazonaws.com/community/",
  //   "session-images-0":
  //     "https://subspace-test0.s3.ap-south-1.amazonaws.com/session/",
  //   "subcommunity-0": "https://subspace-test0.s3.ap-south-1.amazonaws.com/group/",
  // };

  const baseURL = {
    "community-images-0":
      "https://subspacetest-0.s3.ap-south-1.amazonaws.com/community/",
    "session-images-0":
      "https://subspacetest-0.s3.ap-south-1.amazonaws.com/session/",
    "subcommunity-0": "https://subspacetest-0.s3.ap-south-1.amazonaws.com/group/",
  };

  const folder = {
    "community-images-0": "community/",
    "session-images-0": "session/",
    "subcommunity-0": "group/",
  };
  const myBucket = new AWS.S3({
    params: { Bucket: bucket },
    region: REGION,
  });

  const handleUpload = (e) => {
    e.preventDefault();
    setSelectedFile(e.target.files[0]);
    setPreviewURL(URL.createObjectURL(e.target.files[0]));
    setUploading(1); // Set uploading state to indicate upload is in progress
  };

  useEffect(() => {
    if (imgUrl) {
      setPreviewURL(imgUrl);
    }
  }, [imgUrl]);

  useEffect(() => {
    if (uploading === 1) {
      handleSaveChanges();
    }
  }, [uploading]);

  const handleSaveChanges = async () => {
    if (!selectedFile) {
      setUploading(0);
      console.log("No file found");
      return;
    }
    const params = {
      ACL: "public-read",
      Body: selectedFile,
      Bucket: bucket,
      Key: `${folder[bucket_name]}${file_name}-${selectedFile.name}`,
    };
    try {
      const res = await myBucket.upload(params).promise();
      const urlupdate = `${baseURL[bucket_name]}${file_name}-${selectedFile.name}`;
      urlRef.current = urlupdate;
      setUploading(2); // Set uploading state to indicate upload is completed
    } catch (err) {
      setError(err);
      setUploading(-1); // Set uploading state to indicate upload error
    }
  };

  return (
    <div>
      <div className="p-20 flex flex-col justify-around h-[400px] w-full items-center border-dashed border-[#0C74D4] border-4 bg-slate-200">
        <div className="w-full h-full my-8 ">
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
          <div className="">
            <img
              src={previewURL}
              width={200}
              height={200}
              className="rounded-md"
            />
          </div>
        )}
      </div>
      <button type="button" onClick={() => file.current.click()}>
        Add Image
      </button>
    </div>
  );
};

export default DependentImageUploader;
