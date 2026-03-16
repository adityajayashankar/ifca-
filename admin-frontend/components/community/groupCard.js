import { setGroupUsers, setSelectedGroup } from '@/store/features/subCommunitySlice';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { setCommunitySessions, setCommunityUsers, setSelectedCommunity } from 'store/features/communitySlice';

function GroupCard({ category,baseURL }) {
    const dispatch=useDispatch();
    const router=useRouter();
    const handleSelection=(e)=>{
        e.preventDefault();
        dispatch(setSelectedGroup(category))
        dispatch(setGroupUsers(category.id))
        router.push(`/${baseURL}/community/group/${category.id}`);
    }
    return (
        
            <div className='category__card' onClick={handleSelection}>
                <div className='category__card__image'>
                    <img
                        src={ category?.photoURL || "https://loremflickr.com/1080/720"}
                        // alt={category.title}
                        layout='fill'
                        objectFit='cover'
                    />
                </div>
                <div className='category__card__body'>
                    <h3 className='category__card__body__title'>
                        {category.name}
                    </h3>
                    <p className='category__card__body__desc'>
                        {category.desc}
                    </p>
                </div>
            </div>
        
    );
}

export default GroupCard;
