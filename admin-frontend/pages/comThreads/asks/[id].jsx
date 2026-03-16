import ComThreadLayout from "@/components/comThreadLayout";
import Link from '@mui/material/Link';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useRouter } from 'next/router';
import { selectAllCommunities } from '@/store/features/communitySlice';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

const ComThreads = ({ blogId, sessionId, replyPostId }) => {
  const router = useRouter();
  const { id } = router.query;
  const allCommunities = useSelector(selectAllCommunities);
  const [thisCommunity, setThisCommunity] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    
    const pathParts = router.asPath.split('/');
    const communityId = pathParts[pathParts.length - 1];
    
    if (communityId && allCommunities.length > 0) {
      const found = allCommunities.find((com) => com.id === parseInt(communityId));
      setThisCommunity(found);
    }
  }, [router.isReady, router.asPath, allCommunities]);

  // Get community ID properly
  const getCommunityId = () => {
    if (!router.isReady) return null;
    const pathParts = router.asPath.split('/');
    return parseInt(pathParts[pathParts.length - 1]);
  };

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 mb-4 max-h-[100vh-160px] overflow-y-auto scrollbar-hide">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <Link href="/" underline="none" sx={{ display: 'flex', alignItems: 'center', color: 'orange.700', fontWeight: 500 }}>
            <HomeIcon sx={{ fontSize: 18, mr: 0.5 }} />
          </Link>
          <NavigateNextIcon sx={{ fontSize: 18, color: 'orange.300' }} />
          <Link href="/community" underline="hover" sx={{ color: 'orange.700', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Communities
          </Link>
          <NavigateNextIcon sx={{ fontSize: 18, color: 'orange.300' }} />
          <Link href={`/admin/community/${id}`} underline="hover" sx={{ color: 'orange.700', fontWeight: 500 }} className="cursor-pointer max-w-[200px] truncate">
            Community edit
          </Link>
          <NavigateNextIcon sx={{ fontSize: 18, color: 'orange.300' }} />
          <span className="text-orange-900 font-semibold max-w-[200px] truncate">{thisCommunity?.title || '...'}</span>
          <NavigateNextIcon sx={{ fontSize: 18, color: 'orange.300' }} />
          <span className="text-orange-900 font-semibold">Asks</span>
        </div>
      </div>
      <ComThreadLayout
        blogId={blogId}
        sessionId={sessionId}
        replyPostId={replyPostId}
        communityId={getCommunityId()}
        isAsk
      />
    </>
  );
};

export default ComThreads;
