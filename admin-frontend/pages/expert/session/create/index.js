import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import CreateSessionForm from '@/components/session/CreateSessionForm';
import { MdChevronRight, MdHome } from 'react-icons/md';

function CreateSession() {
    const router = useRouter();
    const user = useSelector((state) => state.user.user);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumbs */}
            <div className="bg-white ">
                <div className="mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
                    <button
                        onClick={() => router.push('/expert')}
                        className="flex items-center hover:text-orange-700"
                    >
                        <MdHome className="w-4 h-4" />
                    </button>
                    <MdChevronRight className="w-4 h-4 text-gray-400" />
                    <button
                        onClick={() => router.push('/expert/session')}
                        className="text-gray-500 hover:text-orange-700"
                    >
                        Sessions
                    </button>
                    <MdChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">
                        Create New Session
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1920px] mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm">
                    <CreateSessionForm />
                </div>
            </div>
        </div>
    );
}

export default CreateSession;
