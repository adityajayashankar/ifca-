"use client"
import { useState, useRef } from "react"
import axios from "axios"
import api from "@/utils/apiSetup"
import { toast } from "react-toastify"
import { Upload } from "@mui/icons-material"
import { useSelector } from "react-redux"
import { selectUser } from "@/store/features/userSlice"

const UploadImage = ({ folder, imgUrl, urlRef }) => {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(imgUrl || null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const user = useSelector(selectUser)

  const handleFileChange = async (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      await uploadImage(selectedFile)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    handleFileChange(droppedFile)
  }

  const uploadImage = async (file) => {
    if (!file) {
      toast.error("Please select a file!")
      return
    }

    setUploading(true)

    try {
      // Step 1: Get a presigned URL from the backend
      const response = await api.post("/images/generate-presigned-url", {
        fileName: file.name,
        fileType: file.type,
        folder: folder,
      })

      const { uploadUrl, fileUrl } = response.data

      // Step 2: Upload file to S3
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
      })

      urlRef.current = fileUrl
  

      toast.success("Image uploaded successfully!")
      console.log("File URL:", fileUrl)
    } catch (error) {
      toast.error("Upload failed. Please try again.")
      console.error("Upload failed:", error)
    }

    setUploading(false)
  }

  return (
    <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg shadow-md max-w-md mx-auto mt-10">
      <div
        className={`w-full h-64 flex flex-col items-center justify-center cursor-pointer ${
          dragOver ? "bg-blue-100" : "bg-gray-100"
        } rounded-lg transition-colors duration-300`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-contain rounded-lg" />
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">Drag and drop your image here, or click to select a file</p>
          </>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
        className="hidden"
        accept="image/*"
      />
    </div>
  )
}

export default UploadImage
