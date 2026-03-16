import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import Person from '@/components/common/Person';

import {BsFillChatDotsFill  } from "react-icons/bs";
import {  MdDelete,MdEdit} from "react-icons/md";
import { selectGroup, selectGroupExperts, selectGroupUsers } from '@/store/features/subCommunitySlice';
import api from '@/utils/apiSetup';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { setCommunities } from '@/store/features/communitySlice';

function GroupIDPage() {

    // const community2=useSelector(selectCommunity);
    const group=useSelector(selectGroup)
    const users=useSelector(selectGroupUsers);
    const experts=useSelector(selectGroupExperts);
    const router=useRouter()
    const dispatch=useDispatch()
    const handleDeleteGroup=(e)=>{
        e.preventDefault();
        let ans=prompt("Sure You wanna delete group? Type YES in caps to confirm. This action is irreversible.");
        if(ans==="YES"){
            api.delete(`/subcommunity/${group.id}`)
            .then((res)=>{
                if(res.data){
                    toast(`Group Deleted`);
                    dispatch(setCommunities());
                    router.replace(`/partner/community`);
                }
            })
        }
    }
    // const [creatorName,setCreatorName]=useState('Bhaskar');
    // const [weeks,setWeeks]=useState([]);

    // initialise to weeks of the present month
    // function getWeeksInMonth(year, month) {
    //     const weeks = [],
    //       firstDate = new Date(year, month, 1),
    //       lastDate = new Date(year, month + 1, 0),
    //       numDays = lastDate.getDate();
      
    //     let dayOfWeekCounter = firstDate.getDay();
      
    //     for (let date = 1; date <= numDays; date++) {
    //       if (dayOfWeekCounter === 0 || weeks.length === 0) {
    //         weeks.push([]);
    //       }
    //       weeks[weeks.length - 1].push(date);
    //       dayOfWeekCounter = (dayOfWeekCounter + 1) % 7;
    //     }
      
    //     return weeks
    //       .filter((w) => !!w.length)
    //       .map((w) => ({
    //         start: w[0],
    //         end: w[w.length - 1],
    //         dates: w,
    //       }));
    //   }
      
    //   function getWeeks(){
    //       const today=new Date();
    //       setWeeks(getWeeksInMonth(today.getFullYear(),today.getMonth()).filter((item)=>item.dates.length===7 && today.getDate()<=item.end));
    //   }

    //   useEffect(()=>{
    //     getWeeks();
    //   },[]);


    // function getName(creatorId){
    //     setOwnSubscription(community2.bought || false);
    //     setCategory(community2.category);
    //     api.get(`/partner/${creatorId}`)
    //     .then((res)=>{
    //         console.log(res.data.partner.name);
    //         setCreatorName(res.data.partner.name);
    //     })
    //     .catch((err)=>{
    //         console.log(`Error while fetching ${creatorId}`);
    //         console.log(err);
    //     })
    
        
    // }

    // useEffect(()=>{
    //                getName(community2.creatorId); 
                   
    // },[])



  
    
    return (
        <>
        <div className='min-h-screen max-w-4xl mx-auto px-4 lg:px-0 '>
           <section className="flex flex-col items-center relative shadow-sm">
                <div className='px-12 h-52'>
                    <Image
                    src={group?.photoURL || "https://loremflickr.com/1080/720"}
                    height={200}
                    width={550}
                    className="rounded-xl"
                    layout='intrinsic'
                    objectFit='cover'
                    />
              
                </div>
                <h1 className='text-2xl font-semibold p-2 bg-slate-200 rounded-full absolute bottom-0 left-1/12 place-content-end grid'>{group.name}</h1>
                
           </section>
           <div className='flex justify-around items-center'>
                    <button className='btn btn-red' onClick={handleDeleteGroup}>
                    <MdDelete/>
                    {/* Delete Group */}
                    </button>
                    <button className='btn btn-pink'>
                    <MdEdit/>   
                    </button>
                 
                </div>
           <main className='flex flex-col items-center my-8 '>
                    <p className='small-underline-center font-semibold my-4 text-center'>
                        About
                    </p>
                <div className='text-left my-4 max-w-2xl'>
                    <p>{group?.desc}</p>
                </div>
                <p className='small-underline-center font-semibold my-4 text-center'>
                        Experts
                </p>
                
                <div className='grid mt-4 grid-cols-3'>
                    {
                        experts.map((item,index)=>(<Person name={item?.subscription?.expert?.name} desc={item?.subscription?.expert?.desc} photoURL={item?.subscription?.expert?.desc}/>))
                    }
                    {
                        (!experts || experts.length===0) &&<div className="justify-center">
                        <h1 className="text-center text-sm font-extralight">No experts yet</h1>    
                    </div> 
                    }
                </div>
                <p className='small-underline-center font-semibold my-4 text-center'>
                        People
                    </p>
                {/* <p>We are a community of 200 individuals</p> */}
                <div className='grid mt-4 grid-cols-3 '>
                    {
                        users.map((item,index)=>(<Person name={item?.subscription?.user?.name} desc={item?.subscription?.user?.desc} photoURL={item?.subscription?.user?.photoURL}/>))
                    }
                 
                </div>
               
           </main>
           
        </div>
        </>
    );
}

export default GroupIDPage;
