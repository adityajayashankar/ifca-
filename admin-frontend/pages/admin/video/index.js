import Card from '@/components/common/Card';
import VideoCard from '@/components/video/VideoCard';
import { selectAllVideos, setAllVideos } from '@/store/features/videoSlice';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

function VideoPage(props) {
    const videos=useSelector(selectAllVideos);
    const router=useRouter();
    const [take,setTake]=useState(4)
    const [skip,setSkip]=useState(0)

    const dispatch=useDispatch();

    useEffect(() => {
        dispatch(setAllVideos())
    }, []);
    

    
    return (
        <div
            className='min-h-screen w-full'>
            <section className='text-center py-10 max-w-7xl mx-auto'>
                    <div className='input__group__header'>
                        <h2>Video</h2>
                        <button
                            className='button button-blue'
                            onClick={() => router.push('/admin/video/create')}>
                            + Video
                        </button>
                    </div>
                
                <div className='px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto gap-6 my-10 py-10 max-w-7xl'>
                    {videos?.map((session, index) => {
                        return (
                            <VideoCard video={session} key={'video-' + index} baseURL={'admin'}/>
                        );
                    })}
                    {
                        (!videos || videos.length===0 ) && <div>No videos to display</div>
                    }
                </div>
            
            </section>
        </div>
    );
}

export default VideoPage;
