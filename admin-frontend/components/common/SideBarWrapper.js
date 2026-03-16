import React, { useState } from 'react'
import { AiOutlineArrowRight, AiOutlineArrowLeft } from "react-icons/ai"
import { BsFillArrowRightCircleFill, BsFillArrowLeftCircleFill } from "react-icons/bs"

function SidebarWrapper({ children, open, setOpen, show=true }) {

  return (
    <div className='flex md:hidden sticky z-10'>
      {show && <BsFillArrowRightCircleFill className='text-2xl ml-3 mb-3 font-bold cursor-pointer' onClick={() => { setOpen(!open) }} />}
      {
        open && (
          <div className='flex flex-col w-[90vw] bg-white z-10 left-0 overflow-y-auto  border-solid border-white h-screen absolute space-y-3 p-3 shadow-2xl'>
            <BsFillArrowLeftCircleFill className='right-0 absolute text-2xl cursor-pointer m-3 top-0 bg-white rounded-full' onClick={() => { setOpen(!open) }} />
            {children}
          </div>
        )
      }
    </div>
  )
}

export default SidebarWrapper