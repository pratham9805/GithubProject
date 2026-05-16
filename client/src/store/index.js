/**
 * Redux Store — Root Configuration
 * Combines all slices and sets up redux-persist for localStorage.
 *
 * Persisted slices: repo, chat (survive page refresh)
 * Not persisted: app (UI state resets on refresh)
 */

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore, persistReducer, createTransform,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
} from "redux-persist";
// Manual storage adapter to avoid Vite ESM/CJS issues with redux-persist/lib/storage
const storage = {
  getItem(key) {
    return Promise.resolve(window.localStorage.getItem(key));
  },
  setItem(key, value) {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem(key) {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

import appReducer from "./appSlice";
import repoReducer from "./repoSlice";
import chatReducer from "./chatSlice";

/**
 * Strip volatile streaming state before it is written to localStorage.
 * Without this, a page refresh while AI is typing would leave isStreaming=true
 * permanently and freeze the input bar.
 */
const chatTransform = createTransform(
  // inbound → sanitise before saving
  (state) => ({ ...state, isStreaming: false, streamingContent: "" }),
  // outbound → sanitise when rehydrating
  (state) => ({ ...state, isStreaming: false, streamingContent: "" }),
  { whitelist: ["chat"] }
);

// Persist config — only repo and chat slices are saved to localStorage
const persistConfig = {
  key: "github-qa-bot",
  storage,
  whitelist: ["repo", "chat"],
  transforms: [chatTransform],
};

const rootReducer = combineReducers({
  app: appReducer,
  repo: repoReducer,
  chat: chatReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Required: ignore redux-persist internal actions from serializability check
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
