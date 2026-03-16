import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { MdShoppingCart } from 'react-icons/md';
import { useSelector } from 'react-redux';
import { selectUser, selectUserCart } from 'store/features/userSlice';

// Add onClick action to the cart button
const CartButton = () => {

    const cart=useSelector(selectUserCart);
    const user=useSelector(selectUser);
    const router=useRouter();
    const [isVisible, setIsVisible] = useState(false);
    function pushVisbility(value){
        setIsVisible(value);
    }
   useEffect(()=>{
    if(!user){
        pushVisbility(false);
        return;
    }
    if(cart && cart.length>0){
        pushVisbility(true);
    }else if((cart && cart.length===0)){
        pushVisbility(false);
    }
   },[router.asPath,cart])

   useEffect(()=>{
    if(router.asPath==="/checkout" || router.asPath==="/"){
        pushVisbility(false);
    }
   },[router.asPath])
   function handleClick(){
        if(isVisible){
            router.push('/checkout');
        }
   }
    return (
        <button
            className={`fixed top-1/2 right-4 p-2 bg-pink-500 rounded-full transition-opacity duration-300 text-white ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            disabled={isVisible !== null ? !isVisible : false}
            onClick={handleClick}
            >
            <MdShoppingCart />
        </button>
    );
};

export default CartButton;
