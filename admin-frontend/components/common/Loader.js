import { useSelector } from 'react-redux'
import { selectLoading } from 'store/features/userSlice'
import { GiCookingPot, GiChefToque, GiKnifeFork } from 'react-icons/gi'

const Loading = () => {
    const loader = useSelector(selectLoading);
    
    // Three cooking-themed icons for the loader
    const cookingIcons = [
        <GiCookingPot key="pot" className="text-orange-600" />,
        <GiChefToque key="chef-hat" className="text-orange-500" />,
        <GiKnifeFork key="utensils" className="text-orange-700" />
    ];
    
    if(loader)
    return (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center'>
            <div className='bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl flex flex-col items-center'>
                <div className='flex justify-center items-center h-24 w-72 mx-auto mb-4 relative'>
                    {cookingIcons.map((icon, index) => (
                        <div 
                            key={index}
                            className='absolute text-5xl'
                            style={{
                                animation: `moveIcon 4s ease-in-out infinite`,
                                animationDelay: `${index * 0.6}s`,
                                left: `${(index * 70) + 30}px`
                            }}
                        >
                            {icon}
                        </div>
                    ))}
                </div>
                <div className="text-orange-600 font-medium text-center w-72">
                    <div className="text-lg">Preparing your delicious experience...</div>
                    <div className="flex justify-center mt-2">
                        <span className="animate-bounce inline-block mr-1 delay-100">•</span>
                        <span className="animate-bounce inline-block mx-1 delay-200">•</span>
                        <span className="animate-bounce inline-block ml-1 delay-300">•</span>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes moveIcon {
                    0%, 100% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    33% {
                        transform: translateY(-20px);
                        opacity: 0.7;
                    }
                    66% {
                        transform: translateY(20px);
                        opacity: 0.7;
                    }
                }
            `}</style>
        </div>
    );
    
    return null;
}

export default Loading