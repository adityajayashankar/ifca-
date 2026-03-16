// import CategoryCard from '@/components/community/categorycard';
// import { selectAllCommunities, setCommunities, setPartnerCommunities } from '@/store/features/communitySlice';
// import { selectUser } from '@/store/features/userSlice';
// import { useRouter } from 'next/router';
// import React, { useEffect, useRef } from 'react'
// import { useDispatch, useSelector } from 'react-redux';

// const CommunityPage = () => {
//   const communities=useSelector(selectAllCommunities);
//   let user=useSelector(selectUser);
//   let fetchRef=false;
//   const dispatch = useDispatch();
//   const router=useRouter()
//   // useEffect(()=>{
//   //   if(user){
//   //   if(!fetchRef){
//   //     dispatch(setPartnerCommunities(user.unifiedUser?.id))
//   //     fetchRef=true;
//   //   }
//   // }
//   // },[])

//   useEffect(()=>{
//     dispatch(setCommunities())
//   },[])

//   const partnerCommunities = communities?.filter((com)=>com.creatorId===user.unifiedUser?.id)



//   console.log('comminites----', communities)

//   return(<div
//         className='min-h-screen w-full px-[10px]'>
//         <section className='text-center py-10 max-w-7xl mx-auto'>
//                 <div className='input__group__header'>
//                     <h2>Community</h2>
//                     <button
//                         className='button button-blue'
//                         onClick={() => router.push('/partner/community/add')}>
//                         + Community
//                     </button>
//                 </div>
            
//                 <div className='px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto gap-6 my-10 py-10 max-w-7xl'>
//                 {partnerCommunities?.map((category, index) => {
//                     return <CategoryCard
//                         category={category}
//                         baseURL={'partner'}
//                         key={'category' + index}
//                     />
//                 })}
//                 {
//                   (!partnerCommunities || partnerCommunities.length===0) && <p>No communities yet</p>
//                 }
//             </div>
//         </section>
//     </div>
// );
// }

// export default CommunityPage









import CategoryCard from "@/components/community/categorycard"
import { selectAllCommunities, setCommunities } from "@/store/features/communitySlice"
import { selectUser } from "@/store/features/userSlice"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { MdChevronRight, MdHome, MdGroups, MdSort, MdSearch, MdAdd } from "react-icons/md"
import { motion } from "framer-motion"

const Community = () => {
  const communities = useSelector(selectAllCommunities)
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const router = useRouter()
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setFetchError(null)
        await dispatch(setCommunities({ initialcommunity: true }))
        await dispatch(setCommunities({ initialcommunity: false }))
      } catch (error) {
        console.error("Failed to fetch communities:", error)
        setFetchError("Failed to fetch communities. Please try again.")
      }
    }

    fetchCommunities()
  }, [])

  // Filter communities based on current user's creator ID - only show partner communities
  const partnerCommunities = communities?.filter((com) => com.creatorId === user?.unifiedUser?.id) || []

  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("default")
  const [loadingAdd, setLoadingAdd] = useState(false)
  const [activeSection, setActiveSection] = useState("initial")

  // Filter partner communities by section, exclude DEFAULT type, and exclude sub-communities/child communities
  const sectionFiltered = partnerCommunities.filter((c) => {
    // Filter out communities with communityType "DEFAULT"
    if (c?.communityType === "DEFAULT") {
      return false
    }

    // Filter out sub-communities/child communities (only show parent communities)
    if (c?.parentId || c?.parentCommunityId || c?.isSubCommunity || c?.parent_id || c?.parent_community_id) {
      return false
    }

    if (activeSection === "initial") {
      return c?.initialCommunity === true
    } else {
      return c?.initialCommunity === false || c?.initialCommunity === undefined
    }
  })

  let filtered = sectionFiltered.filter((c) => c?.title?.toLowerCase()?.includes(search?.toLowerCase() || ""))

  if (sort === "az") {
    filtered = [...filtered].sort((a, b) => (a?.title || "").localeCompare(b?.title || ""))
  } else if (sort === "za") {
    filtered = [...filtered].sort((a, b) => (b?.title || "").localeCompare(a?.title || ""))
  } else if (sort === "members") {
    filtered = [...filtered].sort(
      (a, b) =>
        (b?.subscriptions?.length || b?.subscriptionTrue?.length || 0) -
        (a?.subscriptions?.length || a?.subscriptionTrue?.length || 0),
    )
  }

  const handleAddCommunity = () => {
    setLoadingAdd(true)
    setTimeout(() => {
      setLoadingAdd(false)
      router?.push("/partner/community/add")
    }, 400)
  }

  const handleSectionChange = (section) => {
    setActiveSection(section)
    setSearch("")
  }

  const retryFetch = () => {
    const fetchCommunities = async () => {
      try {
        setFetchError(null)
        await dispatch(setCommunities({ initialcommunity: true }))
        await dispatch(setCommunities({ initialcommunity: false }))
      } catch (error) {
        console.error("Failed to fetch communities:", error)
        setFetchError("Failed to fetch communities. Please try again.")
      }
    }

    fetchCommunities()
  }

  // Show loading state if user is not loaded yet
  if (!user?.unifiedUser?.id) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your communities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <button
            onClick={() => router?.push("/partner")}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium">My Communities</span>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-6 py-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm px-6 py-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Title and Create Button Row */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <h2 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
                <MdGroups className="text-orange-500 text-3xl" />
                My Communities
              </h2>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-white font-medium transition-colors w-full md:w-auto ${
                  loadingAdd
                    ? "cursor-not-allowed bg-orange-400"
                    : "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600"
                }`}
                disabled={loadingAdd}
                onClick={handleAddCommunity}
                type="button"
              >
                <span className="relative flex items-center justify-center">
                  {loadingAdd ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <MdAdd className="text-lg" />
                      <span>Create Community</span>
                    </>
                  )}
                </span>
              </motion.button>
            </div>

            {/* Section Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleSectionChange("initial")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === "initial"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Initial Communities
                </button>
                <button
                  onClick={() => handleSectionChange("other")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === "other"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Other Communities
                </button>
              </div>

              {/* Search and Sort Controls */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1 sm:max-w-md">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MdSearch className="text-gray-400 text-xl" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Search by community title..."
                    value={search}
                    onChange={(e) => setSearch(e?.target?.value || "")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <MdSort className="text-xl text-gray-400" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e?.target?.value || "default")}
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
                  >
                    <option value="default">Default</option>
                    <option value="az">A-Z</option>
                    <option value="za">Z-A</option>
                    <option value="members">Most Members</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-400 mr-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-red-800 font-medium">{fetchError}</p>
              </div>
              <button
                onClick={retryFetch}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">
              {activeSection === "initial" ? "Initial Communities" : "Other Communities"}
            </h3>
            <span className="text-sm text-gray-500">
              {filtered?.length || 0} {(filtered?.length || 0) === 1 ? "community" : "communities"}
            </span>
          </div>

          <div
            className="grid gap-6 w-full"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            }}
          >
            {filtered?.length > 0 ? (
              filtered.map((category, index) => (
                <CategoryCard key={`category-${category?.id || index}`} category={category} baseURL={"partner"} />
              ))
            ) : (
              <div className="col-span-full w-full">
                <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <MdGroups className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">
                    No {activeSection === "initial" ? "initial" : "other"} communities found
                  </p>
                  <p className="text-gray-400 text-sm">
                    {search
                      ? "Try adjusting your search terms"
                      : `Get started by creating your first ${activeSection === "initial" ? "initial" : "other"} community`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Community
