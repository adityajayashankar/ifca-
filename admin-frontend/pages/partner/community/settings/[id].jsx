import ComHeading from '@/components/comHeading'
import Layout from '@/components/layout'
import Theme from '@/components/theme'
import Head from 'next/head'
import styles from './settings.module.scss'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { motion } from "framer-motion";
import { useEffect, useState } from 'react';
import React from "react";
import { SketchPicker } from 'react-color';
import api from '@/utils/apiSetup'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { selectCommunity, setCommunityById } from '@/store/features/communitySlice'
import { toast } from 'react-toastify'

const spring = {
    type: "spring",
    stiffness: 700,
    damping: 30
};

const Settings = () => {

  const [isOn, setIsOn] = useState(false);
  const [seeColorOptions, setSeeColorOptions] = useState(-1)
  const [color, setColor] = useState()
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const community = useSelector(selectCommunity)
  const [editMessage, setEditMessage] = useState(community?.welcomeMsg)

  const toggleSwitch = () => setIsOn(!isOn);

  const router = useRouter()

  const dispatch = useDispatch()

  useEffect(() => {
    router.query.id && dispatch(setCommunityById(parseInt(router.query.id)))
  },[ router])

  const handleShowColorOptions = (i) => {
    if(seeColorOptions === i){
        setSeeColorOptions(-1)
    }else{
        setSeeColorOptions(i)
    }
  } 

  const handleUpdateWelcomeMsg = async() => {
    setLoading(true)
    try {
        await api.patch(`/community/${parseInt(router.query.id)}`,{
            welcomeMsg:editMessage
        })
        toast.success("Welcome message successfully edited!!")
        setLoading(false)
        setIsEdit(false)
    } catch (err) {
        toast.error("Oops!! Could not update Welcome message!!")
        setLoading(false)
    }
  }

  return (
    <>
    <Head>
        <title>Settings</title>
    </Head> 
    <Layout background="/t5.svg">
        <div className={styles.settings}>
            <ComHeading />
            <div>
                <h2>Community Welcome Message</h2>
                <div className='flex gap-2 items-center'>
                    {!isEdit ? <p className='w-[80%] font-bold text-gray-600'>{editMessage}</p> : <textarea className='w-[80%] bg-transparent border-gray-500 border-2 rounded-xl outline-none p-2' value={editMessage} onChange={(e) => setEditMessage(e.target.value)}></textarea>}
                    {!isEdit ? <button onClick={() => setIsEdit(true)} className='bg-blue-300 py-2 px-4 rounded-xl text-white w-[20%]'>Edit</button> : <button onClick={handleUpdateWelcomeMsg} className='bg-blue-300 py-2 px-4 rounded-xl text-white w-[20%]'>{loading ? "Updating..." : "Update"}</button>}
                    {isEdit && <button onClick={() => setIsEdit(false)} className='bg-red-600 py-2 px-4 rounded-xl text-white w-[20%]'>Cancel</button>}
                </div>
            </div>
            <div className={styles.btmPart}>
                <div className={styles.topSection}>
                    <h3>Default Themes</h3>
                    <div className={styles.topSectionWrapper}>
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
                <div className={styles.btmSection}>
                    <h2>Upload your own background</h2>
                    <div className={styles.uploadThemeContainer}>
                        <label htmlFor="themeUploader">
                            <ImageOutlinedIcon className={styles.imageIcon} fontSize='inherit' />
                            <h3>Drop Image Here</h3>
                            <p>Supports JPG, PNG</p>
                        </label>
                        <input id="themeUploader" type="file" />
                    </div>
                    <div className={styles.textAdjust}>
                        <span>Text Size</span>
                        <select name="" id="">
                            <option value="maven">Small</option>
                        </select>
                    </div>
                    <div className={styles.textAdjust}>
                        <span>Text Style</span>
                        <select name="" id="">
                            <option value="maven">Maven</option>
                        </select>
                    </div>
                    <div className={styles.themeAdjust}>
                        <div className={styles.leftPart}>
                            <h3>Transparent Sidebar</h3>
                            <p>Make the left navigation panel transparent</p>
                        </div>
                        <div className={styles.rightPart}>
                            <div className={styles.switch} data-ison={isOn} onClick={toggleSwitch}>
                                <motion.div className={styles.handle} layout transition={spring} />
                            </div>
                        </div>
                    </div>
                    <div className={styles.themeAdjust}>
                        <div className={styles.leftPart}>
                            <h3>Text Color</h3>
                            <p>Customize the colors of your text</p>
                        </div>
                        <div className={styles.rightPart}>
                            <div className={styles.colorPick}>
                                <div style={{backgroundColor:"black"}}></div>
                                <img src="/picker.svg" alt="" onClick={()=>handleShowColorOptions(0)} />
                            </div>
                            {seeColorOptions === 0 && <div className={styles.sketchContainer}>
                                <SketchPicker color={color} onChange={(e) => setColor(e)} />
                            </div>}
                        </div>
                    </div>
                    <div className={styles.themeAdjust}>
                        <div className={styles.leftPart}>
                            <h3>Background Color</h3>
                            <p>Customize the colors of your background</p>
                        </div>
                        <div className={styles.rightPart}>
                            <div className={styles.colorPick}>
                                <div style={{backgroundColor:"aqua"}}></div>
                                <img src="/picker.svg" alt="" onClick={()=>handleShowColorOptions(1)} />
                            </div>
                            {seeColorOptions === 1 && <div className={styles.sketchContainer}>
                                <SketchPicker />
                            </div>}
                        </div>
                    </div>
                    <div className={styles.themeAdjust}>
                        <div className={styles.leftPart}>
                            <h3>Panels Color</h3>
                            <p>Customize the colors of your interface</p>
                        </div>
                        <div className={styles.rightPart}>
                            <div className={styles.colorPick}>
                                <div style={{backgroundColor:"white"}}></div>
                                <img src="/picker.svg" alt="" onClick={()=>handleShowColorOptions(2)} />
                            </div>
                            {seeColorOptions === 2 && <div className={styles.sketchContainer}>
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