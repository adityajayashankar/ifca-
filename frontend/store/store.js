import { configureStore, combineReducers } from "@reduxjs/toolkit";
import userSlice from "./features/userSlice";
import sessionSlice from "./features/sessionSlice";
import communitySlice from "./features/communitySlice";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import subcommunitySlice from "./features/subCommunitySlice";
import expertSlice from "./features/expertSlice";
import videoSlice from "./features/videoSlice";
import postSlice from "./features/postsSlice";
import companyData from "@/utils/data";
import createSessionSlice from "./features/createSessionSlice";
import partnerSlice from "./features/partnerSlice";
import resourceSlice from "./features/resourceSlice";

const allReducers = combineReducers({
  createSession: createSessionSlice.reducer, 
   partner: partnerSlice.reducer,
  user: userSlice.reducer,
  session: sessionSlice.reducer,
  community: communitySlice.reducer,
  subcommunity: subcommunitySlice.reducer,
  resource: resourceSlice.reducer,
  expert: expertSlice.reducer,
  video: videoSlice.reducer,
  post: postSlice.reducer,
});

const persistConfig = {
  key: companyData.store,
  storage,
  // Don't persist user state - let it be managed by localStorage
  blacklist: ['user']
};

const rootReducer = (state, action) => {
  if (action.type === "user/logoutUser") {
    // Clear all localStorage items
    localStorage.removeItem('ifca-jwt');
    localStorage.removeItem('ifca-userType');
    localStorage.removeItem('ifca-unifiedUser');
    localStorage.removeItem('ifca-user');
    state = undefined;
  }
  return allReducers(state, action);
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistedStore = persistStore(store);

export default store;
