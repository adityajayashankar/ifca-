import CreateVideoForm from '@/components/video/CreateVideoForm';

function CreateVideo() {
  

    return (
        <div className='page flex flex-col gap-6 items-center'>
            <h1 className='text-center'>Create Video</h1>
            <CreateVideoForm baseURL={'admin'}/>
        </div>
    );
}

export default CreateVideo;
