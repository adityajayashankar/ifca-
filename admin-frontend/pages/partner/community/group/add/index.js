import React from 'react'
import CreateCommunityForm from '@/components/community/CreateCommunityForm'
import SubscriptionForm from '@/components/community/SubscribeCommunity'
import { useSelector } from 'react-redux'
import { selectCommunity } from '@/store/features/communitySlice'
import CreateSubCommunityForm from '@/components/community/SubCommunityForm'
const CreateSubCommunity = () => {
    const community=useSelector(selectCommunity);

  return (
    <div className='page flex flex-col gap-6 items-center'>
        <h1>Create Group</h1>
        <hr/>
        {/* Provision to upload CSV */}
        <CreateSubCommunityForm baseURL={'partner'}/>
    </div>
  )
}

export default CreateSubCommunity