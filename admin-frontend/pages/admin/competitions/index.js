import { useState, useEffect } from "react";
import { useRouter } from "next/router";
// import AddEvaluatorModal from "@/components/competitions/addEvaluator";
import ActiveCompetions from "@/components/competitions/incubator/micro/activeCompetitions";
import PastCompetitions from "@/components/competitions/incubator/micro/PastCompetitions";
import { MdChevronRight, MdHome, MdAdd, MdSearch, MdSort, MdEmojiEvents } from 'react-icons/md';
import api from "@/utils/apiSetup";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { toast } from "react-toastify";

const CompetitionPage = () => {
  const router = useRouter();
  const user = useSelector(selectUser);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [activeCompetitions, setActiveCompetitions] = useState([]);
  const [pastCompetitions, setPastCompetitions] = useState([]);

  useEffect(() => {
    if (user?.unifiedUser?.id) {
      fetchCompetitions();
    }
  }, [user?.unifiedUser?.id]);

  const fetchCompetitions = async () => {
    try {
      const activeRes = await api.get(`/competitions/getCompetitionsByCreatorId/${user?.unifiedUser?.id}`);
      setActiveCompetitions(activeRes?.data || []);
      const pastRes = await api.get(`/competitions/getPastCompetitionsbyCreatorId/${user?.unifiedUser?.id}`);
      setPastCompetitions(pastRes?.data || []);
    } catch (err) {
      setActiveCompetitions([]);
      setPastCompetitions([]);
    }
  };

  const handleDeleteCompetition = async (competitionId) => {
    try {
     
      await api.delete(`/competitions/${competitionId}`);

      
      setActiveCompetitions(prev => prev.filter(comp => comp.id !== competitionId));
      setPastCompetitions(prev => prev.filter(comp => comp.id !== competitionId));

      console.log('Competition deleted successfully');
     
      toast.success('Competition deleted successfully');
    } catch (error) {
      console.error('Error deleting competition:', error);
      
      toast.error('Failed to delete competition');
    }
  };




  // Filter and sort logic
  const filteredActive = activeCompetitions
    .filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(c => !filter || c.mode === filter || c.competitionType === filter || c.format === filter)
    .sort((a, b) => {
      if (sort === "date-asc") return new Date(a.startDate) - new Date(b.startDate);
      if (sort === "date-desc") return new Date(b.startDate) - new Date(a.startDate);
      if (sort === "title-asc") return a.title.localeCompare(b.title);
      if (sort === "title-desc") return b.title.localeCompare(a.title);
      return 0;
    });
  const filteredPast = pastCompetitions
    .filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(c => !filter || c.mode === filter || c.competitionType === filter || c.format === filter)
    .sort((a, b) => {
      if (sort === "date-asc") return new Date(a.startDate) - new Date(b.startDate);
      if (sort === "date-desc") return new Date(b.startDate) - new Date(a.startDate);
      if (sort === "title-asc") return a.title.localeCompare(b.title);
      if (sort === "title-desc") return b.title.localeCompare(a.title);
      return 0;
    });

  const handleNewCompetition = () => {
    setLoadingAdd(true);
    setTimeout(() => {
      setLoadingAdd(false);
      router.push('/admin/competitions/create');
    }, 400);
  };

  // Breadcrumbs
  const crumbs = [
    { name: "Dashboard", link: "/myIncubator" },
    { name: "Competitions", link: "/myIncubator/competitions" },
  ];

  // Empty state for competitions
  const EmptyState = ({ title, description }) => (
    <div className="flex flex-col items-center justify-center text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 my-8">
      <MdEmojiEvents className="text-orange-300 text-7xl mb-4" />
      <h2 className="text-3xl font-bold text-gray-700 mb-2">{title}</h2>
      <p className="text-gray-500 mb-4">{description}</p>
      <button
        className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-orange-600 transition"
        onClick={handleNewCompetition}
      >
        <MdAdd className="inline-block mr-1 -mt-1" /> New Competition
      </button>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 w-full">
        <div className="w-full px-8 py-3 flex items-center space-x-2 text-sm">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium">Competitions</span>
        </div>
      </div>
      <div className="w-full flex flex-col items-center bg-gray-50 min-h-screen py-8">
        <div className="w-full px-0">
          {/* Header Card with Tabs and Actions */}
          <div className="bg-white rounded-2xl shadow-lg px-8 py-6 mb-8 w-full">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
              {/* Tabs */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'active'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Active Competitions
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'past'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Past Competitions
                </button>
              </div>
              {/* Search, Filter, Sort, New Competition */}
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-stretch md:items-center flex-1 justify-end">
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-stretch md:items-center flex-1">
                  {/* Search Bar */}
                  <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MdSearch className="text-gray-400 text-xl" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Search by competition title..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {/* Filter Dropdown */}
                  {/* <select
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select> */}
                  {/* Sort Dropdown */}
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                  >
                    <option value="">Sort By</option>
                    <option value="date-asc">Date (Asc)</option>
                    <option value="date-desc">Date (Desc)</option>
                    <option value="title-asc">Title (A-Z)</option>
                    <option value="title-desc">Title (Z-A)</option>
                  </select>
                </div>
                <button
                  onClick={handleNewCompetition}
                  className={`relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-white font-medium transition-colors w-full md:w-auto ${loadingAdd ? 'cursor-not-allowed bg-orange-400' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600'}`}
                  disabled={loadingAdd}
                  type="button"
                >
                  <MdAdd className="text-lg" />
                  <span>New Competition</span>
                </button>
              </div>
            </div>
            {/* Competitions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
              {activeTab === 'active' ? (
                filteredActive.length > 0 ? (
                  <ActiveCompetions competitions={filteredActive} owner={true} onDelete={handleDeleteCompetition} />
                ) : (
                  <div className="col-span-full">
                    <EmptyState title="No Active Competitions" description="Start your first competition to engage your community!" />
                  </div>
                )
              ) : (
                filteredPast.length > 0 ? (
                 <PastCompetitions competitions={filteredPast} owner={true} onDelete={handleDeleteCompetition} />
                ) : (
                  <div className="col-span-full">
                    <EmptyState title="No Past Competitions" description="Past competitions will appear here once available." />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionPage;
