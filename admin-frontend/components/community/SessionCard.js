import Image from 'next/image';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { setSelectedSessionById } from '@/store/features/sessionSlice';

const SessionCard = ({session,status,baseURL}) => {
    

    const router=useRouter();
    const dispatch=useDispatch();
   let speakers=[
        {
            id:1,
            name:'Ramesh'
        },
        {
            id:2,
            name:'Umesh'
        },
        {
            id:3,
            name:'Mahesh'
        },
        {
            id:4,
            name:'Harish'
        }
    ]
    const handleSessionSelection=()=>{
        dispatch(setSelectedSessionById(session.id));
        router.push(`/${baseURL}/session/${session.id}`);    
    }
    return (
        <div className='scard'>
           { status && <div className='scard__header'>
                <Image
                    src='/assets/images/image2.jpg'
                    alt='card image'
                    layout='fill'
                />
            </div>
}
            <div className='scard__body'>
                <p className='font-bold line-clamp-1'>{session.title}</p>
                <p className='text-sm line-clamp-2'>{session.desc}</p>

                <p className='font-bold line-clamp-1 mt-2'>{"Speakers:"}</p>

                <div className='flex flex-row flex-wrap gap-4 py-4'>
                            {speakers.map((speaker, index) => (
                                <div
                                    className={`flex flex-col gap-1 items-center p-2 border rounded-lg hover:cursor-pointer`} key={`speaker-${index}`}>
                                    <p
                                        className={`text-sm font-semibold
                                            'text-orange-500'
                                       `}>
                                        {speaker.name}
                                    </p>
                                </div>
                            ))}
                </div>
            </div>
            <div className='scard__footer'>
                { <div className='flex flex-row w-full justify-between'>
                   <p className='text-sm text-[#4E795E80] font-bold'>
                        Time :
                        {
                             new Date(
                                  session.startTime
                              ).toLocaleTimeString()
                            }
                    </p>
                    <p className='text-sm text-[#4E795E80] font-bold'>
                        Date :
                        {new Date(
                                  session.startTime
                              ).toLocaleDateString()
                        }
                    </p>
                </div>
                }
                {/* <Link href={`/session/${session.id}`} passHref> */}
                <p>Price:<em className="line-through">{session.marked_price}</em>{`   ${session.selling_price}`}</p>
                 <button className={`btn btn-blue w-full`} onClick={handleSessionSelection}>{"Join"}</button>
                {/* </Link> */}
            </div>
        </div>
    );
};

export default SessionCard;
