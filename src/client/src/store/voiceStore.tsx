import { create } from 'zustand'

type Store = {
    wsRef: WebSocket | null
    updateWsRef: () => void
}

const useVoiceStore = create<Store>()((set) => ({
    wsRef: null,
    updateWsRef: () => set((state) => ({ wsRef: state.wsRef})),
}))

export default useVoiceStore;