import { setResourcesCommunity } from '@/store/features/resourceSlice';
import { setCommunityGroups } from '@/store/features/subCommunitySlice';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { setCommunitySessions, setCommunityUsers, setSelectedCommunity} from 'store/features/communitySlice';
import { Groups, People } from '@mui/icons-material';

function CategoryCard({ category, baseURL }) {
    const dispatch = useDispatch();
    const router = useRouter();
    const handleSelection = (e) => {
        e.preventDefault();
        dispatch(setSelectedCommunity(category));
        dispatch(setCommunitySessions(category.id));
        dispatch(setCommunityUsers(category.id));
        dispatch(setCommunityGroups(category.id));
        dispatch(setResourcesCommunity(category.id));
        router.push(`/${baseURL}/community/${category.id}`);
    };
    return (
        <div
            className="w-[280px] md:w-[320px] shrink-0 cursor-pointer h-auto"
            onClick={handleSelection}
        >
            {/* Parent usage: <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> ... </div> */}
            <div className="bg-white hover:bg-gray-50/50 transition-all duration-300 rounded-3xl border-2 border-gray-200 hover:border-orange-500 hover:shadow-xl overflow-hidden group h-auto">
                {/* Banner Image with Overlay */}
                <div className="relative w-full h-[180px] overflow-hidden">
                    {/* Background blur layer */}
                    <div
                        className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-70"
                        style={{ backgroundImage: `url(${category?.bannerImg || "/communityCardImg.svg"})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                    {/* Main image */}
                    <div className="relative h-full w-full z-10">
                        <Image
                            src={category?.bannerImg || "/communityCardImg.svg"}
                            alt={category?.title}
                            layout="fill"
                            objectFit="contain"
                            className="transition-transform duration-700 group-hover:scale-110"
                        />
                    </div>
                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
                        {/* Community Badge */}
                        <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 backdrop-blur-sm border border-white/20 shadow-lg">
                            <Groups className="h-3.5 w-3.5 text-orange-500" />
                            <span className="text-[10px] font-semibold text-gray-800">Community</span>
                        </div>
                        {/* Price Badge (optional, can be added if needed) */}
                    </div>
                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
                        <span className="text-lg font-bold text-white mb-1 line-clamp-1">
                            {category?.title}
                        </span>
                    </div>
                </div>
                {/* Bottom Section */}
                <div className="px-4 pt-2 pb-3 bg-white flex flex-col gap-2">
                    {/* Description */}
                    <div className="pt-2">
                        <span className="text-gray-600 text-xs leading-relaxed line-clamp-2 h-10">
                            {category?.desc}
                        </span>
                    </div>
                    {/* Member Count Chip */}
                    {/* <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="flex items-center gap-1 bg-orange-50 text-orange-600 text-[10px] font-medium h-5 px-2 rounded-full">
                            <People className="h-3 w-3 text-orange-500" />
                            {(category?.subscriptions?.length || category?.subscriptionTrue?.length || 0)} Members
                        </span>
                    </div> */}
                </div>
            </div>
        </div>
    );
}

export default CategoryCard;
