import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useRouter } from 'next/router';
import ComThreadLayout from "@/components/comThreadLayout";
import { selectAllCommunities } from '@/store/features/communitySlice';
import { useSelector } from 'react-redux';


const ComThreads = ({ blogId, sessionId, replyPostId }) => {
  const router = useRouter();
  const { id } = router.query;
  const allCommunities = useSelector(selectAllCommunities)

  const thisCommunity = allCommunities?.filter((com)=>com.id === parseInt(id))
  return (
    <>
     {/* Breadcrumbs */}
     <div className="bg-white border-b border-gray-200 mb-4  max-h-[100vh-160px] overflow-y-auto scrollbar-hide ">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <Link href="/" underline="none" sx={{ display: 'flex', alignItems: 'center', color: 'orange.700', fontWeight: 500 }}>
            <HomeIcon className="cursor-pointer text-gray-500" sx={{ fontSize: 18, mr: 0.5}} />
          </Link>
          <NavigateNextIcon sx={{ fontSize: 18, color: 'orange.300' , maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} />
          <Link href="/community" underline="hover" className="cursor-pointer max-w-[200px] truncate text-gray-500" sx={{ color: 'orange.700', fontWeight: 500 }}>
            Communities
          </Link>
          <NavigateNextIcon sx={{ fontSize: 18, color: 'orange.300' , maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} />
          <Link href={`/admin/community/${id}`} underline="hover" className="cursor-pointer max-w-[200px] truncate text-gray-500" sx={{ color: 'orange.700', fontWeight: 500 }}>
            Community view
          </Link>
          <NavigateNextIcon sx={{ fontSize: 18, color: 'orange.300' }} />
          <span className=" font-semibold max-w-[200px] truncate">{thisCommunity[0]?.title}</span>
          <NavigateNextIcon sx={{ fontSize: 18, color: 'orange.300' }} />
          <span className=" font-semibold">Polls</span>
        </div>
      </div>
    <ComThreadLayout
      blogId={blogId}
      sessionId={sessionId}
      replyPostId={replyPostId}
      isPoll
    />
    </>
  );
};

export default ComThreads;
