import React from 'react'
import CreateCommunityForm from '@/components/community/CreateCommunityForm'
import SubscriptionForm from '@/components/community/SubscribeCommunity'
import { useSelector } from 'react-redux'
import { selectCommunity } from '@/store/features/communitySlice'
const SubscribeCommunity = () => {
    const community=useSelector(selectCommunity);

  return (
    <div className='page flex flex-col gap-6 items-center'>
        <h1>Create Community Subscription</h1>
        <hr/>
        {/* Provision to upload CSV */}
        <SubscriptionForm baseURL={'expert'} community={community} amount={community.price}/>
    </div>
  )
}

export default SubscribeCommunity