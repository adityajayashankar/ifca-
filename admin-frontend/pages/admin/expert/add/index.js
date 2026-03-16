import React, { useState } from "react";
import CreateExpertForm from "@/components/expert/CreateExpertForm";
import CreateExpertBulk from "@/components/expert/CreateExpertBulk";
import { useRouter } from "next/router";
import { toast } from 'react-toastify';
import axios from "axios";

const CreateExpert = () => {
  const [bulk, setBulk] = useState(2); // Default to individual create
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDownloadTemplate = () => {
    try {
      // Create a sample Excel template with headers
      const templateData = [
        {
          email: "expert1@example.com",
          name: "John Doe",
          phone: "9876543210",
          address: "123 Expert Street, Tech City, TC 12345",
          pincode: "12345",
          photoURL: "https://s3.amazonaws.com/your-bucket/expert1.jpg",
          desc: "Experienced software engineer with 10+ years in web development"
        },
        {
          email: "expert2@example.com",
          name: "Jane Smith",
          phone: "9876543211",
          address: "456 Expert Avenue, Tech City, TC 12346",
          pincode: "12346",
          photoURL: "https://s3.amazonaws.com/your-bucket/expert2.jpg",
          desc: "Senior data scientist specializing in machine learning"
        }
      ];

      // Convert to CSV format
      const headers = Object.keys(templateData[0]);
      const csvContent = [
        headers.join(','),
        ...templateData.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expert_bulk_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleSuccess = (message, data) => {
    // Check if bulk upload was successful and show appropriate message
    if (data && data.summary) {
      const { created, skipped, failed, total } = data.summary;
      if (created > 0) {
        toast.success(`Successfully created ${created} experts! ${skipped > 0 ? `${skipped} skipped.` : ''} ${failed > 0 ? `${failed} failed.` : ''}`);
      } else if (skipped > 0 && failed === 0) {
        toast.warning(`All ${skipped} experts already exist. No new experts created.`);
      } else if (failed > 0) {
        toast.error(`Failed to create experts. ${failed} errors occurred.`);
      }
    } else {
      toast.success(message || 'Expert created successfully!');
    }
    
    // Redirect to expert list after successful creation
    setTimeout(() => {
      router.push('/admin/expert');
    }, 3000);
  };

  const handleError = (error) => {
    console.error('Expert creation error:', error);
    const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong';
    toast.error(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/expert')}
                className="text-gray-500 hover:text-orange-600 transition-colors p-2 rounded-lg hover:bg-orange-50"
                title="Back to Expert List"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Create Expert</h1>
                <p className="text-sm text-gray-500">Add new experts to the platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownloadTemplate}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Template</span>
          </button>
              
              <button
                onClick={() => router.push('/admin/expert')}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>View All Experts</span>
          </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Method</h2>
              <p className="text-gray-600 mb-6">Select how you want to add experts to the platform</p>

              {/* Method Selection */}
              <div className="space-y-3">
                <button
                  onClick={() => setBulk(1)}
                  disabled={isLoading}
                  className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                    bulk === 1 
                      ? 'border-orange-500 bg-orange-50 text-orange-700' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-25'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className={`p-2 rounded-lg ${
                    bulk === 1 ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Bulk Upload</h3>
                    <p className="text-sm opacity-75">Upload multiple experts via Excel/CSV</p>
                  </div>
                </button>

                <button
                  onClick={() => setBulk(2)}
                  disabled={isLoading}
                  className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                    bulk === 2 
                      ? 'border-orange-500 bg-orange-50 text-orange-700' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-25'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className={`p-2 rounded-lg ${
                    bulk === 2 ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Individual Create</h3>
                    <p className="text-sm opacity-75">Add one expert at a time</p>
                  </div>
                </button>
              </div>

              {/* Instructions */}
              {bulk === 1 && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Bulk Upload Instructions:</span>
                  </h4>
                  <ul className="text-orange-800 space-y-1 text-sm">
                    <li>• Supports Excel (.xlsx, .xls) and CSV files</li>
                    <li>• Required: email, name, phone, address, pincode</li>
                    <li>• Optional: photoURL, desc</li>
                    <li>• Phone numbers must be 10+ digits</li>
                    <li>• Pincodes must be 5+ digits</li>
                    <li>• PhotoURL must be valid S3 links</li>
                    <li>• Passwords are auto-generated and sent via email</li>
                  </ul>
                </div>
              )}

              {bulk === 2 && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Individual Create Benefits:</span>
                  </h4>
                  <ul className="text-orange-800 space-y-1 text-sm">
                    <li>• Add detailed expert information</li>
                    <li>• Upload profile photo (1:1 aspect ratio)</li>
                    <li>• Real-time validation</li>
                    <li>• Immediate feedback</li>
                    <li>• Perfect for single expert additions</li>
                    <li>• Auto-generated secure passwords</li>
                  </ul>
                </div>
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-900">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Processing...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {bulk === 0 && (
                <div className="p-8 text-center">
                  <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Method</h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Select either bulk upload for multiple experts or individual creation for detailed single expert addition.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setBulk(1)}
                      className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Start Bulk Upload</span>
                    </button>
                    <button
                      onClick={() => setBulk(2)}
                      className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create Individual</span>
                    </button>
                  </div>
        </div>
      )}

              {bulk === 1 && (
                <div className="p-6">
                  <CreateExpertBulk 
                    baseURL={"admin"} 
                    maxCount={50}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    setIsLoading={setIsLoading}
                  />
                </div>
              )}

              {bulk === 2 && (
                <div className="p-6">
                  <CreateExpertForm 
                    baseURL={"admin"}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    setIsLoading={setIsLoading}
                  />
                </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateExpert;
