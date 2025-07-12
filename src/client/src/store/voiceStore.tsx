import { create } from 'zustand'

type Store = {
    wsRef: WebSocket | null,
    queContent: string,
    updateWsRef: (newWsRef: WebSocket | null) => void,
    updateQueContent: (newContent: string) => void
}

const useVoiceStore = create<Store>()((set) => ({
    wsRef: null,
    queContent: '',
    updateWsRef: (newWsRef: WebSocket | null) => set({ wsRef: newWsRef}),
    updateQueContent: (newContent: string) => set({queContent: newContent})
}))

export default useVoiceStore;