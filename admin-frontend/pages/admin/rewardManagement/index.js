import api from '@/utils/apiSetup';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function RewardManagement() {
  const [activeTab, setActiveTab] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [initialRewards, setInitialRewards] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("az");

  const excludedActions = [
    'REPLY_ANNOUNCEMENT', 'REPLY_GREETING', 'CREATE_THREAD', 'REPLY_THREAD',
    'JOIN_CATCHUP', 'CREATE_FORM', 'ATTEND_SESSION', 'COMPLETE_COURSE', 'REDEEMED'
  ];
  const lockedActions = ['SIGN_UP', 'PROFILE_COMPLETION'];

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rewards/getAllRules');
      const filteredData = res?.data?.filter(rule => !excludedActions.includes(rule.action));
      setRewards(filteredData);
      setInitialRewards(filteredData);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0) {
      fetchRewards();
    }
  }, [activeTab]);

  const handleToggle = (id) => {
    setRewards((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const handleChange = (id, field, value) => {
    setRewards((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const handleReset = () => {
    setRewards(initialRewards);
  };

  const handleSave = async () => {
    const changedRewards = rewards.filter((reward) => {
      const original = initialRewards.find((r) => r.id === reward.id);
      return (
        original &&
        (original.points !== reward.points ||
          original.frequency !== reward.frequency ||
          original.limit !== reward.limit ||
          original.isActive !== reward.isActive ||
          original.expiryDays !== reward.expiryDays)
      );
    });

    if (changedRewards.length === 0) {
      toast.info('No changes to save.');
      return;
    }

    try {
      const res = await api.put('/rewards/updateRules', {
        updates: changedRewards,
      });

      if (res.status === 200) {
        const updated = res.data;
        setRewards(prev =>
          prev.map(item => {
            const changed = updated.find(u => u.id === item.id);
            return changed ? { ...item, ...changed } : item;
          })
        );
        setInitialRewards(prev =>
          prev.map(item => {
            const changed = updated.find(u => u.id === item.id);
            return changed ? { ...item, ...changed } : item;
          })
        );
        toast.success('Changes saved successfully!');
      } else {
        throw new Error('Failed to save changes');
      }
    } catch (err) {
      toast.error('Failed to save changes.');
      console.log('error', err);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/user');
      const allUsers = [...(res.data?.activeUsers || []), ...(res.data?.disabledUsers || [])];
      setUsers(allUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 1) {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUserHistory = async (userId) => {
    setSelectedUserId(userId);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/rewards/getUserRewardHistory/${userId}`);
      setUserHistory(res.data);
    } catch (err) {
      console.error('Error fetching user history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSectionChange = (section) => {
    setActiveTab(section === "rules" ? 0 : 1);
  };

  // Filter and sort rewards
  const filteredRewards = (rewards || [])
    .filter((r) => r.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const nameA = a.name?.toLowerCase().trim() || "";
      const nameB = b.name?.toLowerCase().trim() || "";

      if (sort === "az") return nameA.localeCompare(nameB);
      if (sort === "za") return nameB.localeCompare(nameA);
      if (sort === "points") return (b.points || 0) - (a.points || 0);
      if (sort === "recent") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sort === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sort === "active") return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
      return 0;
    });

  // Summary stats for cards
  const totalRewards = rewards.length;
  const activeRewards = rewards.filter(r => r.isActive).length;
  const inactiveRewards = rewards.filter(r => !r.isActive).length;
  const totalPoints = rewards.reduce((sum, r) => sum + (r.points || 0), 0);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <button onClick={() => window.location.assign('/admin')} className="flex items-center text-gray-500 hover:text-gray-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#9ca3af">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
          <span className="text-gray-700 font-medium" style={{ fontSize: "14px" }}>Reward Management</span>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 overflow-x-auto">
        {/* Header Controls */}
        <div className="bg-white rounded-xl shadow-sm px-6 py-4 mt-4">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center flex-1">
              {/* Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleSectionChange("rules")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 0 ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{ fontSize: "12px" }}
                >
                  Reward Rules ({totalRewards})
                </button>
                <button
                  onClick={() => handleSectionChange("history")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 1 ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{ fontSize: "12px" }}
                >
                  User History
                </button>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 whitespace-nowrap" style={{ fontSize: "14px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#f97316">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                </svg>
                Reward Management
              </h2>

              {/* Search Bar */}
              {activeTab === 0 && (
                <input
                  type="text"
                  placeholder="Search by rule name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  style={{ fontSize: "12px", width: "250px" }}
                />
              )}

              {/* Sort Dropdown */}
              {activeTab === 0 && (
                <div className="flex items-center gap-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af">
                    <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
                  </svg>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    style={{ fontSize: "12px", minWidth: "120px" }}
                  >
                    <option value="az">A-Z</option>
                    <option value="za">Z-A</option>
                    <option value="points">Most Points</option>
                    <option value="recent">Recently Added</option>
                    <option value="oldest">Oldest First</option>
                    <option value="active">Most Active</option>
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            {activeTab === 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                  style={{ fontSize: "12px" }}
                >
                  Reset Changes
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition-all"
                  style={{ fontSize: "12px" }}
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 mb-1" style={{ fontSize: "12px" }}>Total Rules</div>
                <div className="text-2xl font-bold text-orange-600">{totalRewards}</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#f97316">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 mb-1" style={{ fontSize: "12px" }}>Active Rules</div>
                <div className="text-2xl font-bold text-green-600">{activeRewards}</div>
                <div className="text-gray-500" style={{ fontSize: "10px" }}>
                  {totalRewards > 0 ? Math.round((activeRewards / totalRewards) * 100) : 0}% of total
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#10b981">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 mb-1" style={{ fontSize: "12px" }}>Total Points</div>
                <div className="text-2xl font-bold text-purple-600">{totalPoints}</div>
                <div className="text-gray-500" style={{ fontSize: "10px" }}>
                  across all rules
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#7c3aed">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 mb-1" style={{ fontSize: "12px" }}>Avg Points/Rule</div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalRewards > 0 ? Math.round(totalPoints / totalRewards) : 0}
                </div>
                <div className="text-gray-500" style={{ fontSize: "10px" }}>
                  per rule
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6">
                  <path d="M9 7H11A2 2 0 0 1 13 9V15A2 2 0 0 1 11 17H9A2 2 0 0 1 7 15V9A2 2 0 0 1 9 7Z"/>
                  <path d="M15 7H17A2 2 0 0 1 19 9V15A2 2 0 0 1 17 17H15A2 2 0 0 1 13 15V9A2 2 0 0 1 15 7Z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-4 overflow-hidden" style={{ height: "calc(100vh - 280px)" }}>
          {activeTab === 0 ? (
            /* Reward Rules Table */
            <div className="h-full flex flex-col">
              <div className="bg-orange-50 px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4 font-semibold text-orange-900" style={{ fontSize: "12px" }}>
                  <div>Action</div>
                  <div>Points</div>
                  <div>Frequency</div>
                  <div>Limit</div>
                  <div>Expiry Days</div>
                  <div>Status</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-orange-600" style={{ fontSize: "14px" }}>
                    Loading reward rules...
                  </div>
                ) : filteredRewards.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500" style={{ fontSize: "14px" }}>
                    No reward rules found
                  </div>
                ) : (
                  filteredRewards.map((rule, index) => (
                    <div key={rule.id} className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-orange-50 transition-colors">
                      <div className="font-medium text-gray-900" style={{ fontSize: "12px" }}>{rule.name}</div>
                      <div>
                        <input
                          type="number"
                          value={rule.points ?? ''}
                          onChange={(e) => handleChange(rule.id, 'points', parseInt(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          style={{ fontSize: "12px" }}
                        />
                      </div>
                      <div>
                        {lockedActions.includes(rule.action) ? (
                          <select value="ONCE" disabled className="w-24 px-2 py-1 border border-gray-300 rounded bg-gray-100 text-gray-500" style={{ fontSize: "12px" }}>
                            <option value="ONCE">Only Once</option>
                          </select>
                        ) : (
                          <select
                            value={rule.frequency}
                            onChange={(e) => handleChange(rule.id, 'frequency', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded"
                            style={{ fontSize: "12px" }}
                          >
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="ONCE">Only Once</option>
                          </select>
                        )}
                      </div>
                      <div>
                        {rule.frequency === 'ONCE' || lockedActions.includes(rule.action) ? (
                          <span className="text-gray-500 italic" style={{ fontSize: "12px" }}>N/A</span>
                        ) : (
                          <input
                            type="number"
                            value={rule.limit ?? ''}
                            onChange={(e) => handleChange(rule.id, 'limit', parseInt(e.target.value))}
                            className={`w-20 px-2 py-1 border rounded text-center ${!rule.limit || rule.limit <= 0 ? 'border-red-300' : 'border-gray-300'}`}
                            style={{ fontSize: "12px" }}
                          />
                        )}
                      </div>
                      <div>
                        <input
                          type="number"
                          value={rule.expiryDays ?? ''}
                          onChange={(e) => handleChange(rule.id, 'expiryDays', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          style={{ fontSize: "12px" }}
                        />
                      </div>
                      <div>
                        <button
                          onClick={() => handleToggle(rule.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            rule.isActive 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* User History Section */
            <div className="h-full flex flex-col p-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="flex gap-3">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Active: {users.filter(user => user.unifiedUserId?.isActive).length}
                  </span>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    Inactive: {users.filter(user => !user.unifiedUserId?.isActive).length}
                  </span>
                </div>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => fetchUserHistory(e.target.value)}
                  disabled={loadingUsers}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  style={{ fontSize: "12px", minWidth: "300px" }}
                >
                  <option value="" disabled>
                    {loadingUsers ? 'Loading users...' : '-- Choose a user --'}
                  </option>
                  {users
                    .filter((user) => user.name && user.name.trim().length > 0)
                    .map((user) => (
                      <option key={user.id} value={user.unifiedUserId?.id}>
                        {user.name} ({user.email}) - {user.unifiedUserId?.isActive ? 'Active' : 'Inactive'}
                      </option>
                    ))}
                </select>
              </div>

              {selectedUserId ? (
                loadingHistory ? (
                  <div className="flex items-center justify-center h-full text-orange-600" style={{ fontSize: "14px" }}>
                    Loading user history...
                  </div>
                ) : userHistory?.transactions?.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500" style={{ fontSize: "14px" }}>
                    No Reward History
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {/* History Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-green-600 mb-1" style={{ fontSize: "12px" }}>Total Credit</div>
                        <div className="text-xl font-bold text-green-700">{userHistory.totalCredit || 0}</div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-red-600 mb-1" style={{ fontSize: "12px" }}>Total Debit</div>
                        <div className="text-xl font-bold text-red-700">{userHistory.totalDebit || 0}</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="text-purple-600 mb-1" style={{ fontSize: "12px" }}>Current Balance</div>
                        <div className="text-xl font-bold text-purple-700">{userHistory.balance || 0}</div>
                      </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <div className="bg-orange-50 px-4 py-3 border-b border-gray-200">
                        <div className="grid grid-cols-5 gap-4 font-semibold text-orange-900" style={{ fontSize: "12px" }}>
                          <div>Date</div>
                          <div>Action</div>
                          <div>Type</div>
                          <div>Points</div>
                          <div>Status</div>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {userHistory?.transactions?.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-orange-50 transition-colors">
                            <div style={{ fontSize: "12px" }}>{new Date(item.timestamp).toLocaleDateString()}</div>
                            <div style={{ fontSize: "12px" }}>{item.ruleName}</div>
                            <div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.type === 'CREDIT' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.type?.toUpperCase()}
                              </span>
                            </div>
                            <div className="font-bold" style={{ fontSize: "12px" }}>
                              {item.points > 0 ? '+' : ''}{item.points}
                            </div>
                            <div>
                              {item.isExpired ? (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Expired</span>
                              ) : item.expiryDate ? (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                  Expires: {new Date(item.expiryDate).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500" style={{ fontSize: "14px" }}>
                  Select a user to view reward history
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
