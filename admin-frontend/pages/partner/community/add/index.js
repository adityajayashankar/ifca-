import React from 'react'
import CreateCommunityForm from '@/components/community/CreateCommunityForm'
import { MdChevronRight, MdHome, MdGroups, MdAdd } from 'react-icons/md';
import { useRouter } from 'next/router';

const CreateCommunity = () => {
  const router = useRouter();
  return (
    <div className='min-h-screen w-full bg-gray-50 flex flex-col'>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 py-3 flex items-center space-x-2 text-sm">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="hover:text-orange-600 cursor-pointer" onClick={() => router.push('/admin/community')}>Communities</span>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-semibold">Create Community</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center w-full px-4 py-8 overflow-auto">
        <div className="mb-10 flex flex-col items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight flex items-center gap-3">
            <MdAdd className="text-orange-500 text-5xl" />
            Create Community
          </h1>
          <p className="text-lg text-gray-500 font-medium">Fill in the details below to create your community</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-0  w-full overflow-auto">
          <CreateCommunityForm baseURL={'partner'}/>
        </div>
      </div>
    </div>
  )
}

export default CreateCommunity