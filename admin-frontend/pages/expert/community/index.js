import CategoryCard from '@/components/community/categorycard';
import { selectAllCommunities, setCommunities, setExpertCommunitiesGeneric, setPartnerCommunities } from '@/store/features/communitySlice';
import { selectUser } from '@/store/features/userSlice';
import { useRouter } from 'next/router';
import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';

const CommunityPage = () => {
  const communities=useSelector(selectAllCommunities);
  const user=useSelector(selectUser);
  const dispatch=useDispatch();
  const router=useRouter()
  useEffect(()=>{
      dispatch(setExpertCommunitiesGeneric(user.unifiedUser.id))
  },[])
  return(<div
        className='min-h-screen w-full px-[10px]'>
        <section className='text-center py-10 max-w-7xl mx-auto'>
                <div className='input__group__header'>
                    <h2>Community</h2>
                    
                </div>
            
                <div className='px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto gap-6 my-10 py-10 max-w-7xl'>
                {communities?.map((category, index) => {
                    return <CategoryCard
                        category={category}
                        baseURL={'expert'}
                        key={'category' + index}
                    />
                })}
                {
                  (!communities || communities.length===0) && <p>No communities yet</p>
                }
            </div>
        </section>
    </div>
);
}

export default CommunityPage