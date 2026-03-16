import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CreateSessionForm from '@/components/session/CreateSessionForm';
import api from '@/utils/apiSetup';
import { clearForm, initSession, selectSession } from 'store/features/createSessionSlice';
import { oneSession } from '@/store/features/session';
import { setResourcesSession } from '@/store/features/resourceSlice';
import { MdArrowBack, MdChevronRight, MdHome } from 'react-icons/md';

function EditSession() {
    const router = useRouter();
    const user = useSelector((state) => state.user.user);
    const dispatch = useDispatch();
    const selectedSession = useSelector(oneSession);

    useEffect(() => {
        dispatch(clearForm());
        dispatch(initSession(selectedSession));
        dispatch(setResourcesSession(parseInt(window.location.pathname.split("/")[4])))
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumbs */}
            <div className="bg-white border-b border-gray-200 py-2">
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
                    <span className="text-gray-700 font-medium truncate max-w-[200px] md:max-w-xs" title={selectedSession?.title}>
                        Edit Session
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1920px] mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <CreateSessionForm isEdit={true} id={parseInt(router.query['id'])} />
                </div>
            </div>
        </div>
    );
}

export default EditSession;
