import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CreateSessionForm from '@/components/session/CreateSessionForm';
import api from '@/utils/apiSetup';
import { clearForm, initSession, selectSession } from 'store/features/createSessionSlice';
import { oneSession } from '@/store/features/session';
import { setResourcesSession } from '@/store/features/resourceSlice';

function EditSession() {
    const router = useRouter();
    const user = useSelector((state) => state.user.user);
    const dispatch=useDispatch();
    const selectedSession=useSelector(oneSession);
    


    useEffect(()=>{
        //getSessionDetails();
        let temp={
            title:'this is title',
            desc:'this is desc',
            bannerImgs:[],
            infoImgs:[],
            SessionSlot:[{
                credits:2,
                discountTiers:[],
                endTime:"2022-06-23T17:45",
                id:1,
                isOnline:false,
                location:"Bangalore",
                participantLimit:100,
                price:1998,
                speakerIds:[],
                startTime:"2022-06-23T16:45"
            }],
            creatorId:2          
        }
        dispatch(clearForm());
        dispatch(initSession(selectedSession));
        dispatch(setResourcesSession(parseInt(window.location.pathname.split("/")[4])))
        // console.log(session)
    },[]);

    return (
        <div className='page flex flex-col gap-6 items-center'>
            <h1 className='text-center'>Edit Session</h1>
          <CreateSessionForm isEdit={true} id={parseInt(router.query['id'])}/>         
        </div>
    );
}

export default EditSession;
