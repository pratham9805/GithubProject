/**
 * App Slice — Global UI State
 * Controls top-level view and panel open/close states.
 * NOT persisted (UI resets on page refresh).
 */

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  view: "landing", // "landing" | "app"
  sidebarOpen: true,
  settingsOpen: false,
  analyticsOpen: false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setView: (state, action) => {
      state.view = action.payload;
    },
    enterApp: (state) => {
      state.view = "app";
      state.sidebarOpen = true;
    },
    goHome: (state) => {
      state.view = "landing";
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    openSettings: (state) => {
      state.settingsOpen = true;
    },
    closeSettings: (state) => {
      state.settingsOpen = false;
    },
    openAnalytics: (state) => {
      state.analyticsOpen = true;
    },
    closeAnalytics: (state) => {
      state.analyticsOpen = false;
    },
  },
});

export const {
  setView,
  enterApp,
  goHome,
  toggleSidebar,
  setSidebarOpen,
  openSettings,
  closeSettings,
  openAnalytics,
  closeAnalytics,
} = appSlice.actions;

// Selectors
export const selectView = (state) => state.app.view;
export const selectSidebarOpen = (state) => state.app.sidebarOpen;
export const selectSettingsOpen = (state) => state.app.settingsOpen;
export const selectAnalyticsOpen = (state) => state.app.analyticsOpen;

export default appSlice.reducer;
