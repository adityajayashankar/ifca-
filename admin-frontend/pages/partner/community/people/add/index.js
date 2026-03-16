import React, { useEffect, useRef, useState} from 'react'
import {unparse,parse} from 'papaparse'
import { useRouter } from 'next/router'
import api from '@/utils/apiSetup'
import { toast } from 'react-toastify'
const AddPeople = () => {
    const [uploadStatus,setUploadStatus]=useState({success:false,error:null})
    const [users,setUsers]=useState([])
    const [createdUsers,setCreatedUsers]=useState([])
    const router=useRouter()
    const handleClearForm=(e)=>{
        e.preventDefault();
        setUploadStatus({success:false,error:null});
    }
    const handleGoBack=(e)=>{
        e.preventDefault();
        router.replace(`/partner/people`)
    }
    const handleSubmit=(e)=>{
        e.preventDefault();
        api.post(`/admin/create/user`,{users})
        .then((res)=>{
            if(res.data){
                if(res.data.users){
                    setCreatedUsers(res.data.users)
                }else{
                    toast(`Oops! Something went wrong`,{type:"warning"})
                }
            }
        })
    }
    const downloadResultUsers=(e)=>{
        e.preventDefault();
        let sample=createdUsers
        const sample_csv=unparse(sample);
        const sample_csv_blob=new Blob([sample_csv],{type: 'text/csv;charset=utf-8;'})
        const element=document.createElement('a');
        element.href=URL.createObjectURL(sample_csv_blob);
        element.download=`result_users.csv`
        document.body.appendChild(element)
        element.click()
    }
    const downloadTemplate=(e)=>{
        e.preventDefault();
        let sample=[{name:"rachel",email:"rachel@friends.xl",phone:'9766521519',address:"earth",pincode:"563115"},{name:"harvey",email:"harvey@suits.2xl",phone:'7655678990',address:"earth",pincode:"563115"}]
        const sample_csv=unparse(sample);
        const sample_csv_blob=new Blob([sample_csv],{type: 'text/csv;charset=utf-8;'})
        const element=document.createElement('a');
        element.href=URL.createObjectURL(sample_csv_blob);
        element.download=`sample_users.csv`
        document.body.appendChild(element)
        element.click()
      }

    const handleUpload=(e)=>{
        e.preventDefault();
       setUploadStatus({success:false,error:null})
        parse(e.target.files[0],{
          header:true,
          skipEmptyLines:true,
          complete:(result)=>{
            let expected_keys=["name","email","phone","address","pincode"];
            let keys=result.meta.fields;
            let successD=true;
            expected_keys.every((item)=>{
              if(!keys.find((ele)=>ele===item)){
                toast(`Error uploading;Check file format`,{type:"error"})
                setUploadStatus({success:false,error:"Error uploading;Check file format"})
                successD=false;
                return false;
              }
              return true;
            })
            
            if(successD){
              setUploadStatus({success:true,error:null})
            }
            setUsers(result.data)
          }
        })
    }
  return (
    <div className='page flex flex-col gap-6 items-center'>
        <h1>Add People</h1>
        <hr/>
        {/* Provision to upload CSV */}
        <div className='createsessionform__container'>
        <div className='input__group__header'>
            <p>Add people by CSV form with the format as mentioned in
                the sample file. Password would be automatically generated
                and sent back to you. 
                <b>Dont forget to download result file which contains user credentials</b>
            </p>
        </div>
        <div className='flex w-full items-center justify-evenly my-4'>
                    {!uploadStatus.success?(
                        <label>
                         Upload CSV document
                         <input type={'file'} name="users" onChange={handleUpload} accept=".csv"/>
                         </label>):<button className='btn btn-green'>Successfully uploaded</button>}
                     <button className='btn btn-pink' onClick={downloadTemplate}>
                         Download Sample Doc
                     </button>
        </div>
       {createdUsers.length>0 && <div className='flex items-center justify-center'>
                    <button className='btn btn-pink self-center' onClick={downloadResultUsers}>Download Result File</button>
        </div>}
                    <div className='flex flex-row flex-wrap gap-2 mt-8'>
                    
                        
                  <button className='btn btn-blue' onClick={handleGoBack}>
                     Back
                  </button>
                    <button className='button button-blue flex-1' onClick={handleSubmit}>
                       Add People
                    </button>
                  
                  <button
                      className='button button-blue flex-1'
                      onClick={handleClearForm}>
                      Reset Form
                  </button>
              </div>
        </div>

      
    </div>
  )
}

export default AddPeople