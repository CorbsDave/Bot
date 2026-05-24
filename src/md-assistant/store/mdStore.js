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
  setGoogleAuth: (auth) => set({ googleAuth: auth }),
  setMsAuth: (auth) => set({ msAuth: auth }),

  setEmails: (emails) => set({ emails }),
  setCalendarEvents: (calendarEvents) => set({ calendarEvents }),

  setActiveView: (activeView) => set({ activeView, selectedEmail: null }),
  selectEmail: (selectedEmail) => set({ selectedEmail }),

  addAiMessage: (message) =>
    set((state) => ({ aiMessages: [...state.aiMessages, message] })),
  clearAiMessages: () => set({ aiMessages: [] }),

  setLoading: (isLoading) => set({ isLoading }),
  setFetchingEmails: (isFetchingEmails) => set({ isFetchingEmails }),
  setFetchingCalendar: (isFetchingCalendar) => set({ isFetchingCalendar }),

  clearAuth: () =>
    set({
      googleAuth: { token: null, user: null, connected: false },
      msAuth: { token: null, user: null, connected: false },
      emails: [],
      calendarEvents: [],
      activeView: 'dashboard',
      selectedEmail: null,
      aiMessages: [],
    }),

  // Update triage for a specific email
  updateEmailTriage: (emailId, triage) =>
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === emailId ? { ...e, triage } : e
      ),
    })),
}));

export default useMdStore;
