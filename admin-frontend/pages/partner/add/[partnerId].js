import React from 'react'
import { useRouter } from 'next/router'
import api from '@/utils/apiSetup';
import { toast } from 'react-toastify';
import CreatePartnerForm from '@/components/partner/CreatePartnerForm';
const EditPartner = () => {
  const router=useRouter();
  // const id=router.query['expertId'];

  // const handleDeleteExpert=(e)=>{
  //   e.preventDefault();
  //   const returnStr=prompt("Sure You wanna delete? Enter YES in caps")
  //   const id = window.location.pathname.split('/')[4]
  //   if(returnStr==="YES"){
  //     api.delete(`/partner/${id}`)
  //     .then((res)=>{
  //       if(res.data){
  //         toast('Sorry to see a partner go <>')
  //         router.replace('/admin/partner')
  //       }
  //     })
  //     .catch(err=>console.log(err))
  //   }else{
  //     toast('Did not delete!')
  //   }
  // }

  return (
    <div className='page flex flex-col gap-6 items-center'>
        <h1>Edit Partner</h1>
        <hr/>
        {/* <button className="btn btn-red self-start md:ml-20" onClick={handleDeleteExpert}>Delete Partner</button> */}
        {/* Provision to upload CSV */}
        <CreatePartnerForm isEdit/>
    </div>  
  )
}

export default EditPartner