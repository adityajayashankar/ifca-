import ClassCard from '@/components/classCard'
import Topbar from '@/components/topbar/Topbar'
import { allSessions,  setAllSessions } from '@/store/features/session'
import { selectUser } from '@/store/features/userSlice'
import Head from 'next/head'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const AllSessions = () => {
    const sessions = useSelector(allSessions)
    const searchString = window.location.href.split("?")[1]?.toLowerCase() || "";
    const user = useSelector(selectUser)

    console.log(user)

    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setAllSessions())
    },[])

  return (
    <>
    <Head>
        <title>All Sessions</title>
    </Head> 
    <main className="container overflow-x-hidden flex flex-col gap-y-[75px] mt-[80px]">
        <div className="w-full max-w-[1420px] mx-auto pb-[80px]">
            <div className="flex flex-wrap justify-start mt-[50px] gap-[50px]">
                {sessions?.flat()?.filter((session) => {
                    return session?.title.toLowerCase().includes(searchString)
                }).length > 0 ? (searchString !== "" ? sessions?.flat()?.filter((session) => {
                    return session?.title.toLowerCase().includes(searchString)
                })?.map((item,index)=>(   
                    <ClassCard details={item} key={index} isExpert={user.userType === "expert"} />
                )) : sessions?.flat()?.map((item,index)=>(   
                    <ClassCard details={item} key={index} isExpert={user.userType === "expert"} />
                ))) : (
                    <div className='w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl'>No Sessions available!!</div>
                )}
            </div> 
        </div>
    </main>
    </>
  )
}

export default AllSessions