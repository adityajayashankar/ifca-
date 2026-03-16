"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import axios from "axios"
import api from "@/utils/apiSetup"
import { toast } from "react-toastify"
import { Upload, Edit, Crop, Info } from "@mui/icons-material"

const UploadImage = ({ folder, imgUrl, urlRef, type, onUploadSuccess, aspectRatio = "auto", previewAspectRatio }) => {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(imgUrl || null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showCropInfo, setShowCropInfo] = useState(false)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)

  // Update preview when imgUrl changes (for edit mode)
  useEffect(() => {
    if (imgUrl) {
      setPreview(imgUrl)
    } else {
      setPreview(null)
    }
  }, [imgUrl])

  const validateImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const { width, height } = img
        
        // For square images (info images), enforce 1:1 aspect ratio
        if (aspectRatio === "1:1") {
          if (width !== height) {
            reject("Image must be square (1:1 aspect ratio). Please crop your image to a square.")
            return
          }
          
          // Minimum size for square images
          if (width < 400 || height < 400) {
            reject("Image must be at least 400x400 pixels for square images.")
            return
          }
        }
        
        // General file size validation (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          reject("File size must be less than 2MB.")
          return
        }
        
        resolve({ width, height })
      }
      img.onerror = () => reject("Invalid image file.")
      img.src = URL.createObjectURL(file)
    })
  }

  const cropToSquare = (file) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        const { width, height } = img
        const size = Math.min(width, height)
        const offsetX = (width - size) / 2
        const offsetY = (height - size) / 2
        
        canvas.width = size
        canvas.height = size
        
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)
        
        canvas.toBlob((blob) => {
          const croppedFile = new File([blob], file.name, { type: file.type })
          resolve(croppedFile)
        }, file.type, 0.9)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return

    try {
      // Validate image
      await validateImage(selectedFile)
      
      let processedFile = selectedFile
      
      // Auto-crop to square if aspectRatio is 1:1 and image is not square
      if (aspectRatio === "1:1") {
        const img = new Image()
        img.onload = () => {
          if (img.width !== img.height) {
            cropToSquare(selectedFile).then((croppedFile) => {
              setFile(croppedFile)
              setPreview(URL.createObjectURL(croppedFile))
              uploadImage(croppedFile)
            })
            return
          }
        }
        img.src = URL.createObjectURL(selectedFile)
      }
      
      setFile(processedFile)
      setPreview(URL.createObjectURL(processedFile))
      uploadImage(processedFile)
      
    } catch (error) {
      toast.error(error)
      console.error("Image validation failed:", error)
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
    if (droppedFile) {
    handleFileChange(droppedFile)
    }
  }

  const uploadImage = async (fileToUpload) => {
    if (!fileToUpload) {
      toast.error("Please select a file!")
      return
    }

    setUploading(true)

    try {
      // Step 1: Get a presigned URL from the backend
      const response = await api.post("/images/generate-presigned-url", {
        fileName: fileToUpload.name,
        fileType: fileToUpload.type,
        folder: folder,
      })

      const { uploadUrl, fileUrl } = response.data

      // Step 2: Upload file to S3
      await axios.put(uploadUrl, fileToUpload, {
        headers: {
          "Content-Type": fileToUpload.type,
        },
      })

      urlRef.current = fileUrl
      
      if (typeof onUploadSuccess === "function") {
        onUploadSuccess(fileUrl)
      }

      toast.success("File uploaded successfully!")
      console.log("File URL:", fileUrl)
    } catch (error) {
      setPreview(imgUrl || null)
      toast.error("Upload failed. Please try again.")
      console.error("Upload failed:", error)
    }

    setUploading(false)
  }

  const getUploadText = () => {
    if (aspectRatio === "1:1") {
      return "Upload a square image (400x400 pixels, 1:1 aspect ratio)"
    }
    return "Drag and drop your image file here, or click to select a file"
  }

  const getFileAccept = () => {
    if (type === "videos") {
      return "video/*"
    }
    return "image/*"
  }

  return (
    <div className="w-full">
      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
      
      <div
        className={`w-full flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${
          dragOver 
            ? "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300" 
            : preview 
              ? "bg-white border-gray-200" 
              : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 hover:border-orange-400"
        } border-2 border-dashed rounded-xl transition-all duration-300 group ${previewAspectRatio ? `aspect-[${previewAspectRatio}]` : "min-h-[200px]"}`}
        style={previewAspectRatio ? { aspectRatio: previewAspectRatio } : {}}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          if (e.target.closest(".edit-btn") || e.target.closest(".info-btn")) return
          fileInputRef.current?.click()
        }}
      >
        {preview ? (
          <div className={`relative w-full h-full flex items-center justify-center ${previewAspectRatio ? '' : 'min-h-[200px]'}`}> 
            {type === "videos" ? (
              <video
                src={preview}
                controls
                className="w-full h-full object-contain rounded-lg max-h-[300px]"
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={preview || "/placeholder.svg"}
                  alt="Preview"
                  className={`w-full h-full rounded-lg ${aspectRatio === "1:1" ? "object-cover" : "object-cover"}`}
                  style={previewAspectRatio ? { aspectRatio: previewAspectRatio } : {}}
                />
                {/* Overlay with edit button */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                    <button
                      className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 edit-btn"
                      onClick={(e) => {
                        e.preventDefault() 
                        e.stopPropagation()  
                        fileInputRef.current?.click()
                      }}
                    >
                      <Edit className="text-16px" />
                      <span className="text-14px font-medium">Change Image</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Floating action buttons */}
            <button
              className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-200 edit-btn z-10"
              onClick={(e) => {
                e.preventDefault() 
                e.stopPropagation()  
                fileInputRef.current?.click()
              }}
              title="Edit"
            >
              <Edit className="text-gray-600 text-16px" />
            </button>
            {aspectRatio === "1:1" && (
              <button
                className="absolute top-3 left-3 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-200 info-btn z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowCropInfo(!showCropInfo)
                }}
                title="Crop Info"
              >
                <Crop className="text-gray-600 text-16px" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {/* Upload Icon with Animation */}
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8 text-orange-600" />
              </div>
              {/* Animated border */}
              <div className="absolute inset-0 rounded-full border-2 border-orange-300 border-dashed animate-pulse"></div>
            </div>
            
            {/* Upload Text */}
            <div className="space-y-2">
              <h3 className="text-16px font-semibold text-gray-800">
                {aspectRatio === "1:1" ? "Upload Info Image" : "Upload Banner Image"}
              </h3>
              <p className="text-14px text-gray-600 max-w-xs">
                {getUploadText()}
              </p>
              {aspectRatio === "1:1" && (
                <p className="text-12px text-gray-500 mt-2">
                  Minimum size: 400x400 pixels • Max 2MB
                </p>
              )}
            </div>
            
            {/* Upload Button */}
            <button
              type="button"
              className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 font-medium text-14px shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              Choose File
            </button>
          </div>
        )}
        
        {/* Upload Progress Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl backdrop-blur-sm">
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-xl">
              {/* Animated Upload Icon */}
              <div className="relative mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-orange-600 animate-bounce" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-orange-300 border-dashed animate-spin"></div>
              </div>
              
              <div className="text-center">
                <h4 className="text-16px font-semibold text-gray-800 mb-2">Uploading Image...</h4>
                <p className="text-14px text-gray-600">Please wait while we process your file</p>
                
                {/* Progress Bar */}
                <div className="mt-4 w-48 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Crop Info Tooltip */}
      {showCropInfo && aspectRatio === "1:1" && (
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 w-full shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Info className="text-blue-600 text-16px mt-1" />
            </div>
            <div className="flex-1">
              <h4 className="text-14px font-semibold text-blue-800 mb-2">
                Profile Photo Requirements
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-12px text-blue-700">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Square image (1:1 aspect ratio)</span>
                </div>
                <div className="flex items-center gap-2 text-12px text-blue-700">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Minimum 400x400 pixels</span>
                </div>
                <div className="flex items-center gap-2 text-12px text-blue-700">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Maximum 2MB file size</span>
                </div>
                <div className="flex items-center gap-2 text-12px text-blue-700">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>JPG, PNG, GIF formats</span>
                </div>
              </div>
              <p className="text-12px text-blue-600 mt-2 italic">
                Non-square images will be automatically cropped to fit
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
        className="hidden"
        accept={getFileAccept()}
      />
    </div>
  )
}

export default UploadImage
