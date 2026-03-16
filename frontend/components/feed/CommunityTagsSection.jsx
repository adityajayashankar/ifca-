import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCommunityTagsFromCommunitySlice,
  selectCommunityTagsLoadingFromCommunitySlice,
  selectCommunityTagsErrorFromCommunitySlice,
  getCommunityTagsFromCommunitySlice
} from "@/store/features/communitySlice";
import { Skeleton, Button, Alert, Drawer, IconButton, Tooltip } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

const CommunityTagsSection = ({ 
  loading = false,
  retryCount = 0,
  onRetry,
  onRefresh,
  isAutoRefreshing = false
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const communityTags = useSelector(selectCommunityTagsFromCommunitySlice);
  const communityTagsLoading = useSelector(selectCommunityTagsLoadingFromCommunitySlice);
  const communityTagsError = useSelector(selectCommunityTagsErrorFromCommunitySlice);

  // Local state for search and drawer
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");

  // Load community tags on component mount
  useEffect(() => {
    dispatch(getCommunityTagsFromCommunitySlice());
  }, [dispatch]);

  // Categorize tags based on their names and descriptions
  const categorizedTags = useMemo(() => {
    if (!Array.isArray(communityTags)) return {};
    const categories = {
      "Culinary Arts": [],
      "Hospitality": [],
      "Cultural Heritage": [],
      "Professional Skills": [],
      "Technology": [],
      "Business": [],
      "Education": [],
      "Other": []
    };
    communityTags.forEach(tag => {
      const tagName = tag.name?.toLowerCase() || "";
      if (tagName.includes('cooking') || tagName.includes('chef') || tagName.includes('recipe') || 
          tagName.includes('culinary') || tagName.includes('food') || tagName.includes('kitchen')) {
        categories["Culinary Arts"].push(tag);
      } else if (tagName.includes('hotel') || tagName.includes('restaurant') || tagName.includes('service') || 
                 tagName.includes('hospitality') || tagName.includes('guest') || tagName.includes('management')) {
        categories["Hospitality"].push(tag);
      } else if (tagName.includes('culture') || tagName.includes('heritage') || tagName.includes('traditional') || 
                 tagName.includes('indian') || tagName.includes('regional') || tagName.includes('festival')) {
        categories["Cultural Heritage"].push(tag);
      } else if (tagName.includes('skill') || tagName.includes('training') || tagName.includes('certification') || 
                 tagName.includes('professional') || tagName.includes('career') || tagName.includes('development')) {
        categories["Professional Skills"].push(tag);
      } else if (tagName.includes('tech') || tagName.includes('digital') || tagName.includes('online') || 
                 tagName.includes('app') || tagName.includes('software') || tagName.includes('platform')) {
        categories["Technology"].push(tag);
      } else if (tagName.includes('business') || tagName.includes('entrepreneur') || tagName.includes('startup') || 
                 tagName.includes('marketing') || tagName.includes('finance') || tagName.includes('strategy')) {
        categories["Business"].push(tag);
      } else if (tagName.includes('education') || tagName.includes('learning') || tagName.includes('course') || 
                 tagName.includes('training') || tagName.includes('workshop') || tagName.includes('seminar')) {
        categories["Education"].push(tag);
      } else {
        categories["Other"].push(tag);
      }
    });
    Object.keys(categories).forEach(category => {
      if (categories[category].length === 0) {
        delete categories[category];
      }
    });
    return categories;
  }, [communityTags]);

  // Filter tags by search term (main list)
  const filteredTags = useMemo(() => {
    let tags = [];
    Object.values(categorizedTags).forEach(categoryTags => {
      tags.push(...categoryTags);
    });
    if (searchTerm.trim()) {
      tags = tags.filter(tag => 
        tag.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    tags.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return tags;
  }, [categorizedTags, searchTerm]);

  // Filter tags for drawer
  const drawerFilteredTags = useMemo(() => {
    let tags = Array.isArray(communityTags) ? [...communityTags] : [];
    if (drawerSearch.trim()) {
      tags = tags.filter(tag =>
        tag.name?.toLowerCase().includes(drawerSearch.toLowerCase()) ||
        tag.description?.toLowerCase().includes(drawerSearch.toLowerCase())
      );
    }
    tags.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return tags;
  }, [communityTags, drawerSearch]);

  // Handle tag click
  const handleTagClick = (tag) => {
    router.push(`/communities?tag=${encodeURIComponent(tag.id)}`);
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      "Culinary Arts": "🍳",
      "Hospitality": "🏨",
      "Cultural Heritage": "🏛️",
      "Professional Skills": "💼",
      "Technology": "💻",
      "Business": "📈",
      "Education": "📚",
      "Other": "🏷️"
    };
    return icons[category] || "🏷️";
  };

  // Get tag color based on category
  const getTagColor = (tag) => {
    const tagName = tag.name?.toLowerCase() || "";
    if (tagName.includes('cooking') || tagName.includes('chef') || tagName.includes('culinary')) {
      return "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500";
    }
    if (tagName.includes('hotel') || tagName.includes('hospitality')) {
      return "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500";
    }
    if (tagName.includes('culture') || tagName.includes('heritage')) {
      return "bg-gradient-to-r from-purple-500 to-violet-500 text-white border-purple-500";
    }
    if (tagName.includes('tech') || tagName.includes('digital')) {
      return "bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-cyan-500";
    }
    if (tagName.includes('business') || tagName.includes('entrepreneur')) {
      return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500";
    }
    if (tagName.includes('education') || tagName.includes('learning')) {
      return "bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-500";
    }
    return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-gray-500";
  };

  // Skeleton component
  const TagsSkeleton = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3">
      <Skeleton variant="text" width="60%" height={16} className="mb-3" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton variant="rectangular" width={80} height={32} className="rounded-full" />
            <Skeleton variant="text" width="70%" height={14} />
          </div>
        ))}
      </div>
    </div>
  );

  // Error state component
  const ErrorState = ({ message, onRetry }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3">
      <Alert 
        severity="error" 
        icon={<ErrorOutlineIcon />}
        action={
          onRetry && (
            <Button 
              color="inherit" 
              size="small" 
              onClick={onRetry}
              className="ml-2"
            >
              Retry
            </Button>
          )
        }
      >
        {message}
      </Alert>
    </div>
  );

  const showError = retryCount >= 3;

  if (showError) {
    return (
      <ErrorState 
        message="Failed to load community categories. Please try again." 
        onRetry={onRetry}
      />
    );
  }

  if (loading || communityTagsLoading) {
    return <TagsSkeleton />;
  }

  if (communityTagsError) {
    return (
      <ErrorState 
        message="Failed to load community categories. Please try again." 
        onRetry={onRetry}
      />
    );
  }

  if (!Array.isArray(communityTags) || communityTags.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3">
        <div className="flex items-center gap-2 mb-3">
          <CategoryIcon className="text-base text-orange-500" />
          <h3 className="font-bold text-base text-gray-800">Category</h3>
        </div>
        <div className="text-center py-6 text-gray-500">
          <LocalOfferIcon className="text-4xl text-gray-300 mb-2" />
          <p className="text-base">No community categories available</p>
          <p className="text-xs text-gray-400 mt-1">Categories will appear here once created</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow px-4 pt-[2px]">
      <div className="flex items-center justify-between py-2">
        <h3 className="font-semibold text-base p-0 m-0">Category</h3>
        <IconButton
          size="small"
          onClick={() => setDrawerOpen(true)}
          style={{ background: '#fff', border: '1px solid #eee', padding: 4 }}
        >
          <SearchIcon className="text-gray-500 text-sm" />
        </IconButton>
      </div>
      <div className="space-y-1">
        {filteredTags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            onClick={() => handleTagClick(tag)}
          >
            <span className="text-sm text-gray-500">{getCategoryIcon(Object.keys(categorizedTags).find(cat => categorizedTags[cat].some(t => t.id === tag.id)) || "Other" )}</span>
            <div className="truncate max-w-[180px] flex-1">
              <h4 className="text-sm font-medium text-gray-900 truncate m-0 p-0">{tag.name}</h4>
            </div>
            {tag.communityCount > 0 && (
              <span className="text-xs text-gray-500 ml-auto">
                {tag.communityCount} communities
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Drawer for all tags search */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            zIndex: 1400,
            boxShadow: 24,
            width: 340,
            maxWidth: '100vw',
            background: '#fff',
            borderRadius: '16px 0 0 16px',
          }
        }}
      >
        <div className="w-full h-full bg-white flex flex-col" style={{borderRadius: '16px 0 0 16px'}}>
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <span className="font-bold text-base text-gray-800">All Categories</span>
            <IconButton size="small" onClick={() => setDrawerOpen(false)}>
              <ErrorOutlineIcon className="text-gray-400 text-base" />
            </IconButton>
          </div>
          <div className="relative p-3">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={drawerSearch}
              onChange={e => setDrawerSearch(e.target.value)}
              placeholder="Search all categories..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-hide">
            {drawerFilteredTags.length > 0 ? (
              <div className="space-y-1">
                {drawerFilteredTags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => { handleTagClick(tag); setDrawerOpen(false); }}
                  >
                    <span className="text-sm text-gray-500">{getCategoryIcon('Other')}</span>
                    <div className="truncate max-w-[160px] flex-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate m-0 p-0">{tag.name}</h4>
                      {tag.description && (
                        <p className="text-xs opacity-90 line-clamp-1 text-gray-500">{tag.description}</p>
                      )}
                    </div>
                    {tag.communityCount > 0 && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {tag.communityCount} communities
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <LocalOfferIcon className="text-3xl text-gray-300 mb-2" />
                <p className="text-sm">No categories found</p>
                {drawerSearch && <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* Custom CSS for hiding scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default CommunityTagsSection; 