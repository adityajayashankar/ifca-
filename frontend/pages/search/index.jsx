import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Topbar from "@/components/topbar/Topbar";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import SearchIcon from "@mui/icons-material/Search";
import api from "@/utils/apiSetup";
import ClassCard from "@/components/classCard";
import ExpertCard from "@/components/expert/ExpertCard";
import axios from "axios";

const FILTER_TABS = [
  "Communities",
  "Sessions",
  "Posts",
  "People",
  "Services",
  "Groups",
  "Products",
  "Schools",
  "Courses",
  "Events",
  "Companies",
  "All filters",
];

const SIDEBAR_LINKS = [
  "Communities",
  "Sessions",
  "Posts",
  "People",
  "Services",
  "Groups",
  "Products",
  "More jobs",
];

const jobs = [
  {
    id: 1,
    title: "Software Engineer II - Payroll Filing",
    company: "Rippling",
    location: "Bengaluru, Karnataka, India (On-site)",
    logo: "https://media.licdn.com/dms/image/C560BAQFQw/logo.png", // placeholder
    tags: ["Remote", "Easy apply", "Top Applicant", "<10 Applicants"],
    time: "1 week ago",
    connections: 1,
  },
  {
    id: 2,
    title: "Sr. Accountant Manager",
    company: "Maxlence Consulting",
    location: "Gurugram, Haryana, India (On-site)",
    logo: "https://media.licdn.com/dms/image/C560BAQFQw/logo.png",
    tags: ["Easy Apply"],
    time: "1 day ago",
    connections: 0,
  },
  {
    id: 3,
    title: "Accountant",
    company: "CareerUS Solutions",
    location: "India (Remote)",
    logo: "https://media.licdn.com/dms/image/C560BAQFQw/logo.png",
    tags: ["Easy Apply"],
    time: "5 days ago",
    connections: 0,
  },
];

const posts = [
  {
    id: 1,
    author: "Rahul Sharma",
    content: "Excited to announce our new product launch!",
    time: "2 hours ago",
  },
  {
    id: 2,
    author: "Priya Singh",
    content: "Looking for recommendations for payroll software.",
    time: "1 day ago",
  },
];

const JobCard = ({ job }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col">
    <div className="flex items-center gap-2">
      <img src={job.logo} alt="" className="w-10 h-10 rounded" />
      <div>
        <h3 className="font-bold text-base">{job.title}</h3>
        <p className="text-gray-600 text-sm">{job.company}</p>
        <p className="text-gray-400 text-xs">{job.location}</p>
      </div>
    </div>
    <div className="flex gap-2 mt-2 flex-wrap">
      {job.tags.map((tag, i) => (
        <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">{tag}</span>
      ))}
    </div>
    <div className="flex items-center justify-between mt-2">
      <span className="text-xs text-gray-400">{job.time}</span>
      <button className="ml-auto text-blue-600 text-sm font-medium">Save</button>
    </div>
  </div>
);

const PostCard = ({ post }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-4">
    <div className="flex items-center gap-2 mb-2">
      <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-xs font-bold">{post.author[0]}</span>
      <span className="font-semibold text-sm">{post.author}</span>
      <span className="text-xs text-gray-400 ml-2">{post.time}</span>
    </div>
    <div className="text-gray-800 text-sm">{post.content}</div>
  </div>
);

const CommunityCard = ({ community }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col">
    <div className="flex items-center gap-3">
      {community.bannerImg && (
        <img src={community.bannerImg} alt="" className="w-16 h-16 object-cover rounded" />
      )}
      <div>
        <h3 className="font-bold text-base">{community.title}</h3>
        <p className="text-gray-600 text-sm line-clamp-2">{community.desc}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 mt-2">
      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">{community.visibility}</span>
      <span className="text-xs text-gray-400">Created: {new Date(community.createdAt).toLocaleDateString()}</span>
    </div>
  </div>
);

const SessionCard = ({ session }) => {
  // Get the best available image for the session
  const getSessionImage = () => {
    if (session?.bannerImgs && session.bannerImgs.length > 0) {
      return session.bannerImgs[0];
    }
    if (session?.infoImgs && session.infoImgs.length > 0) {
      return session.infoImgs[0];
    }
    return "/tablaSchedule.svg";
  };

  const sessionImage = getSessionImage();

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col">
      <div className="flex items-center gap-3">
        <img 
          src={sessionImage} 
          alt={session.title} 
          className="w-16 h-16 object-cover rounded"
          onError={(e) => {
            e.target.src = "/tablaSchedule.svg";
            e.target.onerror = null; // Prevent infinite loop
          }}
        />
        <div>
          <h3 className="font-bold text-base">{session.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{session.desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">{session.sessionType}</span>
        <span className="text-xs text-gray-400">Created: {new Date(session.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

const Search = () => {
  const router = useRouter();
  const { value } = router.query;

  useEffect(() => {
    if (value) {
      setSearchValue(value);
    }
  }, [value]);

  const [filters, setFilters] = useState({
    communities: true,
    sessions: true,
    experts: true,
    course: true,
    videoChannel: true,
  });
  const [searchValue, setSearchValue] = useState(value || "");
  const [communities, setCommunities] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [experts, setExperts] = useState([]);
  const [course, setCourse] = useState([]);
  const [videoChannel, setVideoChannel] = useState([]);
  const [activeTab, setActiveTab] = useState("Communities");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSearchResults();
    }, 300); // Debounce time in milliseconds

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue, filters]); // Re-run effect when searchValue or filters change

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: checked,
    }));
  };

  const handleInputChange = (event) => {
    setSearchValue(event.target.value);
  };

  const fetchSearchResults = async () => {
    try {
      const res = await api.get("/search", {
        params: {
          tag: searchValue,
          sessionDisp: filters.sessions,
          communitiesDisp: filters.communities,
          expertDisp: filters.experts,
          courseDisp: filters.course,
          videoDisp: filters.videoChannel,
        },
      });

      setCommunities(res.data.communities);
      setSessions(res.data.sessions);
      setExperts(res.data.experts);
      setCourse(res.data.courses);
      setVideoChannel(res.data.videoChannel);
      // Process the response data as needed
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch search results from mysearch API
  useEffect(() => {
    if (!searchValue) return;
    setLoading(true);
    setError("");
    axios
      .get("/api/v1/search", { params: { query: searchValue } })
      .then((res) => {
        const data = res.data.data;
        setCommunities(data.communities || []);
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch search results.");
        setLoading(false);
      });
  }, [searchValue]);

  // Smooth scroll to section
  const handleSidebarClick = (section) => {
    const el = document.getElementById(section.toLowerCase());
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <title>IFCA - Search</title>
      <Topbar />
      {/* Sticky filter bar */}
      <div className="bg-white sticky top-0 z-40 border-b">
        <div className="flex overflow-x-auto no-scrollbar">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-700 bg-gray-50" : "text-gray-700"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
                ))}
              </div>
            </div>
      <div className="flex max-w-[1400px] mx-auto mt-4">
        {/* Left Sidebar */}
        <aside className="w-1/5 min-w-[180px] max-w-[220px] p-4 bg-gray-50 rounded-xl h-fit sticky top-[90px] self-start">
          <nav className="flex flex-col gap-2">
            <span className="font-bold mb-2 text-gray-700">On this page</span>
            {SIDEBAR_LINKS.map((section) => (
              <button
                key={section}
                onClick={() => handleSidebarClick(section)}
                className="text-left px-2 py-1 rounded hover:bg-blue-50 text-gray-700 text-sm"
              >
                {section}
              </button>
            ))}
          </nav>
        </aside>
        {/* Main Content */}
        <main className="w-3/5 px-6">
          {/* Search input */}
          <div className="flex justify-center items-center sticky z-30 top-0 bg-white mb-6">
            <div className="flex justify-center items-center my-4 bg-[#E2E2E2] rounded-full w-full max-w-2xl shadow focus:shadow-lg">
                <input
                  type="text"
                  className="px-5 py-3 outline-none w-full bg-transparent"
                  value={searchValue}
                placeholder="Search communities, sessions..."
                onChange={e => setSearchValue(e.target.value)}
                />
            </div>
                  </div>
          {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}
          {error && <div className="text-center py-8 text-red-500">{error}</div>}
          {!loading && !error && (
            <>
              {/* Communities Section */}
              <section id="communities" className="mb-10">
                <h2 className="text-2xl font-bold mb-2">Communities</h2>
                {communities.length === 0 ? (
                  <div className="text-gray-500">No communities found.</div>
                ) : (
                  communities.map((community) => <CommunityCard community={community} key={community.id} />)
                )}
                <a href="#" className="block text-center text-blue-600 font-medium py-2">See all community results</a>
              </section>
              {/* Sessions Section */}
              <section id="sessions" className="mb-10">
                <h2 className="text-2xl font-bold mb-2">Sessions</h2>
                {sessions.length === 0 ? (
                  <div className="text-gray-500">No sessions found.</div>
                ) : (
                  sessions.map((session) => <SessionCard session={session} key={session.id} />)
                )}
                <a href="#" className="block text-center text-blue-600 font-medium py-2">See all session results</a>
              </section>
            </>
          )}
        </main>
        {/* Right Sidebar */}
        <aside className="w-1/5 min-w-[220px] max-w-[300px] p-4">
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="font-bold mb-2">Ad or Suggestions</div>
            <div className="text-gray-500 text-sm">This is a placeholder for ads or suggestions, similar to LinkedIn's right sidebar.</div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Search;
