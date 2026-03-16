import React from 'react'
import { HiArrowCircleLeft ,HiArrowCircleRight} from "react-icons/hi";
const Paginator = ({handleTakeChange,skip,take,total,tag,handleFetchNext}) => {
  return (
    <div className='my-4'>
                    <div className='flex text-md text-gray-400 items-center'>
                        <label>
                            <b>Show </b>
                        <select onChange={handleTakeChange}>
                            <option value={4}>{`4 ${tag}`}</option>
                            <option value={8}>{`8 ${tag}`}</option>
                        </select>
                        </label>

                        <HiArrowCircleLeft className={`text-2xl cursor-pointer ${skip!==0?'text-pink-200':'text-gray-400'}`} onClick={()=>handleFetchNext({newTake:take,newSkip:skip-take})}/>
                        <HiArrowCircleRight className={`text-2xl cursor-pointer ${skip+take<total?'text-pink-200':'text-gray-400'}`} onClick={()=>handleFetchNext({newTake:take,newSkip:skip+take})}/>
                        
                    </div>
                </div>
  )
}

export default Paginator