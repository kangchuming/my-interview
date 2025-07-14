import { create } from 'zustand'

type Store = {
    jobTitle: string,
    jobDescription: string,
    companyName: string,
    companyDescription: string,
    updateJobTitle: (newJobTitle: string) => void,
    updateJobDescription: (newJobDescription: string) => void,
    updateCompanyName: (newCompanyName: string) => void,
    updateCompanyDescription: (newCompanyDescription: string) => void
}

const useJobStore = create<Store>()((set) => ({
    jobTitle: "",
    jobDescription: "",
    companyName: "",
    companyDescription: "",
    updateJobTitle: (newJobTitle: string) => set({ jobTitle: newJobTitle}),
    updateJobDescription: (newJobDescription: string) => set({ jobDescription: newJobDescription}),
    updateCompanyName: (newCompanyName: string) => set({ companyName: newCompanyName}),
    updateCompanyDescription: (newCompanyDescription: string) => set({ companyDescription: newCompanyDescription}),
}))

export default useJobStore;