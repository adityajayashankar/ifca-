import React from 'react'
import CreateExpertForm from '@/components/expert/CreateExpertForm'
import { useRouter } from 'next/router'
import api from '@/utils/apiSetup';
import { toast } from 'react-toastify';
const EditExpert = () => {
  const router=useRouter();
  const id=router.query['expertId'];
  const handleDeleteExpert=(e)=>{
    e.preventDefault();
    const returnStr=prompt("Sure You wanna delete? Enter YES in caps")
    if(returnStr==="YES"){
      api.delete(`/expert/${id}`)
      .then((res)=>{
        if(res.data){
          toast('Sorry to see an expert go <>')
          router.replace('/admin/expert')
        }
      })
    }else{
      toast('Did not delete!')
    }
  }

  return (
    <div className='page flex flex-col gap-6 items-center'>
        <h1>Edit Expert</h1>
        <hr/>
        <button className="btn btn-red self-start md:ml-20" onClick={handleDeleteExpert}>Delete Expert</button>
        {/* Provision to upload CSV */}
        <CreateExpertForm isEdit={true} baseURL={'partner'}/>
    </div>
  )
}

export default EditExpert