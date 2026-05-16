/**
 * Repo Slice — Repository State
 * Manages analyzed repos list, active repo, and real-time ingestion progress.
 * Persisted to localStorage via redux-persist.
 */

import { createSlice } from "@reduxjs/toolkit";

const initialIngestion = {
  status: "idle", // "idle" | "running" | "complete" | "error"
  message: "",
  filesFound: 0,
  filesProcessed: 0,
  totalFiles: 0,
  chunksCreated: 0,
  vectorsStored: 0,
  progress: 0,
};

const initialState = {
  // Persisted list of analyzed repos (max 20)
  // Shape: { namespace, repoUrl, repoName, metadata, stats, summary, analyzedAt }
  analyzedRepos: [],

  // Currently selected/active repo
  activeRepo: null,

  // Live ingestion progress (not persisted — resets on refresh)
  ingestion: initialIngestion,
};

const repoSlice = createSlice({
  name: "repo",
  initialState,
  reducers: {
    setActiveRepo: (state, action) => {
      state.activeRepo = action.payload;
    },

    addAnalyzedRepo: (state, action) => {
      const repo = action.payload;
      // Replace existing entry if same namespace
      state.analyzedRepos = state.analyzedRepos.filter(
        (r) => r.namespace !== repo.namespace
      );
      // Prepend new repo, cap at 20
      state.analyzedRepos = [repo, ...state.analyzedRepos].slice(0, 20);
      state.activeRepo = repo;
    },

    removeRepo: (state, action) => {
      const namespace = action.payload;
      state.analyzedRepos = state.analyzedRepos.filter(
        (r) => r.namespace !== namespace
      );
      if (state.activeRepo?.namespace === namespace) {
        state.activeRepo = state.analyzedRepos[0] || null;
      }
    },

    clearAllRepos: (state) => {
      state.analyzedRepos = [];
      state.activeRepo = null;
    },

    // ─── Ingestion Progress ─────────────────────────────────────────────────

    startIngestion: (state) => {
      state.ingestion = {
        ...initialIngestion,
        status: "running",
        message: "Starting ingestion...",
      };
    },

    updateIngestion: (state, action) => {
      state.ingestion = { ...state.ingestion, ...action.payload };
    },

    completeIngestion: (state) => {
      state.ingestion.status = "complete";
      state.ingestion.progress = 100;
      state.ingestion.message = "Ingestion complete!";
    },

    failIngestion: (state, action) => {
      state.ingestion.status = "error";
      state.ingestion.message = action.payload || "Ingestion failed.";
    },

    resetIngestion: (state) => {
      state.ingestion = initialIngestion;
    },
  },
});

export const {
  setActiveRepo,
  addAnalyzedRepo,
  removeRepo,
  clearAllRepos,
  startIngestion,
  updateIngestion,
  completeIngestion,
  failIngestion,
  resetIngestion,
} = repoSlice.actions;

// Selectors
export const selectAnalyzedRepos = (state) => state.repo.analyzedRepos;
export const selectActiveRepo = (state) => state.repo.activeRepo;
export const selectIngestion = (state) => state.repo.ingestion;

export default repoSlice.reducer;
