"use client"

import { useForm, useFieldArray } from "react-hook-form"
import Image from "next/image"
import { useState } from "react"
import Head from "next/head"
import Topbar from "@/components/topbar/Topbar"
import api from "@/utils/apiSetup"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { selectUser, setUser } from "@/store/features/userSlice"
import { useDispatch, useSelector } from "react-redux"
import axios from "axios"
import { toast } from "react-toastify"
import { Country, State, City } from 'country-state-city';

export default function ProfileForm() {
  const [activeTab, setActiveTab] = useState("personal")
  const [profileImage, setProfileImage] = useState(null)
  const [defaultValues, setDefaultValues] = useState({})
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(true)
  const [isImageUploading, setIsImageUploading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm()

  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: "languageProficiency",
  })

  const {
    fields: careerFields,
    append: appendCareer,
    remove: removeCareer,
  } = useFieldArray({
    control,
    name: "careerHistory",
  })

  const {
    fields: specializationFields,
    append: appendSpecialization,
    remove: removeSpecialization,
  } = useFieldArray({
    control,
    name: "specializations",
  })

  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertification,
  } = useFieldArray({
    control,
    name: "certifications",
  })

  const {
    fields: awardFields,
    append: appendAward,
    remove: removeAward,
  } = useFieldArray({
    control,
    name: "awards",
  })

  const {
    fields: publicationFields,
    append: appendPublication,
    remove: removePublication,
  } = useFieldArray({
    control,
    name: "publications",
  })

  const {
    fields: tutorialFields,
    append: appendTutorial,
    remove: removeTutorial,
  } = useFieldArray({
    control,
    name: "tutorials",
  })

  const {
    fields: networkFields,
    append: appendNetwork,
    remove: removeNetwork,
  } = useFieldArray({
    control,
    name: "professionalNetworks",
  });

  const {
    fields: collaborationFields,
    append: appendCollaboration,
    remove: removeCollaboration,
  } = useFieldArray({
    control,
    name: "collaborations",
  });

  const {
    fields: eventFields,
    append: appendEvent,
    remove: removeEvent,
  } = useFieldArray({
    control,
    name: "eventsParticipation",
  });

  const {
    fields: socialMediaFields,
    append: appendSocialMedia,
    remove: removeSocialMedia,
  } = useFieldArray({
    control,
    name: "socialMediaLinks",
  });

  const {
    fields: portfolioFields,
    append: appendPortfolio,
    remove: removePortfolio,
  } = useFieldArray({
    control,
    name: "onlinePortfolios",
  });

  const router = useRouter()
  const { id } = router.query
  console.log("----dv", defaultValues)

  useEffect(() => {
    if (id) {
      setIsLoading(true)
      api
        .get(`user/${id}`)
        .then((response) => {
          const userData = response.data.user;
          
          // Set profile image from user data
          if (userData.photoURL) {
            setProfileImage(userData.photoURL);
          }

          // Convert country name to ISO code for the dropdown
          if (userData.nationality) {
            const countryData = Country.getAllCountries().find(
              c => c.name === userData.nationality
            );
            if (countryData) {
              userData.nationality = countryData.isoCode;
              userData.nationalityName = countryData.name;
            }
          }

          // Convert state name to ISO code for the dropdown
          if (userData.state && userData.nationality) {
            const stateData = State.getStatesOfCountry(userData.nationality).find(
              s => s.name === userData.state
            );
            if (stateData) {
              userData.state = stateData.isoCode;
              userData.stateName = stateData.name;
            }
          }

          setDefaultValues(userData)
          reset(userData) // Reset form with fetched data
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [id, user])

  const [profileProgress, setProfileProgress] = useState(null)

  useEffect(() => {
    if (id) {
      api
        .get(`user/${id}/profile-progress`)
        .then((response) => {
          setProfileProgress(response.data)
        })
        .catch((error) => {
          console.error("Error fetching profile progress:", error)
        })
    }
  }, [id, defaultValues])

  const sortCareerHistory = (careerHistory) => {
    return careerHistory.sort((a, b) => {
      const dateA = a.endDate || new Date().toISOString().split('T')[0];
      const dateB = b.endDate || new Date().toISOString().split('T')[0];
      return new Date(dateB) - new Date(dateA);
    });
  };

  async function onSubmit(data) {
    try {
      // Sort career history before submitting
      const sortedCareerHistory = sortCareerHistory(data.careerHistory || []);

      // Prepare location data with names instead of codes
      const locationData = {
        nationality: data.nationalityName,
        state: data.stateName,
        location: data.location, // city is already a name
      };

      const updatedData = {
        ...data,
        ...locationData,
        careerHistory: sortedCareerHistory
      };

      // Remove the ISO code fields before sending to backend
      delete updatedData.nationalityName;
      delete updatedData.stateName;

      const response = await api.patch(`user/${id}`, updatedData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        dispatch(setUser({ ...user, ...updatedData }));
        toast(`Profile Successfully Edited`, { type: "success" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast(`Error updating profile`, { type: "error" });
    }
  }

  const tabs = [
    { id: "personal", label: "Personal Info" },
    { id: "professional", label: "Professional" },
    { id: "culinary", label: "Culinary" },
    { id: "contributions", label: "Contributions" },
    { id: "content", label: "Content" },
    { id: "networking", label: "Networking" },
    { id: "digital", label: "Digital Presence" },
    { id: "availability", label: "Availability" },
    { id: "skills", label: "Skills" },
  ]

  // First, add these options arrays at the top of your component
  const ifcaRoles = [
    { value: "Committee Member", icon: "👥" },
    { value: "Event Organizer", icon: "📅" },
    { value: "Speaker", icon: "🎤" },
    { value: "Mentor", icon: "📚" },
    { value: "Workshop Facilitator", icon: "🎯" },
    { value: "Judge", icon: "⚖️" }
  ];

  const industryContributions = [
    { value: "Publications", icon: "📚" },
    { value: "Conference Speaker", icon: "🎤" },
    { value: "Workshop Conductor", icon: "🎯" },
    { value: "Research", icon: "🔬" },
    { value: "Industry Consultant", icon: "💼" },
    { value: "Educational Programs", icon: "🎓" }
  ];

  const interestAreas = [
    { value: "Sustainable Cooking", icon: "🌱" },
    { value: "Food Innovation", icon: "🔬" },
    { value: "Traditional Cuisine", icon: "🏺" },
    { value: "Food Safety", icon: "🛡️" },
    { value: "Restaurant Management", icon: "🏢" },
    { value: "Food Photography", icon: "📸" },
    { value: "Menu Development", icon: "📋" },
    { value: "Food Technology", icon: "💻" }
  ];

  const technologySkills = [
    { value: "Restaurant POS Systems", icon: "💻" },
    { value: "Inventory Management Software", icon: "📦" },
    { value: "Menu Planning Tools", icon: "📋" },
    { value: "Social Media Management", icon: "📱" },
    { value: "Food Photography", icon: "📸" },
    { value: "Digital Marketing", icon: "🎯" },
    { value: "Recipe Management Software", icon: "📝" },
    { value: "Food Cost Calculator", icon: "🧮" }
  ];

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setIsImageUploading(true);
        
        // Get presigned URL from backend
        const presignedUrlResponse = await api.post("images/generate-presigned-url", {
          fileName: file.name,
          fileType: file.type,
          folder: "user"
        });
        
        const { uploadUrl, fileUrl } = presignedUrlResponse.data;

        // Upload file to S3 using presigned URL
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image to S3');
        }

        // Update user profile with the file URL
        const response = await api.patch(`user/${id}`, {
          photoURL: fileUrl
        }, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200) {
          // Update local state
          setProfileImage(fileUrl);
          
          // Update Redux store
          dispatch(setUser({ ...user, photoURL: fileUrl }));
          
          // Update defaultValues
          setDefaultValues(prev => ({ ...prev, photoURL: fileUrl }));
          
          toast('Profile image updated successfully', { type: 'success' });
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast('Error uploading profile image', { type: 'error' });
      } finally {
        setIsImageUploading(false);
      }
    }
  };

  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <header>
        <Topbar />
      </header>
      <main>
        <div className="min-h-screen mt-[90px] max-w-7xl mx-auto text-black">
          <div className="relative h-[100px] md:h-[120px] w-full bg-gray-200">
            <div
              className="relative h-[100px] md:h-[120px] w-full bg-[#B22222]"
              style={{
                backgroundImage: `url(${"/user_banner.png"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute -bottom-12 left-8">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white">
                  <Image
                    src={profileImage || "/t6.svg"}
                    alt="Profile picture"
                    width={150}
                    height={150}
                    className="object-cover"
                    priority
                  />
                  <label className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer ${isImageUploading ? 'opacity-100' : ''}`}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden"
                      disabled={isImageUploading}
                    />
                    <span className="text-white text-sm">
                      {isImageUploading ? 'Uploading...' : 'Change'}
                    </span>
                  </label>
                </div>
              </div>
              <div className="absolute bottom-0 right-4 bg-white p-2">
                <p className="text-xs font-medium text-gray-500 text-center">Profile Progress</p>
                <div className="relative w-16 h-16 flex items-center justify-center mt-1 pl-2">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray="87.96"
                      strokeDashoffset={
                        87.96 - (87.96 * (profileProgress?.profileProgress || 0)) / 100
                      }
                      className="text-orange-500 transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xs font-semibold text-gray-800">
                    {profileProgress?.profileProgress ?? 0}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 text-center mt-1">Completed</p>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="container mx-auto  px-4">
            <form onSubmit={handleSubmit(onSubmit)} className="">
              {/* Tabs */}
              <div className="flex flex-wrap gap-2 border-b mt-10">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 font-medium rounded-t-lg transition-colors
                  ${activeTab === tab.id
                        ? "bg-white border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "personal" && (
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        {...register("name", { required: "Name is required" })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preferred Name</label>
                      <input
                        type="text"
                        {...register("preferredName")}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                          },
                        })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        {...register("phone")}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preferred Contact</label>
                      <select
                        value={watch('preferredContact') || ''}
                        onChange={(e) => setValue('preferredContact', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select contact method</option>
                        {[
                          { value: 'phone', label: 'Phone' },
                          { value: 'email', label: 'Email' },
                          { value: 'whatsapp', label: 'WhatsApp' },
                          { value: 'facebook', label: 'Facebook' },
                          { value: 'msg', label: 'Message' }
                        ].map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nationality</label>
                      <select
                        value={watch('nationality') || ''}
                        onChange={(e) => {
                          setValue('state', '');
                          setValue('location', '');
                          setValue('nationality', e.target.value);
                          // Store country name in a separate field for backend
                          const selectedCountry = Country.getAllCountries().find(c => c.isoCode === e.target.value);
                          setValue('nationalityName', selectedCountry?.name || '');
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select country</option>
                        {Country.getAllCountries().map((country) => (
                          <option key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <select
                        value={watch('state') || ''}
                        onChange={(e) => {
                          setValue('location', '');
                          setValue('state', e.target.value);
                          // Store state name in a separate field for backend
                          const selectedState = State.getStatesOfCountry(watch('nationality'))?.find(s => s.isoCode === e.target.value);
                          setValue('stateName', selectedState?.name || '');
                        }}
                        disabled={!watch('nationality')}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select state</option>
                        {State.getStatesOfCountry(watch('nationality'))?.map((state) => (
                          <option key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <select
                        value={watch('location') || ''}
                        onChange={(e) => {
                          setValue('location', e.target.value);
                          // City already uses name as value, so no conversion needed
                        }}
                        disabled={!watch('state')}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select city</option>
                        {City.getCitiesOfState(watch('nationality'), watch('state'))?.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pincode</label>
                      <input
                        type="text"
                        {...register("pincode")}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "professional" && (
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold">Professional Background</h2>

                  <div className="space-y-4">
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700">Current Position</label>
                      <input
                        type="text"
                        {...register("currentPosition")}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div> */}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">Career History</label>
                      {careerFields.map((field, index) => (
                        <div key={field.id} className="bg-gray-50 p-4 rounded-lg mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Company Name</label>
                              <input
                                {...register(`careerHistory.${index}.companyName`)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                placeholder="Enter company name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Job Title</label>
                              <input
                                {...register(`careerHistory.${index}.jobTitle`)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                placeholder="Enter job title"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Start Date</label>
                              <input
                                type="date"
                                {...register(`careerHistory.${index}.startDate`)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              />
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">End Date</label>
                                <input
                                  type="date"
                                  {...register(`careerHistory.${index}.endDate`)}
                                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                  disabled={watch(`careerHistory.${index}.isCurrentPosition`)}
                                />
                              </div>
                              <div className="mt-7">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    {...register(`careerHistory.${index}.isCurrentPosition`)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setValue(`careerHistory.${index}.endDate`, '');
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-600">Current Position</span>
                                </label>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeCareer(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => appendCareer({
                          companyName: '',
                          jobTitle: '',
                          startDate: '',
                          endDate: '',
                          isCurrentPosition: false
                        })}
                        className="text-orange-500 hover:text-blue-600 flex items-center gap-2"
                      >
                        <span>+ Add Career History</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Specializations</label>
                      {specializationFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 mt-2">
                          <input
                            {...register(`specializations.${index}`)}
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                          />
                          <button
                            type="button"
                            onClick={() => removeSpecialization(index)}
                            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-md"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => appendSpecialization("")}
                        className="mt-2 text-orange-500 hover:text-blue-600"
                      >
                        + Add Specialization
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">Certifications</label>
                      {certificationFields.map((field, index) => (
                        <div key={field.id} className="bg-gray-50 p-4 rounded-lg mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Name</label>
                              <input
                                {...register(`certifications.${index}.name`)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                placeholder="Enter certification name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Issuing Organization</label>
                              <input
                                {...register(`certifications.${index}.organization`)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                placeholder="Enter issuing organization"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                              <input
                                type="date"
                                {...register(`certifications.${index}.issueDate`)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              />
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
                                <input
                                  type="date"
                                  {...register(`certifications.${index}.expirationDate`)}
                                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                  disabled={watch(`certifications.${index}.noExpiration`)}
                                />
                              </div>
                              <div className="mt-7">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    {...register(`certifications.${index}.noExpiration`)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setValue(`certifications.${index}.expirationDate`, '');
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-600">No Expiration</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Credential ID</label>
                              <input
                                {...register(`certifications.${index}.credentialId`)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                placeholder="Enter credential ID (optional)"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Credential URL</label>
                              <input
                                type="url"
                                {...register(`certifications.${index}.credentialUrl`)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                placeholder="Enter credential URL (optional)"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeCertification(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => appendCertification({
                          name: '',
                          organization: '',
                          issueDate: '',
                          expirationDate: '',
                          noExpiration: false,
                          credentialId: '',
                          credentialUrl: ''
                        })}
                        className="text-orange-500 hover:text-blue-600 flex items-center gap-2"
                      >
                        <span>+ Add Certification</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Awards</label>
                      {awardFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 mt-2">
                          <input
                            {...register(`awards.${index}`)}
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                          />
                          <button
                            type="button"
                            onClick={() => removeAward(index)}
                            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-md"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => appendAward("")}
                        className="mt-2 text-orange-500 hover:text-blue-600"
                      >
                        + Add Award
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "culinary" && (
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold">Culinary Philosophy</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Culinary Philosophy</label>
                      <textarea
                        {...register("culinaryPhilosophy")}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vision</label>
                      <textarea
                        {...register("vision")}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sustainability</label>
                      <textarea
                        {...register("sustainability")}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "contributions" && (
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold mb-6">Professional Contributions</h2>

                  {/* IFCA Involvement */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">IFCA Involvement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {ifcaRoles.map((option) => (
                        <label key={option.value} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            value={option.value}
                            {...register("ifcaInvolvement")}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 flex items-center gap-2">
                            <span className="text-xl">{option.icon}</span>
                            <span className="text-sm text-gray-700">{option.value}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Industry Contributions */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Industry Contributions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {industryContributions.map((option) => (
                        <label key={option.value} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            value={option.value}
                            {...register("industryContributions")}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 flex items-center gap-2">
                            <span className="text-xl">{option.icon}</span>
                            <span className="text-sm text-gray-700">{option.value}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Mentorship */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Mentorship Areas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {interestAreas.map((option) => (
                        <label key={option.value} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            value={option.value}
                            {...register("interests")}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 flex items-center gap-2">
                            <span className="text-xl">{option.icon}</span>
                            <span className="text-sm text-gray-700">{option.value}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>


                </div>
              )}

              {activeTab === "content" && (
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold mb-6">Content & Publications</h2>

                  {/* Publications Section */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Publications</h3>
                    {publicationFields.map((field, index) => (
                      <div key={field.id} className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                              {...register(`publications.${index}.title`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Publication title"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Publisher</label>
                            <input
                              {...register(`publications.${index}.publisher`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Publisher name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Publication Date</label>
                            <input
                              type="date"
                              {...register(`publications.${index}.date`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">URL</label>
                            <input
                              type="url"
                              {...register(`publications.${index}.url`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Publication URL"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => removePublication(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => appendPublication({ title: '', publisher: '', date: '', url: '' })}
                      className="text-orange-500 hover:text-blue-600"
                    >
                      + Add Publication
                    </button>
                  </div>

                  {/* Recipes Section */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recipes</h3>
                    <div className="space-y-2">
                      {watch('recipes')?.map((recipe, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            {...register(`recipes.${index}`)}
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                            placeholder="Recipe name"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const recipes = watch('recipes');
                              setValue('recipes', recipes.filter((_, i) => i !== index));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const recipes = watch('recipes') || [];
                          setValue('recipes', [...recipes, '']);
                        }}
                        className="text-orange-500 hover:text-blue-600"
                      >
                        + Add Recipe
                      </button>
                    </div>
                  </div>

                  {/* Tutorials Section */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tutorials</h3>
                    {tutorialFields.map((field, index) => (
                      <div key={field.id} className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                              {...register(`tutorials.${index}.title`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Tutorial title"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Platform</label>
                            <input
                              {...register(`tutorials.${index}.platform`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Platform name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">URL</label>
                            <input
                              type="url"
                              {...register(`tutorials.${index}.url`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Tutorial URL"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                              {...register(`tutorials.${index}.description`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Brief description"
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => removeTutorial(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => appendTutorial({ title: '', platform: '', url: '', description: '' })}
                      className="text-orange-500 hover:text-blue-600"
                    >
                      + Add Tutorial
                    </button>
                  </div>

                  {/* Expertise Section */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Expertise</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Area of Expertise</label>
                      <textarea
                        {...register("expertise")}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Describe your main areas of expertise..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "skills" && (
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold mb-6">Skills & Proficiency</h2>

                  {/* Language Proficiency */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Language Proficiency</h3>
                    {languageFields.map((field, index) => (
                      <div key={field.id} className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Language</label>
                            <input
                              {...register(`languageProficiency.${index}.language`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Enter language"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Proficiency Level</label>
                            <select
                              {...register(`languageProficiency.${index}.level`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                            >
                              <option value="">Select Level</option>
                              <option value="Basic">Basic</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                              <option value="Native/Bilingual">Native/Bilingual</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLanguage(index)}
                          className="mt-2 text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => appendLanguage({ language: '', level: '' })}
                      className="text-orange-500 hover:text-blue-600"
                    >
                      + Add Language
                    </button>
                  </div>

                  {/* Technology Skills */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Technology Skills</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {technologySkills.map((skill) => (
                        <label key={skill.value} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer">
                          <input
                            type="checkbox"
                            value={skill.value}
                            {...register('technologySkills')}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 flex items-center gap-2">
                            <span className="text-xl">{skill.icon}</span>
                            <span className="text-sm text-gray-700">{skill.value}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "networking" && (
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold mb-6">Professional Networking</h2>

                  {/* Professional Networks Section */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Networks</h3>
                    <p className="text-sm text-gray-500 mb-4">Add your memberships in culinary associations and organizations</p>
                    {networkFields.map((field, index) => (
                      <div key={field.id} className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                            <input
                              {...register(`professionalNetworks.${index}.name`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Organization name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Role/Position</label>
                            <input
                              {...register(`professionalNetworks.${index}.role`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Your role in the organization"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => removeNetwork(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => appendNetwork({ name: '', role: '' })}
                      className="text-orange-500 hover:text-blue-600"
                    >
                      + Add Professional Network
                    </button>
                  </div>

                  {/* Collaborations Section */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Collaborations</h3>
                    <p className="text-sm text-gray-500 mb-4">Add your collaborations with other chefs, restaurants, or food brands</p>
                    {collaborationFields.map((field, index) => (
                      <div key={field.id} className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Collaboration Partner</label>
                            <input
                              {...register(`collaborations.${index}.partner`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Partner name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Project/Initiative</label>
                            <input
                              {...register(`collaborations.${index}.project`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Project or initiative name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                              {...register(`collaborations.${index}.description`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Brief description of the collaboration"
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => removeCollaboration(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => appendCollaboration({ partner: '', project: '', description: '' })}
                      className="text-orange-500 hover:text-blue-600"
                    >
                      + Add Collaboration
                    </button>
                  </div>

                  {/* Events Participation Section */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Events Participation</h3>
                    <p className="text-sm text-gray-500 mb-4">Add your participation in food festivals, competitions, and culinary events</p>
                    {eventFields.map((field, index) => (
                      <div key={field.id} className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Event Name</label>
                            <input
                              {...register(`eventsParticipation.${index}.name`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Event name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <input
                              {...register(`eventsParticipation.${index}.role`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Your role in the event"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                              type="date"
                              {...register(`eventsParticipation.${index}.date`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <input
                              {...register(`eventsParticipation.${index}.location`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Event location"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => removeEvent(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => appendEvent({ name: '', role: '', date: '', location: '' })}
                      className="text-orange-500 hover:text-blue-600"
                    >
                      + Add Event
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "digital" && (
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold mb-6">Digital Presence</h2>

                  {/* Website Section */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Website</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Website URL</label>
                      <input
                        type="url"
                        {...register("website")}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="https://your-website.com"
                      />
                    </div>
                  </div>

                  {/* Social Media Links Section */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Profiles</h3>
                    {socialMediaFields.map((field, index) => (
                      <div key={field.id} className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Platform</label>
                            <select
                              {...register(`socialMediaLinks.${index}.platform`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                            >
                              <option value="">Select Platform</option>
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="Instagram">Instagram</option>
                              <option value="Facebook">Facebook</option>
                              <option value="Twitter">Twitter</option>
                              <option value="YouTube">YouTube</option>
                              <option value="TikTok">TikTok</option>
                              <option value="Pinterest">Pinterest</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Profile URL</label>
                            <input
                              type="url"
                              {...register(`socialMediaLinks.${index}.url`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="https://platform.com/your-profile"
                            />
                          </div>
                          {watch(`socialMediaLinks.${index}.platform`) === 'Other' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Platform Name</label>
                              <input
                                {...register(`socialMediaLinks.${index}.customPlatform`)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                placeholder="Enter platform name"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => removeSocialMedia(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => appendSocialMedia({ platform: '', url: '', customPlatform: '' })}
                      className="text-orange-500 hover:text-blue-600"
                    >
                      + Add Social Media Profile
                    </button>
                  </div>

                  {/* Online Portfolios Section */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Online Portfolios</h3>
                    <p className="text-sm text-gray-500 mb-4">Add links to your online portfolios, blogs, or other professional content</p>
                    {portfolioFields.map((field, index) => (
                      <div key={field.id} className="bg-white p-4 rounded-lg mb-4 border border-gray-200">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Portfolio Title</label>
                            <input
                              {...register(`onlinePortfolios.${index}.title`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="Portfolio title or description"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">URL</label>
                            <input
                              type="url"
                              {...register(`onlinePortfolios.${index}.url`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                              placeholder="https://portfolio-url.com"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => removePortfolio(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => appendPortfolio({ title: '', url: '' })}
                      className="text-orange-500 hover:text-blue-600"
                    >
                      + Add Portfolio
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "availability" && (
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold mb-6">Availability & Interests</h2>

                  {/* Event Participation */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Event Participation Preferences</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Availability for Events</label>
                        <select
                          {...register('availability')}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                          <option value="">Select Availability</option>
                          <option value="Weekends Only">Weekends Only</option>
                          <option value="Weekdays Only">Weekdays Only</option>
                          <option value="Flexible">Flexible</option>
                          <option value="Limited Availability">Limited Availability</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Areas of Interest */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Areas of Interest</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {interestAreas.map((interest) => (
                        <label key={interest.value} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer">
                          <input
                            type="checkbox"
                            value={interest.value}
                            {...register('interests')}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 flex items-center gap-2">
                            <span className="text-xl">{interest.icon}</span>
                            <span className="text-sm text-gray-700">{interest.value}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Mentorship Availability */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Mentorship Availability</h3>
                        <p className="text-sm text-gray-500 mt-1">Are you available to mentor other chefs?</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('mentorshipAvailability')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pb-8">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-white bg-primary-500 rounded-md hover:bg-blue-600">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <footer></footer>
    </>
  )
}

