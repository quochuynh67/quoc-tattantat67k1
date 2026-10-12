import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_HISTORY = 40;

const useColoringStore = create(
  persist(
    (set, get) => ({
      currentPageId: 'ice-cream',
      currentColor: '#FF4500',
      tool: 'brush', // 'brush' | 'eraser'
      // Cấu trúc pages: { [pageId]: { [pathId]: color } }
      pages: {}, 
      customPages: {}, // { [id]: { name, svgRaw } }
      // Undo/Redo stacks per page: { [pageId]: { undo: [...snapshots], redo: [...snapshots] } }
      history: {},

      setCurrentPage: (id) => set({ currentPageId: id }),
      setCurrentColor: (color) => set({ currentColor: color }),
      setTool: (tool) => set({ tool }),
      
      // Hàm lưu màu cho một vùng (with undo history)
      colorRegion: (pageId, regionId, color) => {
        const state = get();
        const currentPageState = state.pages[pageId] || {};
        const previousSnapshot = { ...currentPageState };

        // Update undo stack
        const pageHistory = state.history[pageId] || { undo: [], redo: [] };
        const newUndo = [...pageHistory.undo, previousSnapshot].slice(-MAX_HISTORY);

        set({
          pages: {
            ...state.pages,
            [pageId]: {
              ...currentPageState,
              [regionId]: color,
            }
          },
          history: {
            ...state.history,
            [pageId]: {
              undo: newUndo,
              redo: [], // Clear redo on new action
            }
          }
        });
      },

      // Eraser: xóa fill của vùng (về trắng)
      eraseRegion: (pageId, regionId) => {
        const state = get();
        const currentPageState = state.pages[pageId] || {};
        const previousSnapshot = { ...currentPageState };

        const pageHistory = state.history[pageId] || { undo: [], redo: [] };
        const newUndo = [...pageHistory.undo, previousSnapshot].slice(-MAX_HISTORY);

        const newPageState = { ...currentPageState };
        delete newPageState[regionId]; // Remove fill → reverts to SVG default (white)

        set({
          pages: {
            ...state.pages,
            [pageId]: newPageState,
          },
          history: {
            ...state.history,
            [pageId]: {
              undo: newUndo,
              redo: [],
            }
          }
        });
      },

      // Undo
      undo: (pageId) => {
        const state = get();
        const pageHistory = state.history[pageId] || { undo: [], redo: [] };
        if (pageHistory.undo.length === 0) return;

        const currentPageState = state.pages[pageId] || {};
        const previousSnapshot = pageHistory.undo[pageHistory.undo.length - 1];
        const newUndo = pageHistory.undo.slice(0, -1);
        const newRedo = [...pageHistory.redo, { ...currentPageState }].slice(-MAX_HISTORY);

        set({
          pages: {
            ...state.pages,
            [pageId]: previousSnapshot,
          },
          history: {
            ...state.history,
            [pageId]: {
              undo: newUndo,
              redo: newRedo,
            }
          }
        });
      },

      // Redo
      redo: (pageId) => {
        const state = get();
        const pageHistory = state.history[pageId] || { undo: [], redo: [] };
        if (pageHistory.redo.length === 0) return;

        const currentPageState = state.pages[pageId] || {};
        const nextSnapshot = pageHistory.redo[pageHistory.redo.length - 1];
        const newRedo = pageHistory.redo.slice(0, -1);
        const newUndo = [...pageHistory.undo, { ...currentPageState }].slice(-MAX_HISTORY);

        set({
          pages: {
            ...state.pages,
            [pageId]: nextSnapshot,
          },
          history: {
            ...state.history,
            [pageId]: {
              undo: newUndo,
              redo: newRedo,
            }
          }
        });
      },

      // Check if undo/redo available
      canUndo: (pageId) => {
        const pageHistory = get().history[pageId] || { undo: [] };
        return pageHistory.undo.length > 0;
      },
      canRedo: (pageId) => {
        const pageHistory = get().history[pageId] || { redo: [] };
        return pageHistory.redo.length > 0;
      },

      // Reset bức tranh hiện tại
      resetPage: (pageId) =>
        set((state) => {
          const newPages = { ...state.pages };
          delete newPages[pageId];
          return { 
            pages: newPages,
            history: {
              ...state.history,
              [pageId]: { undo: [], redo: [] }
            }
          };
        }),

      addCustomPage: (id, name, svgRaw) => 
        set((state) => ({
          customPages: {
            ...state.customPages,
            [id]: { name, svgRaw }
          },
          currentPageId: id,
        })),

      deleteCustomPage: (id) =>
        set((state) => {
          const newCustomPages = { ...state.customPages };
          delete newCustomPages[id];
          const newPages = { ...state.pages };
          delete newPages[id];
          const newHistory = { ...state.history };
          delete newHistory[id];
          return {
            customPages: newCustomPages,
            pages: newPages,
            history: newHistory,
            currentPageId: state.currentPageId === id ? 'ice-cream' : state.currentPageId
          };
        }),
    }),
    {
      name: 'coloring-game-storage', // Tên key sẽ lưu trong localStorage (Hydrate & Auto-save)
      partialize: (state) => ({
        currentPageId: state.currentPageId,
        currentColor: state.currentColor,
        tool: state.tool,
        pages: state.pages,
        customPages: state.customPages,
        // Don't persist history to keep localStorage small
      }),
    }
  )
);

export default useColoringStore;
