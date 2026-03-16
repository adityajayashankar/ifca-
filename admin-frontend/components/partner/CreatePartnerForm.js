import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '@/utils/apiSetup';
import { useRouter } from 'next/router';
import UploadImage from '../UploadImage';

const CreatePartnerForm = ({ isEdit, baseURL, partnerId, partnerData, onSuccess, onError, setIsLoading }) => {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const urlRef = useRef("");
  
  const initObj = {
    email: "",
    name: "",
    phone: "",
    address: "",
    pincode: "",
    password: "",
    desc: "",
    photoURL: "",
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: initObj,
    mode: "onBlur"
  });

  // Watch the photoURL field to update the UploadImage component
  const watchedPhotoURL = watch("photoURL");

  // Initialize form state properly
  useEffect(() => {
    if (isEdit && partnerData) {
      const formData = {
        email: partnerData.email || "",
        name: partnerData.name || "",
        phone: partnerData.phone || "",
        address: partnerData.address || "",
        pincode: partnerData.pincode || "",
        password: "",
        desc: partnerData.desc || "",
        photoURL: partnerData.photoURL || "",
      };
      reset(formData);
      // Set the urlRef to the existing photo URL for edit mode
      if (partnerData.photoURL) {
        urlRef.current = partnerData.photoURL;
      }
    } else if (!isEdit) {
      reset(initObj);
      urlRef.current = "";
    }
  }, [isEdit, partnerData, reset]);

  const onSubmit = useCallback(async (data) => {
    setProcessing(true);
    if (setIsLoading) setIsLoading(true);
    
    try {
      if (!isEdit) {
        const response = await api.post(`/partner`, {
          ...data,
          photoURL: urlRef.current || data.photoURL,
        });
        
        if (onSuccess) {
          onSuccess("Partner created successfully!");
        } else {
          toast.success("Partner created successfully!");
          router.push(`/admin/partner`);
        }
        reset(initObj);
      } else {
        const { phone, address, pincode, desc, photoURL } = data;

        const response = await api.patch(`/partner/${partnerId}`, {
          phone,
          address,
          pincode,
          desc,
          photoURL: urlRef.current || photoURL,
        });
        
        if (response.data) {
          if (onSuccess) {
            onSuccess("Partner updated successfully!");
          } else {
            toast.success("Partner updated successfully!");
            router.push(`/admin/partner`);
          }
        }
      } 
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong";
      if (onError) {
        onError(error);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setProcessing(false);
      if (setIsLoading) setIsLoading(false);
    }
  }, [isEdit, partnerId, onSuccess, onError, setIsLoading, reset, router]);

  const handleClearForm = useCallback((e) => {
    e?.preventDefault();
    reset(initObj);
    urlRef.current = "";
  }, [reset]);

  const handleDiscardChanges = useCallback((e) => {
    e.preventDefault();
    router.replace(`/${baseURL}/partner`);
  }, [router, baseURL]);

  const handleUploadSuccess = useCallback((fileUrl) => {
    // Update the form field when upload is successful
    setValue("photoURL", fileUrl);
  }, [setValue]);

  const InputField = React.memo(({ 
    label, 
    name, 
    type = "text", 
    required = true, 
    readOnly = false, 
    maxLength, 
    pattern,
    placeholder,
    rows = 1,
    validation = {}
  }) => {
    return (
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Controller
          name={name}
          control={control}
          rules={validation}
          render={({ field }) => (
            <>
              {type === "textarea" ? (
                <textarea
                  {...field}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                    errors[name] ? 'border-red-500' : 'border-gray-300'
                  } ${readOnly ? 'bg-gray-100' : 'bg-white'}`}
                  readOnly={readOnly}
                  placeholder={placeholder}
                  rows={rows}
                  style={{ fontSize: '14px' }}
                />
              ) : (
                <input
                  {...field}
                  type={type}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                    errors[name] ? 'border-red-500' : 'border-gray-300'
                  } ${readOnly ? 'bg-gray-100' : 'bg-white'}`}
                  required={required}
                  readOnly={readOnly}
                  maxLength={maxLength}
                  pattern={pattern}
                  placeholder={placeholder}
                  style={{ fontSize: '14px' }}
                />
              )}
              {errors[name] && (
                <p className="text-red-500 mt-1 text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors[name].message}
                </p>
              )}
            </>
          )}
        />
      </div>
    );
  });

  InputField.displayName = 'InputField';

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Partner' : 'Create New Partner'}
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          {isEdit 
            ? 'Update partner information and profile details.'
            : 'Add a new partner to the platform with complete profile information.'
          }
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            // Prevent spacebar from scrolling the page when not in an input/textarea
            if (e.key === ' ' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
              e.preventDefault();
            }
          }}
        >
          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Basic Information
            </h3>
            
            <InputField
              label="Partner Name"
              name="name"
              placeholder="Enter partner's full name"
              readOnly={isEdit}
              validation={{
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters"
                }
              }}
            />
            
            <InputField
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter email address"
              readOnly={isEdit}
              validation={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address"
                }
              }}
            />
            
          {!isEdit && (
              <InputField
                label="Password"
                name="password"
                type="password"
                placeholder="Enter password (min 6 characters)"
                validation={{
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                }}
              />
            )}
            
            <InputField
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="Enter 10-digit phone number"
              maxLength={10}
              validation={{
                required: "Phone number is required",
                pattern: {
                  value: /^\d{10}$/,
                  message: "Phone number must be 10 digits"
                }
              }}
            />
            
            <InputField
              label="Description"
              name="desc"
              type="textarea"
              placeholder="Describe the partner's business, services, and specializations"
              rows={4}
              validation={{
                required: "Description is required",
                minLength: {
                  value: 10,
                  message: "Description must be at least 10 characters"
                }
              }}
            />
          </div>

          {/* Profile Photo */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Photo
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <UploadImage 
                folder="partner" 
                imgUrl={watchedPhotoURL || ""} 
                urlRef={urlRef}
                aspectRatio="1:1"
                onUploadSuccess={handleUploadSuccess}
              />
              <p className="text-gray-500 mt-2 text-xs">
                Upload a square profile photo (1:1 aspect ratio recommended)
              </p>
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address Information
            </h3>
            
            <InputField
              label="Address"
              name="address"
              type="textarea"
              placeholder="Enter complete address"
              rows={3}
              validation={{
                required: "Address is required"
              }}
            />
            
            <InputField
              label="Pincode"
              name="pincode"
              placeholder="Enter 6-digit pincode"
              maxLength={6}
              validation={{
                required: "Pincode is required",
                pattern: {
                  value: /^\d{6}$/,
                  message: "Pincode must be 6 digits"
                }
              }}
            />
        </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Cancel
            </button>

            <button
              type="button"
              onClick={handleClearForm}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Form
            </button>

            <button
              type="submit"
              disabled={processing}
              className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                processing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  {isEdit ? 'Update Partner' : 'Create Partner'}
                </>
              )}
            </button>
          </div>
      </form>
      </div>
    </div>
  );
};

export default CreatePartnerForm;
