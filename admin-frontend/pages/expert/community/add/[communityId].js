 import React from 'react'
import CreateCommunityForm from '@/components/community/CreateCommunityForm'
import { MdChevronRight, MdHome, MdGroups, MdEdit } from 'react-icons/md';
import { useRouter } from 'next/router';

const EditCommunityPage = () => {
  const router = useRouter();
  return (
    <div className='min-h-screen w-full bg-gray-50'>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <button
            onClick={() => router.push('/expert')}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="hover:text-orange-600 cursor-pointer" onClick={() => router.push('/expert/community')}>Communities</span>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-semibold">Edit Community</span>
        </div>
      </div>
      <div className="max-w-[1920px] mx-auto px-4 py-8">
        <div className="mb-10 flex flex-col items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight flex items-center gap-3">
            <MdEdit className="text-orange-500 text-5xl" />
            Edit Community
          </h1>
          <p className="text-lg text-gray-500 font-medium">Update the details below to edit your community</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-0 md:p-10">
          <CreateCommunityForm isEdit={true} baseURL={'expert'}/>
        </div>
      </div>
    </div>
  )
}

export default EditCommunityPage