import ComHeading from '@/components/comHeading'
import Layout from '@/components/layout'
import Theme from '@/components/theme'
import Head from 'next/head'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { motion } from "framer-motion";
import { useState } from 'react';
import React from "react";
import { SketchPicker } from 'react-color';

const spring = {
    type: "spring",
    stiffness: 700,
    damping: 30
};

const Settings = () => {

  const [isOn, setIsOn] = useState(false);
  const [seeColorOptions, setSeeColorOptions] = useState(-1)

  const toggleSwitch = () => setIsOn(!isOn);

  const handleShowColorOptions = (i) => {
    if(seeColorOptions === i){
        setSeeColorOptions(-1)
    }else{
        setSeeColorOptions(i)
    }
  } 

  return (
    <>
    <Head>
        <title>Settings</title>
    </Head> 
    <Layout background="/t5.svg">
        <div>
            <ComHeading />
            <div className="bg-[rgba(255, 255, 255, 0.6)] rounded-[10px] py-5 px-10 mt-[50px]">
                <div>
                    <h3 className='text-xl font-semibold'>Default Themes</h3>
                    <div className="flex items-center justify-between flex-wrap gap-5">
                        <Theme themeImg="/t1.svg" />
                        <Theme themeImg="/t2.svg" />
                        <Theme themeImg="/t3.svg" />
                        <Theme themeImg="/t4.svg" />
                        <Theme themeImg="/t5.svg" isActive={true} />
                        <Theme themeImg="/t6.svg" />
                        <Theme themeImg="/t7.svg" />
                        <Theme themeImg="/t8.svg" />
                        <Theme themeImg="/t9.svg" />
                    </div>
                </div>
                <div className="mt-[50px]">
                    <h2 className='font-semibold'>Upload your own background</h2>
                    <div className="bg-[#3554C540] rounded-[10px] flex flex-col items-center justify-center p-10 mb-[50px]">
                    <label htmlFor="themeUploader" className='flex flex-col items-center'>
                            <ImageOutlinedIcon className="text-[56px] text-[#595959]" fontSize='inherit' />
                            <h3 className='m-0 mt-5 mb-[5px]'>Drop Image Here</h3>
                            <p  className='m-0 text-[#595959] font-medium'>Supports JPG, PNG</p>
                        </label>
                        <input id="themeUploader" type="file" className='hidden'/>
                    </div>
                    <div className="flex items-center justify-between text-2xl font-semibold mt-5">
                        <span>Text Size</span>
                        <select name="" id="" className='border-none py-[15px] px-[20px] text[21px] font-semibold rounded-[10px] outline-none'>
                            <option value="maven">Small</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between text-2xl font-semibold mt-5">
                        <span>Text Style</span>
                        <select name="" id="" className='border-none py-[15px] px-[20px] text[21px] font-semibold rounded-[10px] outline-none'>
                            <option value="maven">Maven</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between mt-5">
                        <div>
                            <h3  className='text-2xl font-semibold'>Transparent Sidebar</h3>
                            <p className='font-medium text-[#333]'>Make the left navigation panel transparent</p>
                        </div>
                        <div className="relative">
                            <div className={`w-[75px] h-10 gradient_background flex justify-start rounded-[50px] cursor-pointer p-[2px] ${isOn && "justify-end"}`} onClick={toggleSwitch}>
                                <motion.div className="w-9 h-9 bg-white rounded-[40px]" layout transition={spring} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-5">
                        <div>
                            <h3 className='text-2xl font-semibold'>Text Color</h3>
                            <p className='font-medium text-[#333]'>Customize the colors of your text</p>
                        </div>
                        <div className="relative">
                            <div className="bg-white rounded-[10px] p-[10px] pr-[15px] flex items-center gap-[10px]">
                                <div style={{backgroundColor:"black"}} className='h-[30px] w-[45px] rounded-[5px] border-[1px] border-sol border-black'></div>
                                <img src="/picker.svg" alt="" onClick={()=>handleShowColorOptions(0)} className='cursor-pointer'/>
                            </div>
                            {seeColorOptions === 0 && <div className="absolute top-[50px] z-[999]">
                                <SketchPicker />
                            </div>}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-5">
                        <div>
                            <h3  className='text-2xl font-semibold'>Background Color</h3>
                            <p className='font-medium text-[#333]'>Customize the colors of your background</p>
                        </div>
                        <div className="relative">
                            <div className="bg-white rounded-[10px] p-[10px] pr-[15px] flex items-center gap-[10px]">
                                <div style={{backgroundColor:"aqua"}} className='h-[30px] w-[45px] rounded-[5px] border-[1px] border-sol border-black'></div>
                                <img src="/picker.svg" alt="" onClick={()=>handleShowColorOptions(1)} className='cursor-pointer'/>
                            </div>
                            {seeColorOptions === 1 && <div className="absolute top-[50px] z-[999]">
                                <SketchPicker />
                            </div>}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-5">
                        <div>
                            <h3  className='text-2xl font-semibold'>Panels Color</h3>
                            <p className='font-medium text-[#333]'>Customize the colors of your interface</p>
                        </div>
                        <div className="relative">
                            <div className="bg-white rounded-[10px] p-[10px] pr-[15px] flex items-center gap-[10px]">
                                <div className='bg-white h-[30px] w-[45px] rounded-[5px] border-[1px] border-sol border-black'></div>
                                <img src="/picker.svg" alt="" onClick={()=>handleShowColorOptions(2)} className='cursor-pointer'/>
                            </div>
                            {seeColorOptions === 2 && <div className="absolute top-[50px] z-[999]">
                                <SketchPicker />
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Layout>
    </>
  )
}

export default Settings