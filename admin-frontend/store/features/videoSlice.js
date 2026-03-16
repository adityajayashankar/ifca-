import { createSlice,createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/utils/apiSetup';
const initialState = {
    allVideos:[],
    selectedVideo:null
};



export const setAllVideos=createAsyncThunk(
    'video/setAllVideos',
    async (thunkAPI)=>{
        const res=await api.get(`/video`)
        return res.data.videos
    }
)

const videoSlice = createSlice({
    name: 'video',
    initialState,
    reducers: {
        setSelectedVideo:(state,action)=>{
            state.selectedVideo=action.payload
        }
    },
    extraReducers:(builder)=>{
        builder.addCase(setAllVideos.fulfilled,(state,action)=>{
            state.allVideos=action.payload
        })
    }
});

export default videoSlice;
export const selectAllVideos=(state)=>state.video.allVideos
export const selectOneVideo=(state)=>state.video.selectedVideo


export const {setSelectedVideo} = videoSlice.actions;


