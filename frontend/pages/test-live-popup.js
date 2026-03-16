import React, { useState } from 'react';
import LiveCatchupPopup from '../components/LiveCatchupPopup';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import api from '@/utils/apiSetup';
import { toast } from 'react-hot-toast';

const TestLivePopup = () => {
  const user = useSelector(selectUser);
  const [isCreating, setIsCreating] = useState(false);

  const createTestLiveCatchup = async () => {
    if (!user?.unifiedUser?.id) {
      toast.error('Please log in to create test catchups');
      return;
    }

    setIsCreating(true);
    try {
      // You'll need to provide a valid communityId
      const response = await api.post('/catchup/test/create-live', {
        communityId: 1, // Replace with actual community ID
        unifiedUserId: user.unifiedUser.id
      });

      if (response.data.success) {
        toast.success('Test live catchup created! The popup should appear shortly.');
      } else {
        toast.error('Failed to create test catchup');
      }
    } catch (error) {
      console.error('Error creating test catchup:', error);
      toast.error('Failed to create test catchup. Check console for details.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Live Catchup Popup Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">How it works:</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• The popup will appear when a catchup becomes live</li>
            <li>• It stays visible until the meeting ends or user dismisses it</li>
            <li>• Click "Join Live" to join the catchup</li>
            <li>• Click "Dismiss" to close the popup</li>
            <li>• Multiple live catchups will show multiple popups</li>
          </ul>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This component checks for live catchups every 15 seconds. 
              Make sure you have active catchups in your account to see the popup.
            </p>
          </div>

          {/* Test Button */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Test the Popup</h3>
            <p className="text-sm text-green-700 mb-4">
              Click the button below to create a test live catchup. The popup should appear within 15 seconds.
            </p>
            <button
              onClick={createTestLiveCatchup}
              disabled={isCreating || !user?.unifiedUser?.id}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              {isCreating ? 'Creating...' : 'Create Test Live Catchup'}
            </button>
            {!user?.unifiedUser?.id && (
              <p className="text-xs text-red-600 mt-2">Please log in to test the popup</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Live Catchup Popup Component */}
      <LiveCatchupPopup />
      
      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
};

export default TestLivePopup; 