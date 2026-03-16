import { combineReducers, configureStore } from "@reduxjs/toolkit";
import communitySlice from "./features/communitySlice";
import createSessionSlice from "./features/createSessionSlice";
import expertSlice from "./features/expert";
import sessionSlice from "./features/session";
import userSlice from "./features/userSlice";
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
import { PersistGate } from "redux-persist/integration/react";
import partnerSlice from "./features/partnerSlice";
import ticketSlice from "./features/ticket";
import subcommunitySlice from "./features/subCommunitySlice";
import videoSlice from "./features/videoSlice";
import postSlice from "./features/postsSlice";
import blogSlice from "./features/blogSlice";
import resourceSlice from "./features/resourceSlice"
import requestSlice from "./features/requestSlice";

const persistConfig = {
  key: "senior-central-admin",
  version: 1,
  storage,
  // Don't persist user state - let it be managed by localStorage
  blacklist: ['user']
};

const allReducers = combineReducers({
  createSession: createSessionSlice.reducer,
  user: userSlice.reducer,
  session: sessionSlice.reducer,
  expert: expertSlice.reducer,
  community: communitySlice.reducer,
  partner: partnerSlice.reducer,
  ticket: ticketSlice.reducer,
  subcommunity: subcommunitySlice.reducer,
  video: videoSlice.reducer,
  post: postSlice.reducer,
  blog: blogSlice.reducer,
  resource: resourceSlice.reducer,
  request:requestSlice.reducer
});
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
