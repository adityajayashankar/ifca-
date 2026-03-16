import React, { useEffect, useRef, useState } from 'react'
import { unparse, parse } from 'papaparse'
import { useRouter } from 'next/router'
import api from '@/utils/apiSetup'
import { toast } from 'react-toastify'

const CreateExpertBulk = ({ baseURL, maxCount = 30, onSuccess, onError, setIsLoading }) => {
  const [uploadStatus, setUploadStatus] = useState({ success: false, error: null })
  const [users, setUsers] = useState([])
  const [createdUsers, setCreatedUsers] = useState([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  const handleClearForm = (e) => {
    e.preventDefault()
    setUploadStatus({ success: false, error: null })
    setUsers([])
    setCreatedUsers([])
  }

  const handleGoBack = (e) => {
    e.preventDefault()
    router.replace(`/${baseURL}/expert`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (users.length === 0) {
      toast.error('Please upload a CSV file first')
      return
    }

    setProcessing(true)
    if (setIsLoading) setIsLoading(true)
    
    try {
      // Create FormData for file upload
      const formData = new FormData()
      
      // Convert users array to CSV and create a file
      const csvContent = unparse(users)
      const csvBlob = new Blob([csvContent], { type: 'text/csv' })
      const csvFile = new File([csvBlob], 'experts.csv', { type: 'text/csv' })
      
      formData.append('file', csvFile)
      
      const res = await api.post(`/expert/bulk-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (res.data) {
        const { created, skipped, failed, total, experts } = res.data.summary || res.data
        
        setCreatedUsers(experts || [])
        
        // Call parent success handler with summary data
        if (onSuccess) {
          onSuccess(`Bulk upload completed`, res.data)
        } else {
          if (created > 0) {
            toast.success(`Successfully created ${created} experts! ${skipped > 0 ? `${skipped} skipped.` : ''} ${failed > 0 ? `${failed} failed.` : ''}`)
          } else if (skipped > 0 && failed === 0) {
            toast.warning(`All ${skipped} experts already exist. No new experts created.`)
          } else if (failed > 0) {
            toast.error(`Failed to create experts. ${failed} errors occurred.`)
          }
        }
      } else {
        if (onError) {
          onError(new Error('Something went wrong while creating experts'))
        } else {
          toast.error('Something went wrong while creating experts')
        }
      }
    } catch (error) {
      if (onError) {
        onError(error)
      } else {
        toast.error(error.response?.data?.message || 'Failed to create experts')
      }
    } finally {
      setProcessing(false)
      if (setIsLoading) setIsLoading(false)
    }
  }

  const downloadResultUsers = (e) => {
    e.preventDefault()
    if (createdUsers.length === 0) {
      toast.error('No results to download')
      return
    }

    const sample_csv = unparse(createdUsers)
    const sample_csv_blob = new Blob([sample_csv], { type: 'text/csv;charset=utf-8;' })
    const element = document.createElement('a')
    element.href = URL.createObjectURL(sample_csv_blob)
    element.download = `expert_credentials_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(element)
        element.click()
    document.body.removeChild(element)
  }

  const downloadTemplate = (e) => {
    e.preventDefault()
    const sample = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "9876543210",
        address: "123 Main Street, City, State",
        pincode: "123456",
        desc: "Expert in web development and UI/UX design"
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "8765432109",
        address: "456 Oak Avenue, Town, State",
        pincode: "654321",
        desc: "Specialist in data science and machine learning"
      }
    ]
    const sample_csv = unparse(sample)
    const sample_csv_blob = new Blob([sample_csv], { type: 'text/csv;charset=utf-8;' })
    const element = document.createElement('a')
    element.href = URL.createObjectURL(sample_csv_blob)
    element.download = `expert_bulk_template.csv`
        document.body.appendChild(element)
        element.click()
    document.body.removeChild(element)
  }

  const validateUserData = (data) => {
    const errors = []
    
    data.forEach((user, index) => {
      if (!user.name || user.name.trim() === '') {
        errors.push(`Row ${index + 1}: Name is required`)
      }
      if (!user.email || user.email.trim() === '') {
        errors.push(`Row ${index + 1}: Email is required`)
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        errors.push(`Row ${index + 1}: Invalid email format`)
      }
      if (!user.phone || user.phone.trim() === '') {
        errors.push(`Row ${index + 1}: Phone is required`)
      } else if (!/^\d{10}$/.test(user.phone.replace(/\D/g, ''))) {
        errors.push(`Row ${index + 1}: Phone must be 10 digits`)
      }
      if (!user.address || user.address.trim() === '') {
        errors.push(`Row ${index + 1}: Address is required`)
      }
      if (!user.pincode || user.pincode.trim() === '') {
        errors.push(`Row ${index + 1}: Pincode is required`)
      } else if (!/^\d{6}$/.test(user.pincode.replace(/\D/g, ''))) {
        errors.push(`Row ${index + 1}: Pincode must be 6 digits`)
      }
      if (!user.desc || user.desc.trim() === '') {
        errors.push(`Row ${index + 1}: Description is required`)
      }
    })

    return errors
  }

  const handleUpload = (e) => {
    e.preventDefault()
    setUploadStatus({ success: false, error: null })
    setUsers([])
    setCreatedUsers([])

    const file = e.target.files[0]
    if (!file) return

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(true)

    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setUploading(false)
        
        const expected_keys = ["name", "email", "phone", "address", "pincode", "desc"]
        const keys = result.meta.fields || []
        
        // Check if all required columns are present
        const missingColumns = expected_keys.filter(key => !keys.includes(key))
        if (missingColumns.length > 0) {
          const errorMsg = `Missing required columns: ${missingColumns.join(', ')}`
          toast.error(errorMsg)
          setUploadStatus({ success: false, error: errorMsg })
          return
        }

        // Check row count limit
        if (result.data.length > maxCount) {
          const errorMsg = `Maximum ${maxCount} experts allowed. Found ${result.data.length}`
          toast.error(errorMsg)
          setUploadStatus({ success: false, error: errorMsg })
          return
        }

        // Validate data
        const validationErrors = validateUserData(result.data)
        if (validationErrors.length > 0) {
          const errorMsg = `Validation errors:\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? '\n... and more' : ''}`
          toast.error(errorMsg)
          setUploadStatus({ success: false, error: errorMsg })
          return
        }

        // Clean and format data
        const cleanedData = result.data.map(user => ({
          name: user.name?.trim(),
          email: user.email?.trim().toLowerCase(),
          phone: user.phone?.replace(/\D/g, ''),
          address: user.address?.trim(),
          pincode: user.pincode?.replace(/\D/g, ''),
          desc: user.desc?.trim()
        }))

        setUsers(cleanedData)
        setUploadStatus({ success: true, error: null })
        toast.success(`Successfully uploaded ${cleanedData.length} experts`)
      },
      error: (error) => {
        setUploading(false)
        toast.error('Error parsing CSV file')
        setUploadStatus({ success: false, error: 'Error parsing CSV file' })
      }
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900">
            Bulk Expert Creation
          </h2>
        </div>
        <p className="text-gray-600 mb-4 text-sm">
          Upload a CSV file to create multiple experts at once. Passwords will be automatically generated and included in the result file.
        </p>
        
        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">
            📋 Instructions:
          </h3>
          <ul className="text-blue-800 space-y-1 text-xs">
            <li>• Maximum <strong>{maxCount} experts</strong> per upload</li>
            <li>• Required columns: <strong>name, email, phone, address, pincode, desc</strong></li>
            <li>• Phone numbers must be 10 digits</li>
            <li>• Pincodes must be 6 digits</li>
            <li>• Download the result file to get generated passwords</li>
          </ul>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm">
            Upload CSV File
          </h3>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Template
                     </button>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
          {!uploadStatus.success ? (
            <label className="cursor-pointer">
              <input
                type="file"
                onChange={handleUpload}
                accept=".csv"
                className="hidden"
                disabled={uploading}
              />
              <div className="flex flex-col items-center">
                {uploading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                ) : (
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
                <p className="text-gray-600 mb-2 text-sm">
                  {uploading ? 'Processing CSV...' : 'Click to upload CSV file'}
                </p>
                <p className="text-gray-500 text-xs">
                  or drag and drop here
                </p>
              </div>
            </label>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-green-600 font-medium text-sm">
                  Successfully uploaded {users.length} experts
                </p>
                <p className="text-gray-500 text-xs">
                  Ready to create experts
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {uploadStatus.error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium text-xs">
                Upload Error
              </p>
            </div>
            <p className="text-red-700 mt-1 whitespace-pre-line text-xs">
              {uploadStatus.error}
            </p>
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to List
                    </button>
                  
                  <button
            onClick={handleClearForm}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>

          {createdUsers.length > 0 && (
            <button
              onClick={downloadResultUsers}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Credentials
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={!uploadStatus.success || processing}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-colors ${
              !uploadStatus.success || processing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Create {users.length} Experts
              </>
            )}
                  </button>
        </div>

        {/* Success Message */}
        {createdUsers.length > 0 && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-medium text-sm">
                Successfully created {createdUsers.length} experts!
              </p>
            </div>
            <p className="text-green-700 mt-1 text-xs">
              Don't forget to download the credentials file to get the generated passwords.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateExpertBulk