import React,{useState} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { selectCommunity, selectCommunitySessions, selectCommunityUsers, selectusers, setCommunities } from '@/store/features/communitySlice';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { selectSubcommunities } from '@/store/features/subCommunitySlice';
import {  FcInvite} from "react-icons/fc";
import {BsFillChatDotsFill  } from "react-icons/bs";
import GroupCard from '@/components/community/groupCard';
import Person from '@/components/common/Person';
const CommunityPage = () => {
    const community2=useSelector(selectCommunity);
    const [creatorName,setCreatorName]=useState('Bhaskar');
    const sessions=useSelector(selectCommunitySessions);
    const users=useSelector(selectCommunityUsers);
    const groups=useSelector(selectSubcommunities);
    const router=useRouter()
    const dispatch=useDispatch();
    const handleRouteChat=(e)=>{
        e.preventDefault();
        router.push(`/expert/community/chat?id=${community2.subscriptionId}`)
      }

  return (
    <div className='min-h-screen max-w-4xl mx-auto px-4 lg:px-0 '>
    <section className="topcontainer relative shadow-sm">
         <div className='imgcontainer'>
             <Image
             src={community2?.bannerImg}
             height={200}
             width={550}
             className="rounded-xl"
             layout='intrinsic'
             objectFit='cover'
             />
       
         </div>
         <h1 className='text-2xl font-semibold p-2 bg-slate-200 rounded-full absolute bottom-0 left-1/12 place-content-end grid'>{community2?.title}</h1>
         
    </section>
    <div className='flex justify-around items-center'>
             <button className='btn btn-pink'>
             <FcInvite/>
             </button>
             <button className='btn btn-pink' onClick={handleRouteChat}>
                 <BsFillChatDotsFill/>
             </button>
         </div>
    <main className='flex flex-col items-center '>
             <p className='small-underline-center font-semibold my-4 text-center'>
                 About
             </p>
         <div className='text-left my-4 max-w-2xl'>
             <p>{community2?.desc}</p>
         </div>
         <p className='small-underline-center font-semibold my-4 text-center'>
                 Experts
             </p>
         
         <div className='grid mt-4 grid-cols-3'>
             {
                 users?.filter((item)=>item.expertId>0).map((item,index)=>(<Person name={item.name} desc={item.desc} photoURL={item.photoURL}/>))
             }
          
         </div>
         <p className='small-underline-center font-semibold my-4 text-center'>
                 People
             </p>
         <p>We are a community of 200 individuals</p>
         <div className='grid mt-4 grid-cols-3 '>
             {
                 users?.slice(0,10).filter((item)=>item.expertId===null).map((item,index)=>(<Person name={item.name} desc={item.desc} photoURL={item.photoURL}/>))
             }

         </div>
         <p className='small-underline-center font-semibold my-4 text-center'>
                 Groups
         </p>
         
         <div className='grid grid-cols-3 gap-8 w-full my-8'>
             {
                 groups?.slice(0,4).map((item,index)=><GroupCard category={item} key={index} baseURL={'expert'}/>)
             }
             {
                 (!groups || groups.length===0) && <p> No Groups to display</p>
             }
         </div>

         <p className='my-8'><b>{"TIP:"}</b>View community in chat window for more features</p>
    </main>
    
 </div>
  )
}

export default CommunityPage



