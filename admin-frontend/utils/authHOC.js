// will receive child component  parameter
// child component is the protected component
import { useSelector } from "react-redux";
import { selectUser } from "store/features/userSlice";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
export const Protected=({children})=>{
    const user=useSelector(selectUser);
    const [isToken,setToken]=useState(null);
    const router=useRouter();
    
    useEffect(()=>{
        function loadUser(){
            setToken(localStorage.getItem('senior-central-access-token'));
        }
        loadUser();
    },[]);

    useEffect(()=>{
        if(!user || !isToken){
            router.push('/auth');
        }
    },[user,isToken])
    


    
        return children;
    

}