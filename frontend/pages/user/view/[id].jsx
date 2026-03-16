import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import Topbar from "@/components/topbar/Topbar";
import api from '@/utils/apiSetup';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import { motion } from 'framer-motion';

export default function ProfileView() {
    const [activeTab, setActiveTab] = useState("personal");
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [profileProgress, setProfileProgress] = useState(null);
    const user = useSelector(selectUser);
    const router = useRouter();
    const { id } = router.query;

    // Constants for interests and skills with icons
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

    const preferredContactOptions = [
        { value: 'phone', label: 'Phone' },
        { value: 'email', label: 'Email' },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'msg', label: 'Message' }
    ];

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                if (!id || !user?.unifiedUser?.id) return;

                const [profileRes, progressRes] = await Promise.all([
                    api.get(`connections/profile/${id}?currentUserId=${user?.unifiedUser?.id}`),
                    api.get(`user/${user?.id}/profile-progress`)
                ]);

                setProfile(profileRes.data.user || profileRes.data.partner || profileRes.data.expert || profileRes.data.admin);
                setConnectionStatus(profileRes.data.connectionStatus);
                setProfileProgress(progressRes.data);
            } catch (error) {
                console.error("Failed to fetch profile data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id && user?.id) {
            fetchUserProfile();
        }
    }, [id, user]);

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
    ];

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const renderField = (label, value, icon = null) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
                {icon && <span className="text-gray-500">{icon}</span>}
                <span className="text-gray-700">{value || "Not specified"}</span>
            </div>
        </div>
    );

    const renderArrayField = (label, items = [], renderItem = (item) => item) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            {items && items.length > 0 ? (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-md px-3 py-2">
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 rounded-md px-3 py-2 text-gray-500">
                    No {label.toLowerCase()} specified
                </div>
            )}
        </div>
    );

    const renderInterestsField = (label, items = [], options = []) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {options.map((option) => {
                    const isSelected = items?.includes(option.value);
                    return (
                        <div
                            key={option.value}
                            className={`flex items-center p-3 rounded-lg border ${
                                isSelected ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-xl">{option.icon}</span>
                                <span className="text-sm text-gray-700">{option.value}</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <>
            <Head>
                <title>{profile?.name || 'Profile'} | View Profile</title>
            </Head>
            <header>
                <Topbar />
            </header>
            <main>
                <div className="min-h-screen mt-[90px] max-w-7xl mx-auto">
                    <div className="relative h-[100px] md:h-[120px] w-full bg-gray-200">
                        <div
                            className="relative h-[100px] md:h-[120px] w-full bg-[#B22222]"
                            style={{
                                backgroundImage: `url(${profile?.bannerImage || "/user_banner.png"})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        >
                            <div className="absolute -bottom-12 md:-bottom-16 left-8 z-10">
                                <div className="relative">
                                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                                        <Image
                                            src={profile?.photoURL || "/t6.svg"}
                                            alt="Profile picture"
                                            width={150}
                                            height={150}
                                            className="object-cover"
                                        />
                                    </div>
                                    {user?.unifiedUser?.id === parseInt(id) && <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                                        <div className="relative w-8 h-8">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="28"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    className="text-gray-200"
                                                />
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="28"
                                                    stroke="currentColor"
                                                    strokeWidth="6"
                                                    fill="none"
                                                    strokeDasharray="175.93"
                                                    strokeDashoffset={
                                                        175.93 - (175.93 * (profileProgress?.profileProgress || 0)) / 100
                                                    }
                                                    className="text-[#0a66c2] transition-all duration-500"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-800">
                                                {profileProgress?.profileProgress ?? 0}%
                                            </span>
                                        </div>
                                    </div>}
                                </div>
                            </div>
                            <div className="absolute bottom-4 right-4 bg-white p-3 shadow-lg border border-gray-200">
                                <p className="text-xs font-medium text-gray-500 text-center">Profile Progress</p>
                                <div className="relative w-20 h-20 flex items-center justify-center mt-1">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                            className="text-gray-200"
                                        />
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            fill="none"
                                            strokeDasharray="175.93"
                                            strokeDashoffset={
                                                175.93 - (175.93 * (profileProgress?.profileProgress || 0)) / 100
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
                    <div className="container mx-auto px-4">
                        <div className="mt-16">
                            {/* Tabs */}
                            <div className="flex flex-wrap gap-2 border-b">
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
                                        {renderField("Full Name", profile?.name)}
                                        {renderField("Preferred Name", profile?.preferredName)}
                                        {renderField("Email", profile?.email)}
                                        {renderField("Phone", profile?.phone)}
                                        {renderField("Preferred Contact", 
                                            preferredContactOptions.find(opt => opt.value === profile?.preferredContact)?.label || profile?.preferredContact
                                        )}
                                        {renderField("Country", profile?.nationality)}
                                        {renderField("State", profile?.state)}
                                        {renderField("City", profile?.location)}
                                        {renderField("Pincode", profile?.pincode)}
                                    </div>
                                </div>
                            )}

                            {activeTab === "professional" && (
                                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                                    <h2 className="text-xl font-semibold">Professional Background</h2>
                                    {renderArrayField("Career History", profile?.careerHistory, (career) => (
                                        <div>
                                            <div className="font-medium">{career.jobTitle}</div>
                                            <div className="text-gray-600">{career.companyName}</div>
                                            <div className="text-sm text-gray-500">
                                                {career.startDate} - {career.endDate || 'Present'}
                                            </div>
                                        </div>
                                    ))}
                                    {renderArrayField("Specializations", profile?.specializations)}
                                    {renderArrayField("Certifications", profile?.certifications, (cert) => (
                                        <div>
                                            <div className="font-medium">{cert.name}</div>
                                            <div className="text-gray-600">{cert.organization}</div>
                                            <div className="text-sm text-gray-500">
                                                Issued: {cert.issueDate}
                                                {cert.expirationDate && ` - Expires: ${cert.expirationDate}`}
                                            </div>
                                        </div>
                                    ))}
                                    {renderArrayField("Awards", profile?.awards)}
                                </div>
                            )}

                            {activeTab === "culinary" && (
                                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                                    <h2 className="text-xl font-semibold">Culinary Philosophy</h2>
                                    {renderField("Culinary Philosophy", profile?.culinaryPhilosophy)}
                                    {renderField("Vision", profile?.vision)}
                                    {renderField("Sustainability", profile?.sustainability)}
                                </div>
                            )}

                            {activeTab === "contributions" && (
                                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                                    <h2 className="text-xl font-semibold mb-6">Professional Contributions</h2>
                                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">IFCA Involvement</h3>
                                        {renderInterestsField("", profile?.ifcaInvolvement, interestAreas)}
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Industry Contributions</h3>
                                        {renderInterestsField("", profile?.industryContributions, interestAreas)}
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Mentorship Areas</h3>
                                        {renderInterestsField("", profile?.interests, interestAreas)}
                                    </div>
                                </div>
                            )}

                            {activeTab === "content" && (
                                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                                    <h2 className="text-xl font-semibold">Content & Publications</h2>
                                    {renderArrayField("Publications", profile?.publications, (pub) => (
                                        <div>
                                            <div className="font-medium">{pub.title}</div>
                                            <div className="text-gray-600">{pub.publisher}</div>
                                            <div className="text-sm text-gray-500">{pub.date}</div>
                                            {pub.url && <a href={pub.url} className="text-orange-500 hover:underline" target="_blank" rel="noopener noreferrer">View Publication</a>}
                                        </div>
                                    ))}
                                    {renderArrayField("Recipes", profile?.recipes)}
                                    {renderArrayField("Tutorials", profile?.tutorials, (tutorial) => (
                                        <div>
                                            <div className="font-medium">{tutorial.title}</div>
                                            <div className="text-gray-600">{tutorial.platform}</div>
                                            {tutorial.url && <a href={tutorial.url} className="text-orange-500 hover:underline" target="_blank" rel="noopener noreferrer">View Tutorial</a>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "networking" && (
                                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                                    <h2 className="text-xl font-semibold">Professional Networking</h2>
                                    {renderArrayField("Professional Networks", profile?.professionalNetworks, (network) => (
                                        <div>
                                            <div className="font-medium">{network.name}</div>
                                            <div className="text-gray-600">{network.role}</div>
                                        </div>
                                    ))}
                                    {renderArrayField("Collaborations", profile?.collaborations, (collab) => (
                                        <div>
                                            <div className="font-medium">{collab.partner}</div>
                                            <div className="text-gray-600">{collab.project}</div>
                                            <div className="text-sm text-gray-500">{collab.description}</div>
                                        </div>
                                    ))}
                                    {renderArrayField("Events Participation", profile?.eventsParticipation, (event) => (
                                        <div>
                                            <div className="font-medium">{event.name}</div>
                                            <div className="text-gray-600">{event.role}</div>
                                            <div className="text-sm text-gray-500">{event.date} - {event.location}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "digital" && (
                                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                                    <h2 className="text-xl font-semibold">Digital Presence</h2>
                                    {renderField("Website", profile?.website)}
                                    {renderArrayField("Social Media Profiles", profile?.socialMediaLinks, (social) => (
                                        <div>
                                            <div className="font-medium">{social.platform}</div>
                                            <a href={social.url} className="text-orange-500 hover:underline" target="_blank" rel="noopener noreferrer">{social.url}</a>
                                        </div>
                                    ))}
                                    {renderArrayField("Online Portfolios", profile?.onlinePortfolios, (portfolio) => (
                                        <div>
                                            <div className="font-medium">{portfolio.title}</div>
                                            <a href={portfolio.url} className="text-orange-500 hover:underline" target="_blank" rel="noopener noreferrer">{portfolio.url}</a>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "availability" && (
                                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                                    <h2 className="text-xl font-semibold">Availability & Interests</h2>
                                    {renderField("Availability for Events", profile?.availability)}
                                    {renderArrayField("Areas of Interest", profile?.interests)}
                                    {renderField("Mentorship Availability", profile?.mentorshipAvailability ? "Available for mentorship" : "Not available for mentorship")}
                                </div>
                            )}

                            {activeTab === "skills" && (
                                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                                    <h2 className="text-xl font-semibold">Skills & Proficiency</h2>
                                    {renderArrayField("Language Proficiency", profile?.languageProficiency, (lang) => (
                                        <div>
                                            <div className="font-medium">{lang.language}</div>
                                            <div className="text-gray-600">Proficiency: {lang.level}</div>
                                        </div>
                                    ))}
                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Technology Skills</h3>
                                        {renderInterestsField("", profile?.technologySkills, technologySkills)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
} 