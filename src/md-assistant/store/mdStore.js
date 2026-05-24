import { create } from 'zustand';

const useMdStore = create((set) => ({
  // Auth state
  googleAuth: { token: null, user: null, connected: false },
  msAuth: { token: null, user: null, connected: false },

  // Data
  emails: [],
  calendarEvents: [],

  // UI state
  activeView: 'dashboard',
  selectedEmail: null,
  aiMessages: [],

  // Loading states
  isLoading: false,
  isFetchingEmails: false,
  isFetchingCalendar: false,

  // Actions
  setGoogleAuth: (auth) =>
    set((state) => ({ googleAuth: { ...state.googleAuth, ...auth } })),

  setMsAuth: (auth) =>
    set((state) => ({ msAuth: { ...state.msAuth, ...auth } })),

  setEmails: (emails) => set({ emails }),

  updateEmail: (id, updates) =>
    set((state) => ({
      emails: state.emails.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  setCalendarEvents: (calendarEvents) => set({ calendarEvents }),

  setActiveView: (activeView) => set({ activeView, selectedEmail: null }),

  selectEmail: (email) => set({ selectedEmail: email }),

  addAiMessage: (message) =>
    set((state) => ({ aiMessages: [...state.aiMessages, message] })),

  setAiMessages: (aiMessages) => set({ aiMessages }),

  setLoading: (isLoading) => set({ isLoading }),

  setFetchingEmails: (isFetchingEmails) => set({ isFetchingEmails }),

  setFetchingCalendar: (isFetchingCalendar) => set({ isFetchingCalendar }),

  clearAuth: () =>
    set({
      googleAuth: { token: null, user: null, connected: false },
      msAuth: { token: null, user: null, connected: false },
      emails: [],
      calendarEvents: [],
      selectedEmail: null,
      aiMessages: [],
    }),
}));

export default useMdStore;
