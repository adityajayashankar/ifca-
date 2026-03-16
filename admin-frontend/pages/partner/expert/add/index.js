import React, { useState } from 'react'
import CreateExpertForm from '@/components/expert/CreateExpertForm'
import CreateExpertBulk from '@/components/expert/CreateExpertBulk'
const CreatExpert = () => {

  const [bulk,setBulk]=useState(0)
  
  return (
    <div className='page flex flex-col gap-6 items-center'>
        <h1>Create Expert</h1>
        <hr/>
        {bulk ===0 && <div className='flex justify-center items-center'>
            <button className='btn btn-pink mx-4' onClick={()=>setBulk(1)}>Bulk create</button>
            <button className='btn btn-blue mx-4' onClick={()=>setBulk(2)}>Individual create</button>
        </div>}
        {/* Provision to upload CSV */}
        {
          (bulk>0) && <>
            {
              (bulk===1)?<CreateExpertBulk baseURL={'partner'}/>:<CreateExpertForm baseURL={'partner'}/>
            }
          </>
        }
    </div>
  )
}

export default CreatExpert