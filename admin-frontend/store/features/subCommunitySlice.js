import { createSlice,createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/utils/apiSetup';
const initialState = {
    subcommunities:[],
    selectedSubcommunity:null,
    subcommunityUsers:[],
    subcommunityExperts:[]
};



export const setCommunityGroups=createAsyncThunk(
    'subcommunity/setCommunityGroups',
    async (communityId,thunkAPI)=>{
        const res=await api.get(`/subcommunity/community/${communityId}`)
        return res.data.subcommunities
    }
)
 
export const setGroupUsers=createAsyncThunk(
    'subcommunity/setGroupUsers',
    async(subcommunityId,thunkAPI)=>{
        const res=await api.get(`/subcommunity/${subcommunityId}/people`)
        // seperate as experts and users
        let experts=[]
        let users=[]
        for(let person of res.data.people){
            if(person.role==="expert"){
                experts.push(person)
            }else{
                users.push(person)
            }
        }
        console.log(experts)
        return {experts,users}
    }
)
const subcommunitySlice = createSlice({
    name: 'subcommunity',
    initialState,
    reducers: {
        setSelectedGroup:(state,action)=>{
            state.selectedSubcommunity=action.payload
        
        }
    },
    extraReducers:(builder)=>{
    
        builder.addCase(setCommunityGroups.fulfilled,(state,action)=>{
            state.subcommunities=action.payload
        })

        builder.addCase(setGroupUsers.fulfilled,(state,action)=>{
            state.subcommunityUsers=action.payload.users;
            state.subcommunityExperts=action.payload.experts;
        })
    }
});

export default subcommunitySlice;
export const selectSubcommunities=(state)=>state.subcommunity.subcommunities;
export const selectGroup=(state)=>state.subcommunity.selectedSubcommunity
export const selectGroupUsers=(state)=>state.subcommunity.subcommunityUsers;
export const selectGroupExperts=(state)=>state.subcommunity.subcommunityExperts;


export const {setSelectedGroup} = subcommunitySlice.actions;


