import { selectOneTicket, setAllTickets } from '@/store/features/ticket'
import api from '@/utils/apiSetup';
import { useRouter } from 'next/router';
import React, { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify';

const OneTicketPage = () => {
     const ticketInfo=useSelector(selectOneTicket);
     const formRef=useRef()
     const dispatch=useDispatch();
     const router=useRouter();
     const resolveTicket=async(ticketId)=>{
        let res=await api.patch(`/ticket/${ticketId}`,{isResolved:!ticketInfo.isResolved})
        if(res.data){
          toast(`Resolved ticket!`,{type:"success"});
          dispatch(setAllTickets());

        }
      }
    
    const deleteTicket=async(ticketId)=>{
        let res=await api.delete(`/ticket/${ticketId}`)
        if(res.data){
          toast(`Deleted ticket!`,{type:"success"});
          dispatch(setAllTickets());
        }
      }
     const handleResolve=(e)=>{
        e.preventDefault()
        resolveTicket(ticketInfo.id)
        router.replace(`/admin/ticket`);
     }
     const handleDeleteTicket=(e)=>{
        e.preventDefault()
        deleteTicket(ticketInfo.id)
        router.replace(`/admin/ticket`);
     }
     const handleGoBack=(e)=>{
        e.preventDefault();
        router.replace(`/admin/ticket`);
     }
     
  return (
    <div className='page flex flex-col gap-6 items-center'>
    <h1>Ticket</h1>
    <hr/>
    {/* Provision to upload CSV */}
    {/* <CreateExpertForm/> */}

    <div className='createsessionform__container'>
        
        <form
            className='createsessionform__form'
            method='POST'
            ref={formRef}
            >
            
            <div className='input__group'>
                    

                    <label htmlFor='name' className='label'>
                        <span className='label__text'>User Name</span>
                        <input
                            type='text'
                            id='name'
                            name='name'
                            className='input'
                            
                            defaultValue={ticketInfo.raisedBy.name}
                            readOnly
                        />
                    </label>
                    <label htmlFor='email' className='label'>
                        <span className='label__text'>User Email</span>
                        <input
                            type='text'
                            id='email'
                            name='email'
                            className='input'
                            
                            readOnly
                            defaultValue={ticketInfo.raisedBy.email}
                            
                        />
                    </label>
                   
                   
                    <label htmlFor='desc' className='label'>
                        <span className='label__text'>Description</span>
                        <textarea
                            id='desc'
                            name='desc'
                            className='input'
                            defaultValue={ticketInfo.content}
                            readOnly
                            
                        />
                    </label>
                    <label htmlFor='phone' className='label'>
                        <span className='label__text'>Domain</span>
                        <input
                            type='text'
                            id='phone'
                            name='phone'
                            className='input'
                            defaultValue={ticketInfo.domain}
                            readOnly
                        />
                    </label>
                    
                    
                    
            </div>
                     <div className='flex flex-row flex-wrap gap-2' type='submit'>
                    
                        <button className='button button-blue flex-1' onClick={handleResolve}>
                            {ticketInfo.isResolved?"Unresolve":"Resolve"}
                        </button>

                        <button
                            className='button button-blue flex-1'
                            onClick={handleDeleteTicket}>
                            Delete Ticket
                        </button>
                        <button className='button button-blue flex-1' onClick={handleGoBack}>
                            {"Back"}
                        </button>
                    </div>  
                
        </form>
    </div>
    </div>
  )
}

export default OneTicketPage