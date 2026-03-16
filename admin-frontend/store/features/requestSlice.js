import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/apiSetup";

const initialState = {
    requests: [],
    userRequests: [],
    approvedRequests: [],
    pendingRequests: [],
    allRequests: [],
    loading: false,
    error: null
}

// ===== ADMIN REQUEST FUNCTIONS (using /requests endpoints) =====

// Get all requests (admin) - both pending and approved
export const fetchAllRequests = createAsyncThunk(
    "request/fetchAllRequests",
    async (_, thunkAPI) => {
        try {
            const res = await api.get(`/requests`)
            // The backend returns { data: { all: [...], pending: [...], approved: [...] } }
            // We want the 'all' array which contains both pending and approved requests
            return res.data.data.all || res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Get all pending requests (for admin/community managers)
export const fetchAllPendingRequests = createAsyncThunk(
    "request/fetchAllPendingRequests",
    async (_, thunkAPI) => {
        try {
            const res = await api.get(`/requests/pending`)
            return res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Get all approved requests (for admin)
export const fetchAllApprovedRequests = createAsyncThunk(
    "request/fetchAllApprovedRequests",
    async (_, thunkAPI) => {
        try {
            const res = await api.get(`/requests/approved`)
            return res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Get requests by user ID (all requests)
export const fetchRequestsByUser = createAsyncThunk(
    "request/fetchRequestsByUser",
    async (userId, thunkAPI) => {
        try {
            const res = await api.get(`/requests/user/${userId}`)
            return res.data.request
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Get pending requests by user ID
export const fetchPendingRequestsByUser = createAsyncThunk(
    "request/fetchPendingRequestsByUser",
    async (userId, thunkAPI) => {
        try {
            const res = await api.get(`/requests/user/${userId}/pending`)
            return res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Get approved requests by user ID
export const fetchApprovedRequestsByUser = createAsyncThunk(
    "request/fetchApprovedRequestsByUser",
    async (userId, thunkAPI) => {
        try {
            const res = await api.get(`/requests/user/${userId}/approved`)
            return res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Get all requests by user ID (both pending and approved)
export const fetchAllRequestsByUser = createAsyncThunk(
    "request/fetchAllRequestsByUser",
    async (userId, thunkAPI) => {
        try {
            const res = await api.get(`/requests/user/${userId}/all`)
            return res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Get a single request by ID
export const fetchRequestById = createAsyncThunk(
    "request/fetchRequestById",
    async (requestId, thunkAPI) => {
        try {
            const res = await api.get(`/requests/${requestId}`)
            return res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// ===== COMMUNITY REQUEST FUNCTIONS (using /comRequest endpoints) =====

// Get requests by community ID (pending only)
export const fetchRequestsByCommunity = createAsyncThunk(
    "request/fetchRequestsByCommunity",
    async (communityId, thunkAPI) => {
        try {
            const res = await api.get(`/comRequest/${communityId}`)
            return res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Get approved requests by community ID
export const fetchApprovedRequestsByCommunity = createAsyncThunk(
    "request/fetchApprovedRequestsByCommunity",
    async (communityId, thunkAPI) => {
        try {
            const res = await api.get(`/comRequest/${communityId}/approved`)
            return res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Get all requests by community ID (both pending and approved)
export const fetchAllRequestsByCommunity = createAsyncThunk(
    "request/fetchAllRequestsByCommunity",
    async (communityId, thunkAPI) => {
        try {
            const res = await api.get(`/comRequest/${communityId}/all`)
            return res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Get requests by community ID for a specific user (community manager)
export const fetchRequestsByCommunityForUser = createAsyncThunk(
    "request/fetchRequestsByCommunityForUser",
    async ({ communityId, userId }, thunkAPI) => {
        try {
            const res = await api.get(`/comRequest/${communityId}/user/${userId}`)
            return res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// ===== CREATE REQUEST FUNCTIONS =====

// Create a new request (admin)
export const createRequest = createAsyncThunk(
    "request/createRequest",
    async (requestData, thunkAPI) => {
        try {
            const res = await api.post(`/requests`, requestData)
            return res.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Create a new community request
export const createCommunityRequest = createAsyncThunk(
    "request/createCommunityRequest",
    async (requestData, thunkAPI) => {
        try {
            const res = await api.post(`/comRequest`, requestData)
            return res.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// ===== RESPOND TO REQUEST FUNCTIONS =====

// Respond to requests (batch processing) - admin
export const respondToRequests = createAsyncThunk(
    "request/respondToRequests",
    async (requestsData, thunkAPI) => {
        try {
            const res = await api.put(`/requests/respond`, requestsData)
            return res.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Respond to community requests (batch processing)
export const respondToCommunityRequests = createAsyncThunk(
    "request/respondToCommunityRequests",
    async (requestsData, thunkAPI) => {
        try {
            const res = await api.put(`/comRequest/respond`, requestsData)
            return res.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// ===== UPDATE REQUEST STATUS FUNCTIONS =====

// Update request status (approve/reject single request) - admin
export const updateRequestStatus = createAsyncThunk(
    "request/updateRequestStatus",
    async ({ requestId, statusData }, thunkAPI) => {
        try {
            const res = await api.put(`/requests/${requestId}/status`, statusData)
            return res.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Update community request status (approve/reject single request)
export const updateCommunityRequestStatus = createAsyncThunk(
    "request/updateCommunityRequestStatus",
    async ({ requestId, statusData }, thunkAPI) => {
        try {
            const res = await api.put(`/comRequest/${requestId}/status`, statusData)
            return res.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// ===== LEGACY FUNCTIONS FOR BACKWARD COMPATIBILITY =====

// Legacy function for backward compatibility - now uses /requests/pending
export const fetchRequests = createAsyncThunk(
    "request/fetchRequests",
    async (_, thunkAPI) => {
        try {
            const res = await api.get(`/requests/pending`)
            return res.data.data
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// Legacy function for backward compatibility
export const fetchUserRequests = createAsyncThunk(
    "request/fetchUserRequests",
    async (userId, thunkAPI) => {
        try {
            const res = await api.get(`/requests/user/${userId}`)
            return res.data.request
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e.response?.data || e.message)
        }
    }
)

// ===== REDUX SLICE =====

const requestSlice = createSlice({
    name: "request",
    initialState,
    reducers: {
        clearRequests: (state) => {
            state.requests = []
            state.userRequests = []
            state.approvedRequests = []
            state.pendingRequests = []
            state.allRequests = []
        },
        clearError: (state) => {
            state.error = null
        }
    },
    extraReducers: (builder) => {
        // ===== ADMIN REQUEST CASES =====
        
        // Loading states
        builder.addCase(fetchAllRequests.pending, (state) => {
            state.loading = true
            state.error = null
        })
        builder.addCase(fetchAllRequests.fulfilled, (state, action) => {
            state.loading = false
            state.allRequests = Array.isArray(action.payload) ? action.payload : []
        })
        builder.addCase(fetchAllRequests.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
            state.allRequests = []
        })

        builder.addCase(fetchAllPendingRequests.pending, (state) => {
            state.loading = true
            state.error = null
        })
        builder.addCase(fetchAllPendingRequests.fulfilled, (state, action) => {
            state.loading = false
            state.pendingRequests = Array.isArray(action.payload) ? action.payload : []
        })
        builder.addCase(fetchAllPendingRequests.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
            state.pendingRequests = []
        })

        builder.addCase(fetchAllApprovedRequests.pending, (state) => {
            state.loading = true
            state.error = null
        })
        builder.addCase(fetchAllApprovedRequests.fulfilled, (state, action) => {
            state.loading = false
            state.approvedRequests = Array.isArray(action.payload) ? action.payload : []
        })
        builder.addCase(fetchAllApprovedRequests.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
            state.approvedRequests = []
        })

        builder.addCase(fetchRequestById.fulfilled, (state, action) => {
            state.requests = [action.payload]
        })

        // ===== LEGACY CASES FOR BACKWARD COMPATIBILITY =====
        builder.addCase(fetchRequests.fulfilled, (state, action) => {
            state.requests = action.payload
        })

        builder.addCase(fetchUserRequests.fulfilled, (state, action) => {
            state.userRequests = action.payload
        })

        // ===== USER REQUEST CASES =====
        builder.addCase(fetchRequestsByUser.fulfilled, (state, action) => {
            state.userRequests = action.payload
        })

        builder.addCase(fetchPendingRequestsByUser.fulfilled, (state, action) => {
            state.pendingRequests = action.payload
        })

        builder.addCase(fetchApprovedRequestsByUser.fulfilled, (state, action) => {
            state.approvedRequests = action.payload
        })

        builder.addCase(fetchAllRequestsByUser.fulfilled, (state, action) => {
            state.allRequests = action.payload
        })

        // ===== COMMUNITY REQUEST CASES =====
        builder.addCase(fetchRequestsByCommunity.fulfilled, (state, action) => {
            state.requests = action.payload
        })

        builder.addCase(fetchApprovedRequestsByCommunity.fulfilled, (state, action) => {
            state.approvedRequests = action.payload
        })

        builder.addCase(fetchAllRequestsByCommunity.fulfilled, (state, action) => {
            state.allRequests = action.payload
        })

        builder.addCase(fetchRequestsByCommunityForUser.fulfilled, (state, action) => {
            state.requests = action.payload
        })
    }
})

export const { clearRequests, clearError } = requestSlice.actions

// ===== SELECTORS =====
export const requests = (state) => state.request.requests
export const userRequests = (state) => state.request.userRequests
export const approvedRequests = (state) => state.request.approvedRequests
export const pendingRequests = (state) => state.request.pendingRequests
export const allRequests = (state) => state.request.allRequests
export const requestLoading = (state) => state.request.loading
export const requestError = (state) => state.request.error

export default requestSlice