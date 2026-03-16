import { selectAllTickets, setAllTickets } from '@/store/features/ticket';
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import Table from '@/components/common/Table';
const TicketPage = () => {
    const allTickets=useSelector(selectAllTickets);
    let fetched=false;
    const dispatch=useDispatch();
    useEffect(()=>{
        if(!fetched){
            dispatch(setAllTickets());
            fetched=true;
        }
    },[])

    return (
        <div
        className='min-h-screen w-full'>
        <section className='text-center py-10 max-w-7xl mx-auto'>
                <div className='input__group__header'>
                    <h2>Tickets</h2>
                </div>
            
            <div className='w-full my-12'>
                <Table headers={["sl","Raised By","Content","Domain","Status"]} mode="ticket" data={allTickets}/>
                {
                  (!allTickets || allTickets.length===0) && <p> {"You are safe, no tickets yet!"} </p>
                }
            </div>
        </section>
    </div>
    );
}

export default TicketPage