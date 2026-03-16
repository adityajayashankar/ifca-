import Table from '@/components/common/Table';
import { selectAllExperts, setAllExperts } from '@/store/features/expert';
import api from '@/utils/apiSetup';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';

const Expert = ({}) => {
  const router=useRouter();
  const allExperts=useSelector(selectAllExperts);
  let fetched=false;
  const dispatch=useDispatch();
  useEffect(()=>{
    // if((!allExperts || allExperts.length===0) && !fetched ){
        dispatch(setAllExperts());
        // fetched=true;
    // }
  },[])
  return (
    <div
        className='min-h-screen w-full px-[10px]'>
        <section className='text-center py-10 max-w-7xl mx-auto'>
                <div className='input__group__header'>
                    <h2>Experts</h2>
                    <button
                        className='button button-blue'
                        onClick={() => router.push('/partner/expert/add')}>
                        + Expert
                    </button>
                </div>
            
            <div className='w-full my-12'>
                {/* Put a table*/}
                <Table headers={["sl","Expert Name","About","Phone","Sessions"]} mode="expert" data={allExperts} baseURL={'partner'}/>
                
                 {/* <Table/> */}
                {
                  (!allExperts || allExperts.length===0) && <p> No Experts Yet</p>
                }
            </div>
        </section>
    </div>
);
}

export default Expert
