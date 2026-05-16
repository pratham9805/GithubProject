/**
 * Chat Slice — Conversation State
 * Manages per-repo chat history, streaming state, and AI settings.
 * Persisted to localStorage via redux-persist.
 */

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Conversations keyed by namespace: { [namespace]: Message[] }
  // Message shape: { id, role, content, sources, timestamp, isStreaming }
  conversations: {},

  // Streaming state (ephemeral)
  isStreaming: false,
  streamingContent: "",
  // 'retrieving' | 'reranking' | 'generating' | null
  thinkingPhase: null,

  // AI Settings (persisted — user preferences survive refresh)
  settings: {
    model: "gpt-4.1-mini",
    temperature: 0.3,
    topK: 5,
    maxTokens: 1500,
  },
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Add a complete message to a namespace's conversation
    addMessage: (state, action) => {
      const { namespace, message } = action.payload;
      if (!state.conversations[namespace]) {
        state.conversations[namespace] = [];
      }
      state.conversations[namespace].push({
        ...message,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toISOString(),
      });
    },

    // Update the last message in a namespace (used to finalise streaming)
    updateLastMessage: (state, action) => {
      const { namespace, updates } = action.payload;
      const msgs = state.conversations[namespace];
      if (msgs && msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        msgs[msgs.length - 1] = { ...last, ...updates };
      }
    },

    clearConversation: (state, action) => {
      const namespace = action.payload;
      state.conversations[namespace] = [];
    },

    removeConversation: (state, action) => {
      const namespace = action.payload;
      delete state.conversations[namespace];
    },

    startStreaming: (state) => {
      state.isStreaming = true;
      state.streamingContent = "";
      state.thinkingPhase = "retrieving";
    },

    appendStreamChunk: (state, action) => {
      state.streamingContent += action.payload;
      // Once tokens flow, we are in generating phase
      state.thinkingPhase = "generating";
    },

    setThinkingPhase: (state, action) => {
      state.thinkingPhase = action.payload; // 'retrieving'|'reranking'|'generating'|null
    },

    stopStreaming: (state) => {
      state.isStreaming = false;
      state.streamingContent = "";
      state.thinkingPhase = null;
    },

    // ─── AI Settings ────────────────────────────────────────────────────────

    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    resetSettings: (state) => {
      state.settings = initialState.settings;
    },
  },
});

export const {
  addMessage,
  updateLastMessage,
  clearConversation,
  removeConversation,
  startStreaming,
  appendStreamChunk,
  setThinkingPhase,
  stopStreaming,
  updateSettings,
  resetSettings,
} = chatSlice.actions;

export const selectConversation = (namespace) => (state) =>
  state.chat.conversations[namespace] || [];
export const selectAllConversations = (state) => state.chat.conversations;
export const selectIsStreaming     = (state) => state.chat.isStreaming;
export const selectStreamingContent= (state) => state.chat.streamingContent;
export const selectThinkingPhase   = (state) => state.chat.thinkingPhase;
export const selectChatSettings    = (state) => state.chat.settings;

export default chatSlice.reducer;
