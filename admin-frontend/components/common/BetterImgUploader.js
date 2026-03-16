import { useCallback, useRef, useState } from "react";
import ProgresssBar from "@ramonak/react-progress-bar";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { videoURLs, cloudFrontURL } from "@/utils/videoAPIutil";

const BetterUploaderImg = ({
  videoURL,
  setVideoURL,
  setError,
  placeholder,
}) => {
  const [fileup, setFileup] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewURL, setPreviewURL] = useState(videoURL);
  const urlRef = useRef(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const fileToUpload = acceptedFiles[0];
    const folder = "videoThumnail"; // Replace with your folder name

    try {
      // Step 1: Get a presigned URL from the backend
      const response = await axios.post("/images/generate-presigned-url", {
        fileName: fileToUpload.name,
        fileType: fileToUpload.type,
        folder: folder,
      });

      const { uploadUrl, fileUrl } = response.data;

      // Step 2: Upload file to S3
      await axios.put(uploadUrl, fileToUpload, {
        headers: {
          "Content-Type": fileToUpload.type,
        },
        onUploadProgress: (p) => {
          const percentCompleted = Math.round((p.loaded * 100) / p.total);
          setFileup({ fileName: fileToUpload.name, percentCompleted });
        },
      });

      urlRef.current = fileUrl;
      setVideoURL(fileUrl);
      setSuccess(true);
      console.log("File URL:", fileUrl);
    } catch (error) {
      if (setError) {
        setError(error);
      }
      console.error("Upload failed:", error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="w-full">
      <div className="">
        <h2 className="text-step-1">Upload Image </h2>
      </div>
      <div className="flex flex-col items-center">
        <div
          className="bg-gray-200 border-dashed border-black border-2 w-72 h-[300px] flex flex-col items-center justify-center my-8"
          {...getRootProps()}
        >
          {previewURL && (
            <img
              src={previewURL}
              width={200}
              height={200}
              className="rounded-md"
            />
          )}
          <p>{placeholder || `Upload image: Click to explore / Drag&Drop`}</p>
          <input {...getInputProps()} />
        </div>

        <div className="flex items-center justify-center w-full">
          {fileup && (
            <div className="w-1/2">
              <p>{`File : ${fileup?.fileName}`}</p>
              <ProgresssBar
                bgColor="#0766ea"
                completed={fileup.percentCompleted}
              />

              {!success && (
                <>
                  <div role="status" className="mt-4">
                    <svg
                      aria-hidden="true"
                      className="mr-2 w-8 h-8 text-gray-200 animate-spin  fill-blue-600"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                    <span className="sr-only">Loading...</span>
                  </div>
                  <p>Dont Close the tab or exit the screen</p>
                </>
              )}
              {success && (
                <p className="text-green-500">Successfully uploaded</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BetterUploaderImg;
