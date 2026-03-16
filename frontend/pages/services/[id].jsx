import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import OnBoard from "../onBoard";
import api from "@/utils/apiSetup";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { toast } from "react-toastify";

const Service = () => {
  const user = useSelector(selectUser)
  const router = useRouter();
  const { id } = router.query;
  const [service, setService] = useState('')

  useEffect(()=>{
    id && fetchServiceById()
  },[id])

  const fetchServiceById=async ()=>{
    await api.get(`/service/getServiceById/${id}`)
    .then((res)=>{
      setService(res?.data)
    })
    .catch((err)=>{
      console.log('error', err)
    })
  }

  const handleInterested = async(id)=>{
    await api.post('/service/subscribeToService', {
      userId: user?.unifiedUser?.id,
      serviceId: id,
    })
    .then((res)=>{
      toast.success('Successfully Shown Interest')
    })
    .catch((err)=>{
      console.log('err', err)
    })
  }

  return (
    <>
      <Head>
        <title>IFCA-Services</title>
      </Head>
      <div className="flex flex-col min-h-screen">
        <header>
          <Topbar />
        </header>
        <main className="flex-grow overflow-x-hidden my-[50px] md:my-[0px] flex flex-col gap-y-[10px]">
          
        <h1 className="flex justify-center mt-28 text-2xl font-bold">{service.title}</h1>
        <div className="flex flex-col md:flex-row items-start justify-center w-full h-auto p-2">
       
          <div className="w-full md:w-1/2 flex justify-center items-center p-4">
            <img
              src={service.imageUrl}
              alt="Media"
              className="w-full h-[40vh] md:h-[50vh] object-cover rounded-lg shadow-lg"
            />
          </div>

          {(service.videoUrl !== 'null' && service.videoUrl !== "") && <div className="w-full md:w-1/2 flex justify-center items-center p-4">
            <video controls 
            className="w-full h-[40vh] md:h-[50vh] object-cover rounded-lg shadow-lg">
              <source 
              src={service.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>}
        </div>

        <div className="w-full text-center mt-6 px-4">
          <p className="text-lg text-gray-700 mb-4">{service.description}</p>
          {<button
            onClick={()=>handleInterested(service.id)}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition mb-10"
          >
            I'm Interested
          </button>}
        </div>

        </main>
        <footer>
          <Footer />
        </footer>
      </div>
    </>
  );
};

export default Service;
