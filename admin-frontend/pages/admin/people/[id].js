import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/router"
import { useSelector } from "react-redux"
import { selectUserDetails } from "@/store/features/userSlice"
import api from "@/utils/apiSetup"
import { toast } from "react-toastify"
import Head from "next/head"
import { MdChevronRight, MdHome } from "react-icons/md"

const User = () => {
  const router = useRouter()
  const index = Number.parseInt(window.location.pathname.split("/")[3])
  const userDetails = useSelector(selectUserDetails)
  const [user, setUser] = useState(null)
  const [communities, setCommunities] = useState([])
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)

  const handleFetchUser = async () => {
    try {
      const res = await api.get(`/user/${index}`)
      const userData = res?.data?.user || res?.data || {}

      // Create a safe user object with all fields properly serialized
      const safeUserData = {
        id: Number(userData.id) || Number(index),
        name: String(userData.name || ""),
        email: String(userData.email || ""),
        phone: String(userData.phone || ""),
        location: String(userData.location || ""),
        state: String(userData.state || ""),
        pincode: String(userData.pincode || ""),
        nationality: String(userData.nationality || ""),
        expertise: String(userData.expertise || ""),
        availability: String(userData.availability || ""),
        preferredContact: String(userData.preferredContact || ""),
        mentorshipAvailability: Boolean(userData.mentorshipAvailability),
        desc: String(userData.desc || ""),
        photoURL: String(userData.photoURL || "/notImg.svg"),
        specializations: Array.isArray(userData.specializations)
          ? userData.specializations.map((s) => String(s || ""))
          : [],
        technologySkills: Array.isArray(userData.technologySkills)
          ? userData.technologySkills.map((s) => String(s || ""))
          : [],
        awards: Array.isArray(userData.awards) ? userData.awards.map((a) => String(a || "")) : [],
        certifications: Array.isArray(userData.certifications)
          ? userData.certifications.map((cert) => ({
              name: String(cert?.name || ""),
              issueDate: String(cert?.issueDate || ""),
              credentialId: String(cert?.credentialId || ""),
              noExpiration: Boolean(cert?.noExpiration),
              organization: String(cert?.organization || ""),
              credentialUrl: String(cert?.credentialUrl || ""),
              expirationDate: String(cert?.expirationDate || ""),
            }))
          : [],
        careerHistory: Array.isArray(userData.careerHistory)
          ? userData.careerHistory.map((job) => ({
              jobTitle: String(job?.jobTitle || ""),
              startDate: String(job?.startDate || ""),
              endDate: String(job?.endDate || ""),
              company: String(job?.company || ""),
              description: String(job?.description || ""),
            }))
          : [],
        socialMediaLinks: Array.isArray(userData.socialMediaLinks)
          ? userData.socialMediaLinks.map((link) => ({
              platform: String(link?.platform || ""),
              url: String(link?.url || ""),
              customPlatform: String(link?.customPlatform || ""),
            }))
          : [],
        onlinePortfolios: Array.isArray(userData.onlinePortfolios)
          ? userData.onlinePortfolios.map((portfolio) => ({
              title: String(portfolio?.title || ""),
              url: String(portfolio?.url || ""),
              description: String(portfolio?.description || ""),
            }))
          : [],
        languageProficiency: Array.isArray(userData.languageProficiency)
          ? userData.languageProficiency.map((lang) => ({
              language: String(lang?.language || ""),
              level: String(lang?.level || ""),
            }))
          : [],
        eventsParticipation: Array.isArray(userData.eventsParticipation)
          ? userData.eventsParticipation.map((event) => ({
              name: String(event?.name || ""),
              role: String(event?.role || ""),
              location: String(event?.location || ""),
              date: String(event?.date || ""),
            }))
          : [],
        collaborations: Array.isArray(userData.collaborations)
          ? userData.collaborations.map((collab) => ({
              project: String(collab?.project || ""),
              partner: String(collab?.partner || ""),
              description: String(collab?.description || ""),
            }))
          : [],
        unifiedUser: userData.unifiedUserId || {},
      }

      setUser(safeUserData)
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
      toast.error("Failed to fetch user details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchCommunities = async () => {
    try {
      setIsLoadingCommunities(true)
      const res = await api.get(`user/${index}/community/subscribed`)
      const communitiesData = res?.data?.communities || []
      setCommunities(communitiesData)
    } catch (error) {
      console.error("Error fetching communities:", error)
      setCommunities([])
      toast.error("Failed to fetch communities")
    } finally {
      setIsLoadingCommunities(false)
    }
  }

  const handleFetchSessions = async () => {
    try {
      setIsLoadingSessions(true)
      const res = await api.get(`user/${index}/sessions/subscribed`)
      const sessionsData = res?.data?.sessions || []
      setSessions(sessionsData)
    } catch (error) {
      console.error("Error fetching sessions:", error)
      setSessions([])
      toast.error("Failed to fetch sessions")
    } finally {
      setIsLoadingSessions(false)
    }
  }

  useEffect(() => {
    handleFetchUser()
    handleFetchCommunities()
    handleFetchSessions()
  }, [index])

  const handleEditUser = (e) => {
    e.preventDefault()
    router.push(`/admin/people/add/${user?.id}`)
  }

  const handleDeleteUser = async (e) => {
    const ans = prompt("Sure You wanna delete user? Type YES in caps to confirm. This action is irreversible.")
    if (ans === "YES") {
      try {
        const res = await api.delete(`/user/${user?.id}`)
        if (res.data) {
          toast.success("User Deleted Successfully")
          router.replace(`/admin/people`)
        }
      } catch (error) {
        console.error("Error deleting user:", error)
        toast.error("Failed to delete user")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">User not found</h1>
          <p className="text-gray-500 mt-2">Please try again or go back to the users list</p>
          <button
            onClick={() => router.push("/admin/people")}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200"
          >
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{user?.name || "User Details"}</title>
      </Head>

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-2">
        <div className="mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <button onClick={() => router.push("/admin")} className="flex items-center hover:text-orange-700">
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <button onClick={() => router.push("/admin/people")} className="text-gray-500 hover:text-orange-700">
            Users
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium truncate max-w-[200px] md:max-w-xs" title={user?.name}>
            {user?.name}
          </span>
        </div>
      </div>

      <div className="min-h-[calc(100vh-138px)] bg-gray-50 mx-auto px-2 md:px-4 lg:px-0 max-w-[1920px]">
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] max-w-[1920px] mx-auto">
          {/* Left Section: 35% width */}
          <section className="flex flex-col gap-6 p-0 w-full lg:w-[35%] lg:sticky lg:top-24 bg-transparent z-10 h-fit">
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-6">
              <div className="relative w-72 flex justify-center aspect-square rounded-xl overflow-hidden bg-orange-50">
  <Image
    src={user?.photoURL || "/notImg.svg"}
    alt={user?.name}
    layout="fill"
    objectFit="cover"
    className="rounded-xl"
  />
</div>

              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-gray-600 line-clamp-2 mt-1 text-lg">{user?.desc}</p>
              </div>
              {/* Operations Section */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={handleEditUser}
                  className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300"
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                  <span className="relative z-10">Edit User</span>
                </button>

                <button
                  onClick={() => router.push(`/user/${user?.unifiedUser?.id}`)}
                  className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300"
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                  <span className="relative z-10">User View</span>
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="relative overflow-hidden group bg-gradient-to-r from-pink-500 to-orange-500 hover:from-orange-600 hover:to-pink-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-pink-300"
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                  <span className="relative z-10">Delete User</span>
                </button>
              </div>
            </div>
          </section>

          {/* Right Section: 65% width */}
          <section className="flex flex-col gap-8 p-0 w-full lg:w-[65%] lg:overflow-y-auto lg:max-h-[calc(100vh-7rem)] lg:pr-2 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-gray-100 hover:scrollbar-thumb-orange-400">
            {/* About Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" />
                </svg>
                About
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base text-gray-700">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-base text-gray-700">{user?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-base text-gray-700">
                      {user?.location}, {user?.state}, {user?.pincode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nationality</p>
                    <p className="text-base text-gray-700">{user?.nationality}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Expertise</p>
                    <p className="text-base text-gray-700">{user?.expertise}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Availability</p>
                    <p className="text-base text-gray-700">{user?.availability}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Preferred Contact</p>
                    <p className="text-base text-gray-700 capitalize">{user?.preferredContact}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mentorship Available</p>
                    <p className="text-base text-gray-700">{user?.mentorshipAvailability ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Details Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Professional Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Career History */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Career History</h3>
                  {user?.careerHistory?.length > 0 ? (
                    <div className="space-y-4">
                      {user.careerHistory.map((job, index) => (
                        <div key={index} className="bg-orange-50 rounded-lg p-3">
                          <p className="font-medium text-orange-900">{job.jobTitle}</p>
                          <p className="text-sm text-gray-600">
                            {job.startDate} - {job.endDate || "Present"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No career history available</p>
                  )}
                </div>

                {/* Awards & Certifications */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Awards & Certifications</h3>
                  {user?.awards?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500 mb-2">Awards</p>
                      <div className="flex flex-wrap gap-2">
                        {user.awards.map((award, index) => (
                          <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm">
                            {award}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {user?.certifications?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Certifications</p>
                      <div className="space-y-4">
                        {user.certifications.map((cert, index) => (
                          <div key={index} className="bg-orange-50 rounded-lg p-3">
                            <p className="font-medium text-orange-900">{cert.name}</p>
                            <p className="text-sm text-gray-600">Issued: {cert.issueDate}</p>
                            {cert.organization && <p className="text-sm text-gray-600">By: {cert.organization}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Skills & Expertise Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Skills & Expertise
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specializations */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {user?.specializations?.map((spec, index) => (
                      <span key={index} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Technology Skills */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Technology Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {user?.technologySkills?.map((skill, index) => (
                      <span key={index} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Language Proficiency */}
                <div className="md:col-span-2">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Language Proficiency</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user?.languageProficiency?.map((lang, index) => (
                      <div key={index} className="bg-orange-50 rounded-lg p-3">
                        <p className="font-medium text-orange-900">{lang.language}</p>
                        <p className="text-sm text-gray-600">{lang.level}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Social & Online Presence Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Social & Online Presence
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Social Media Links */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Social Media</h3>
                  <div className="space-y-3">
                    {user?.socialMediaLinks?.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                      >
                        <span className="capitalize">{link.platform || link.customPlatform}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Online Portfolios */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Online Portfolios</h3>
                  <div className="space-y-3">
                    {user?.onlinePortfolios?.map((portfolio, index) => (
                      <a
                        key={index}
                        href={portfolio.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                      >
                        <span>{portfolio.title}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Events & Collaborations Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Events & Collaborations
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Events Participation */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Events Participation</h3>
                  <div className="space-y-4">
                    {user?.eventsParticipation?.map((event, index) => (
                      <div key={index} className="bg-orange-50 rounded-lg p-3">
                        <p className="font-medium text-orange-900">{event.name}</p>
                        <p className="text-sm text-gray-600">{event.role}</p>
                        <p className="text-sm text-gray-600">{event.location}</p>
                        <p className="text-sm text-gray-600">{event.date}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collaborations */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Collaborations</h3>
                  <div className="space-y-4">
                    {user?.collaborations?.map((collab, index) => (
                      <div key={index} className="bg-orange-50 rounded-lg p-3">
                        <p className="font-medium text-orange-900">{collab.project}</p>
                        <p className="text-sm text-gray-600">with {collab.partner}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sessions Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Sessions
                {!isLoadingSessions && sessions.length > 0 && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium ml-2">
                    {sessions.length}
                  </span>
                )}
                {isLoadingSessions && (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500 ml-2"></div>
                )}
              </p>
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : !sessions || sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Yet</h3>
                  <p className="text-gray-500 max-w-sm">This user hasn't joined any sessions yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map((session, index) => (
                    <div key={`user-sess-${index}`} className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <div className="flex flex-col gap-3">
                        {session.bannerImgs && session.bannerImgs.length > 0 && (
                          <img
                            src={session.bannerImgs[0] || "/placeholder.svg"}
                            alt={session.title}
                            className="w-full h-32 object-cover rounded-t-lg"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-orange-900 text-lg mb-2">{session.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{session.desc}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                              {session.sessionType}
                            </span>
                            {session.isCourse && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Course</span>
                            )}
                            {session.isExclusive && (
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Exclusive</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Communities Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75"
                  />
                </svg>
                Communities
                {!isLoadingCommunities && communities.length > 0 && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium ml-2">
                    {communities.length}
                  </span>
                )}
                {isLoadingCommunities && (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500 ml-2"></div>
                )}
              </p>
              {isLoadingCommunities ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : !communities || communities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Communities Yet</h3>
                  <p className="text-gray-500 max-w-sm">This user hasn't joined any communities yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {communities.map((community, index) => (
                    <div key={`user-comm-${index}`} className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <div className="flex flex-col gap-3">
                        {community.bannerImg && (
                          <div className="relative w-full h-32 rounded-lg overflow-hidden">
                            <Image
                              src={community.bannerImg || "/placeholder.svg"}
                              alt={community.title}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-lg"
                            />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-orange-900 text-lg mb-2">{community.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{community.desc}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                {community.category}
                              </span>
                              {community.visibility && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  {community.visibility}
                                </span>
                              )}
                            </div>
                            {community.price > 0 && (
                              <span className="text-sm font-semibold text-orange-600">₹{community.price}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Answers Section */}
            {userDetails && userDetails.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                  <svg
                    className="w-5 h-5 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Answers
                </p>
                <div className="grid gap-4">
                  {userDetails?.map((item, index) => (
                    <div key={`answer-${index}`} className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-orange-900 mb-2">Q: {item?.question.question}</p>
                      <p className="text-sm text-gray-700">A: {item?.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

export default User








