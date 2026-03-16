// will receive child component  parameter
// child component is the protected component
import { useDispatch, useSelector } from "react-redux";
import { selectUser, setNextPage } from "store/features/userSlice";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "./apiSetup";
export const Protected=({children})=>{
    const user=useSelector(selectUser);
    const dispatch=useDispatch();
    const router=useRouter();
   

    useEffect(()=>{
        if(!user || !api.defaults.headers.authorization){

            

                if(!api.defaults.headers.authorization){
                    api.defaults.headers.authorization=localStorage.getItem('ifca-jwt')
                }

                if(api.defaults.headers.authorization && user){
                    return;
                }
                dispatch(setNextPage(router.asPath));
                router.push('/onBoard');
            
        }
    },[user])
    


    
        return children;
    

}