import { selectUser } from '@/store/features/userSlice';
import api from '@/utils/apiSetup';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Head from "next/head";
import Topbar from "@/components/topbar/Topbar";
import Footer from "@/components/footer";

const RewardsHistory = () => {
  const user = useSelector(selectUser)
  const [userHistory, setUserHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const userId = user?.unifiedUser?.id

  useEffect(() => {
    userId && fetchUserHistory()
  }, [userId]);

  const fetchUserHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/rewards/getUserRewardHistory/${userId}`);
      setUserHistory(res?.data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setUserHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reward History</title>
      </Head>
      <div className="flex flex-col min-h-screen">
        <header>
          <Topbar />
        </header>
  
        <main className="flex-grow overflow-x-hidden my-[50px] md:my-[0px] flex flex-col gap-y-[10px]">
          <h1 className="flex justify-start mt-20 text-2xl font-bold ml-4 md:ml-36">Your Rewards History</h1>
  
          <div className="flex flex-col items-center w-full px-4 mb-4">
              {loadingHistory ? (
                <p>Loading history...</p>
              ) : userHistory?.transactions?.length === 0 ? (
                <p className="text-gray-500">No reward history available for this user.</p>
              ) : (
                <div className="w-full max-w-6xl space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-green-100 text-green-800 p-4 rounded-xl shadow-sm">
                      <p className="text-sm">Total Credit</p>
                      <p className="text-xl font-bold">{userHistory?.totalCredit || 0}</p>
                    </div>
                    <div className="bg-red-100 text-red-800 p-4 rounded-xl shadow-sm">
                      <p className="text-sm">Total Debit</p>
                      <p className="text-xl font-bold">{userHistory?.totalDebit || 0}</p>
                    </div>
                    <div className="bg-violet-200 text-blue-800 p-4 rounded-xl shadow-sm">
                      <p className="text-sm">Balance</p>
                      <p className="text-xl font-bold">{userHistory?.balance || 0}</p>
                    </div>
                  </div>
  
                  <div className="overflow-auto border rounded-lg shadow max-h-[500px]">
                    <table className="w-full text-sm text-left text-gray-600">
                      <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10">
                        <tr>
                          <th className="p-3 font-semibold">Date</th>
                          <th className="p-3 font-semibold">Action</th>
                          <th className="p-3 font-semibold">Type</th>
                          <th className="p-3 font-semibold">Points</th>
                          <th className="p-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userHistory?.transactions?.map((item, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50 transition">
                            <td className="p-3">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </td>
                            <td className="p-3">{item.ruleName || item.action}</td>
                            <td
                              className={`p-3 font-bold ${
                                item.type === 'CREDIT'
                                  ? 'text-green-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {item.type.toUpperCase()}
                            </td>
                            <td
                              className={`p-3 font-medium ${
                                item.type === 'CREDIT'
                                  ? 'text-green-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {item.points}
                            </td>
                            <td className="p-3 font-bold">
                              {item.isExpired
                                ? 'Expired'
                                : item.expiryDate
                                ? `Expires: ${new Date(item.expiryDate).toLocaleDateString()}`
                                : 'Active'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        </main>
  
        <footer>
          <Footer />
        </footer>
      </div>
    </>
  );  
};

export default RewardsHistory;
