import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/apiSetup";
const initialState = {
  resources: [],
  currResource: {},
  community: [],
  session:[],
  currResourceName :"",
  currResourceLink : "",
};

// get individual resource
export const setResourceIdvl = createAsyncThunk(
  "resource/setResourceIdvl",
  async (resourceId, thunkAPI) => {
    try {
      const res = await api.get(`/resources/${resourceId}`);
      return res.data.resource;
    } catch (e) {
      console.log(e);
    }
  }
);

// get the resource of the particular community
export const setResourcesCommunity = createAsyncThunk(
  "resource/setResourcesCommunity",
  async (communityId, thunkAPI) => {
    try {
      const res = await api.get(`/resources/${communityId}/resources`);
      // console.log(res.data);
      return res.data.resources;
    } catch (e) {
      console.log(e);
    }
  }
);

// get resources of a session
export const setResourcesSession = createAsyncThunk(
  "resource/setResourcesSession",
  async (sessionId, thunkAPI) => {
    try {
      const res = await api.get(`/resources/session/${sessionId}`);
      // console.log(res.data);
      return res.data.resources;
    } catch (e) {
      console.log(e);
      return [];
    }
  }
);

// get all resources
export const setAllResources = createAsyncThunk(
  "resource/setAllResources",
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/resources/all/${userId}`);
      return res.data.resources;
    } catch (e) {
      console.log(e);
    }
  }
);
// get all communities
export const setAllCommunities = createAsyncThunk(
  "resource/setAllCommunities",
  async () => {
    try {
      const res = await api.get(`/community`);
      return res.data.communities;
    } catch (e) {
      console.log(e);
    }
  }
);


// get all communitites with the expert
export const setAllCommunitiesExpert = createAsyncThunk(
  "resource/setAllCommunitiesExpert",
  async (userId)=>{
    try {
      const res = await api.get(`/expert/${userId}/community`);
      return res.data.communities;
    } catch (e) {
      console.log(e);
    }
  }
)

// get all sessions with the expert
export const setAllSessionsExpert = createAsyncThunk(
  "resource/setAllSessionsExpert",
  async (userId)=>{
    try {
      const res = await api.get(`/expert/${userId}/sessions`);
      console.log(res.data);
      return res.data.sessions;
    } catch (e) {
      console.log(e);
    }
  }
)
export const setAllResourcesGlobal = createAsyncThunk(
  "resource/setAllResourcesGlobal",
  async(thunkAPI)=>{
    try{
      console.log("BEFORE");
      const res = await api.get(`/resources/global`)
      console.log("HELLO");
      return res.data.resources
    }catch(e){
      console.log(e);
    }
  }
)

// get all sessions
export const setAllSessions = createAsyncThunk(
  "resource/setAllSessions",
  async ()=>{
    try{
      const res = await api.get(`/session`)
      return res.data.sessions
    }catch(e){
      console.log(e);
    }
  }
)

const resourceSlice = createSlice({
  name: "resource",
  initialState,
  reducers:{
    setCurrentName:(state,action)=>{
      state.currResourceName = action.payload
    },
    setCurrentLink:(state,action)=>{
      state.currResourceLink = action.payload
    }
  },
  extraReducers: (builder) => {
    builder.addCase(setResourcesCommunity.fulfilled, (state, action) => {
      state.resources = action.payload;
    });
    builder.addCase(setResourcesSession.fulfilled, (state, action) => {
      state.resources = action.payload;
    });
    builder.addCase(setResourceIdvl.fulfilled, (state, action) => {
      state.currResource = action.payload;
      state.currResourceName = state.currResource.name
      state.currResourceLink = state.currResource.link
    });
    builder.addCase(setAllResources.fulfilled, (state, action) => {
      state.resources = action.payload;
    });
    builder.addCase(setAllCommunities.fulfilled, (state, action) => {
      state.community = action.payload
    });
    builder.addCase(setAllSessions.fulfilled, (state, action) => {
      state.session = action.payload
    });
    builder.addCase(setAllResourcesGlobal.fulfilled, (state, action) => {
      state.resources = action.payload
    });
    builder.addCase(setAllCommunitiesExpert.fulfilled, (state, action) => {
      state.community = action.payload
    });
    builder.addCase(setAllSessionsExpert.fulfilled, (state, action) => {
      state.session = action.payload
    });
  },
});

export default resourceSlice;
export const selectCommunityResources = (state) => state.resource.resources;
export const selectSessionResources = (state) => state.resource.resources;
export const selectCurrentResource = (state) => state.resource.currResource;
export const selectAllResources = (state) => state.resource.resources;
export const selectAllCommunities = (state)=>state.resource.community
export const selectAllResourcesGlobal = (state)=>state.resource.resources
export const selectAllSessions = (state)=>state.resource.session
export const selectAllCommunitiesExpert = (state)=>state.resource.community;
export const selectAllSessionsExpert = (state)=>state.resource.session;
export const selectCurrResourceName = (state)=>state.resource.currResourceName
export const selectCurrResourceLink = (state)=>state.resource.currResourceLink

export const {setCurrentName,setCurrentLink} = resourceSlice.actions