import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/apiSetup";
const initialState = {
  communities: [],
  selectedCommunity: null,
  sessions: [],
  users: [],
  totalCommunities: 0,
  resources: [],
  creatorCommunities: [],
  // Community tags state
  communityTags: [],
  communityTagsLoading: false,
  communityTagsError: null,
  // Communities by tag state
  communitiesByTag: [],
  communitiesByTagLoading: false,
  communitiesByTagError: null,
  // UI state for rightbar
  rightBarAddMemberMode: false,
  rightBarAddMemberSearch: '',
  rightBarMemberSearch: '',
  rightBarNotificationPanelOpen: false,
  rightBarNotificationSearch: ''
};

export const setCommunities = createAsyncThunk(
  "community/setCommunities",
  async (query = {}, thunkAPI) => {
    // Build query string from object
    const queryString = Object.keys(query).length
      ? '?' + Object.entries(query).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&')
      : '';
    const res = await api.get(`/community${queryString}`);
    return { communities: res.data.communities, total: res.data.total };
  }
);

export const setCommunityById = createAsyncThunk(
  "community/setCommunityById",
  async ({ communityId}, thunkAPI) => {
    const res = await api.get(`/community/${communityId}`);
    return res.data.community;
  }
);


export const setVerifyCatchupLive = createAsyncThunk(
  "community/setVerifyCatchupLive",
  async(comId,thunkAPI)=>{
    try{
      const res = await api.get(`/catchup/community/${comId}`)
      return res
    }catch(e){
      console.log(e);
    }
  }
)

export const setCommunitySessions = createAsyncThunk(
  "community/setCommunitySessions",
  async (communityId, thunkAPI) => {
    try {
      const res = await api.get(`/community/${communityId}/session`);
      // let tiers=res.data.tiers;
      // let sessions=tiers.map((tier)=>{
      //     let obj={};
      //     obj['title']=tier.sessionSlot.session.title;
      //     obj['desc']=tier.sessionSlot.session.desc;
      //     obj['id']=tier.sessionSlot.session.id;
      //     obj['speakers']=tier.sessionSlot.speakerIds;
      //     obj['startTime']=tier.sessionSlot.startTime;
      //     let price=tier.sessionSlot.price;
      //     obj['marked_price']=price;
      //     let discount=tier.discount;
      //     let sp=price-(discount*price)/100;
      //     obj['selling_price']=sp;

      //     return obj;
      // })
      return res.data.sessions;
    } catch (err) {
      console.log(`Error while fetching communities`);
      console.log(err);
      return [];
    }
  }
);

export const setLeaveCatchup = createAsyncThunk(
  "community/setLeaveCatchup",
  async(catchup,thunkAPI)=>{
    console.log(catchup);
    try{
      const res = await api.patch( `/catchup/leave/${catchup.roomId}/${catchup.comId}/${catchup.userId}`)
      return res
    }catch(e){
      console.log(e);
    }
  }

)

// get partner communities
export const setPartnerCommunities = createAsyncThunk(
  "community/setPartnerCommunities",
  async (partnerId, thunkAPI) => {
    const res = await api.get(`/partner/${partnerId}/communities`);
    return res.data.communities;
  }
);
// get community users
export const setCommunityUsers = createAsyncThunk(
  "community/setCommunityUsers",
  async (communityId, thunkAPI) => {
    const res = await api.get(`/community/${communityId}/people`);
    return res.data.users;
  }
);
//get expert communities
export const setExpertCommunitiesGeneric = createAsyncThunk(
  "community/setExpertCommunitiesGeneric",
  async (expertId, thunkAPI) => {
    const res = await api.get(`/expert/${expertId}/community`);
    return res.data.communities;
  }
);

export const setResources = createAsyncThunk(
  "community/setResources",
  async (communityId, thunkAPI) => {
    const res = await api.get(`/resources/${communityId}/resources`);
    return res.data.resources;
  }
);

// Fetch community tags (only community/general)
export const getCommunityTagsFromCommunitySlice = createAsyncThunk(
  "community/getCommunityTagsFromCommunitySlice",
  async (showArchived = false, thunkAPI) => {
    try {
      const res = await api.get(`/community/community-tags${showArchived ? '?includeArchived=true' : ''}`);
      // Accepts both { tags: [...] } and array
      return Array.isArray(res.data) ? res.data : res.data.tags || [];
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Fetch communities by tag ID
export const fetchCommunitiesByTagId = createAsyncThunk(
  "community/fetchCommunitiesByTagId",
  async (tagId, thunkAPI) => {
    try {
      const res = await api.get(`/community/by-tag/${tagId}`);
      return res.data.communities || [];
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {
    setSelectedCommunity: (state, action) => {
      state.selectedCommunity = action.payload;
    },
    setCommunityCatchup: (state,action)=>{
      console.log(action.payload);
      state.catchup=action.payload
    },
    resetSelection: (state) => {
      state.selectedCommunity = null;
    },
    setRightBarAddMemberMode: (state, action) => {
      state.rightBarAddMemberMode = action.payload;
    },
      setRightBarAddMemberSearch: (state, action) => {
        state.rightBarAddMemberSearch = action.payload;
      },
      setRightBarMemberSearch: (state, action) => {
        state.rightBarMemberSearch = action.payload;
      },
      setRightBarNotificationPanelOpen: (state, action) => {
        state.rightBarNotificationPanelOpen = action.payload;
      },
      setRightBarNotificationSearch: (state, action) => {
        state.rightBarNotificationSearch = action.payload;
      },
  },
  extraReducers: (builder) => {
    builder.addCase(setCommunities.fulfilled, (state, action) => {
      state.communities = action.payload.communities;
      state.totalCommunities = action.payload.total;
    });

    builder.addCase(setCommunitySessions.fulfilled, (state, action) => {
      state.sessions = action.payload;
    });

    builder.addCase(setPartnerCommunities.fulfilled, (state, action) => {
      state.communities = action.payload;
    });

    builder.addCase(setCommunityUsers.fulfilled, (state, action) => {
      state.users = action.payload;
    });
    builder.addCase(setExpertCommunitiesGeneric.fulfilled, (state, action) => {
      state.communities = action.payload;
    });

    builder.addCase(setCommunityById.fulfilled, (state, action) => {
      state.selectedCommunity = action.payload;
    });
    builder.addCase(setVerifyCatchupLive.fulfilled,(state,action)=>{
      if(action.payload.data.success) state.isLive=true
      else state.isLive = false

      console.log(action.payload);
    });
    builder.addCase(setLeaveCatchup.fulfilled,(state,action)=>{
      if(action.payload.data.success){
        state.isLive=false,
        state.catchup={}
      }
    });

    // Community tags cases
    builder.addCase(getCommunityTagsFromCommunitySlice.pending, (state) => {
      state.communityTagsLoading = true;
      state.communityTagsError = null;
    });
    builder.addCase(getCommunityTagsFromCommunitySlice.fulfilled, (state, action) => {
      state.communityTagsLoading = false;
      state.communityTags = action.payload;
    });
    builder.addCase(getCommunityTagsFromCommunitySlice.rejected, (state, action) => {
      state.communityTagsLoading = false;
      state.communityTagsError = action.payload;
    });

    // Communities by tag cases
    builder.addCase(fetchCommunitiesByTagId.pending, (state) => {
      state.communities = [];
      state.communitiesByTagLoading = true;
      state.communitiesByTagError = null;
    });
    builder.addCase(fetchCommunitiesByTagId.fulfilled, (state, action) => {
      state.communities = action.payload;
      state.communitiesByTagLoading = false;
    });
    builder.addCase(fetchCommunitiesByTagId.rejected, (state, action) => {
      state.communitiesByTagLoading = false;
      state.communitiesByTagError = action.payload;
    });
  },
});

export default communitySlice;
export const     selectAllCommunities = (state) => state.community.communities;
export const selectCommunity = (state) => state.community.selectedCommunity;

export const selectCommunitySessions = (state) => state.community.sessions;
export const selectCommunityUsers = (state) => state.community.users;
export const selectTotalCommunities = (state) =>
  state.community.totalCommunities;
export const resources = (state) => state.resource.resources;
export const selectCatchUp = (state)=>state.community.catchup
export const checkCatchUpLive = (state)=>state.community.isLive
export const { setSelectedCommunity, resetSelection, setCommunityCatchup, setRightBarAddMemberMode, setRightBarAddMemberSearch, setRightBarMemberSearch, setRightBarNotificationPanelOpen, setRightBarNotificationSearch } = communitySlice.actions;

// Community tags selectors
export const selectCommunityTagsFromCommunitySlice = (state) => state.community.communityTags;
export const selectCommunityTagsLoadingFromCommunitySlice = (state) => state.community.communityTagsLoading;
export const selectCommunityTagsErrorFromCommunitySlice = (state) => state.community.communityTagsError;

// Selector for communities by tag loading/error
export const selectCommunitiesByTagLoading = (state) => state.community.communitiesByTagLoading;
export const selectCommunitiesByTagError = (state) => state.community.communitiesByTagError;

// RightBar UI selectors
export const selectRightBarAddMemberMode = (state) => state.community.rightBarAddMemberMode;
export const selectRightBarAddMemberSearch = (state) => state.community.rightBarAddMemberSearch;
export const selectRightBarMemberSearch = (state) => state.community.rightBarMemberSearch;
export const selectRightBarNotificationPanelOpen = (state) => state.community.rightBarNotificationPanelOpen;
export const selectRightBarNotificationSearch = (state) => state.community.rightBarNotificationSearch;
