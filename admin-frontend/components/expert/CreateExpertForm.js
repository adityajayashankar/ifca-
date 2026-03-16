import { selectExpert } from "@/store/features/expert";
import { selectUser, setLoading } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import UploadImage from "../UploadImage";
import { useForm, Controller } from "react-hook-form";

const CreateExpertForm = ({ isEdit, baseURL, expertId, expertData, onSuccess, onError, setIsLoading, disablePhoneEmail = false, allowNameEdit = false }) => {
  const formRef = useRef();
  const router = useRouter();
  const selectedExpert = useSelector(selectExpert);
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
  
  const user = useSelector(selectUser);

  // All fields are editable - no dynamic locking
  const shouldDisableEmail = () => false;
  const shouldDisablePhone = () => false;
  const shouldDisableName = () => false;

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
    if (isEdit && expertData) {
      const formData = {
        email: expertData.email || "",
        name: expertData.name || "",
        phone: expertData.phone || "",
        address: expertData.address || "",
        pincode: expertData.pincode || "",
        password: "",
        desc: expertData.desc || "",
        photoURL: expertData.photoURL || "",
      };
      reset(formData);
      // Set the urlRef to the existing photo URL for edit mode
      if (expertData.photoURL) {
        urlRef.current = expertData.photoURL;
      }
    } else if (!isEdit) {
      reset(initObj);
      urlRef.current = "";
    }
  }, [isEdit, expertData, reset]);

  const onSubmit = useCallback(async (data) => {
    setProcessing(true);
    if (setIsLoading) setIsLoading(true);
    
    // Check phone number length and show warning if not 10 digits
    if (data.phone && data.phone.length !== 10) {
      const shouldContinue = window.confirm(
        `Phone number "${data.phone}" is not 10 digits long. Do you want to continue with the current phone number?`
      );
      if (!shouldContinue) {
        setProcessing(false);
        if (setIsLoading) setIsLoading(false);
        return;
      }
    }
    
    try {
      if (!isEdit) {
        const response = await api.post(`/auth/signup`, {
          ...data,
            userType: "expert",
          photoURL: urlRef.current || data.photoURL,
        });
        
        if (onSuccess) {
          onSuccess("Expert created successfully!");
        } else {
          toast.success("Expert created successfully!");
            router.push(
              user?.userType === 'partner'
                ? `/partner/expert`
                : `/admin/expert`
          );
        }
        reset(initObj);
      } else {
        const { name, email, phone, address, pincode, desc, photoURL } = data;

        const response = await api.patch(`/expert/${expertId}`, {
          name,
          email,
          phone,
          address,
          pincode,
          desc,
          photoURL: urlRef.current || photoURL,
        });
        
        if (response.data) {
          if (onSuccess) {
            onSuccess("Expert updated successfully!");
          } else {
            toast.success("Expert updated successfully!");
        router.push(
          user?.userType === 'partner'
            ? `/partner/expert`
            : `/admin/expert`
        );
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
  }, [isEdit, expertId, onSuccess, onError, setIsLoading, reset, router, user?.userType]);

  const handleClearForm = useCallback((e) => {
    e?.preventDefault();
    reset(initObj);
    urlRef.current = "";
  }, [reset]);

  const handleDiscardChanges = useCallback((e) => {
    e.preventDefault();
    router.replace(`/${baseURL}/expert`);
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Expert' : 'Create New Expert'}
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          {isEdit 
            ? 'Update expert information and profile details.'
            : 'Add a new expert to the platform with complete profile information.'
          }
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form
        ref={formRef}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Basic Information
            </h3>
            
            <InputField
              label="Expert Name"
              name="name"
              placeholder="Enter expert's full name"
              readOnly={shouldDisableName()}
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
              readOnly={shouldDisableEmail()}
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
              placeholder="Enter phone number"
              readOnly={shouldDisablePhone()}
              validation={{
                required: "Phone number is required",
                validate: (value) => {
                  if (value && value.length > 0 && value.length !== 10) {
                    return "Phone number should be 10 digits for database update";
                  }
                  return true;
                }
              }}
            />
            
            <InputField
              label="Description"
              name="desc"
              type="textarea"
              placeholder="Describe the expert's expertise, experience, and specializations"
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
                folder="expert" 
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
                  {isEdit ? 'Update Expert' : 'Create Expert'}
                </>
              )}
            </button>
          </div>
      </form>
      </div>
    </div>
  );
};

export default CreateExpertForm;
