import { create } from 'zustand'

type Store = {
    jobTitle: string,
    jobDescription: string,
    companyName: string,
    companyDescription: string,
    resume: string,
    updateResume: (newResume: string) => void,
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
    resume: "",
    updateResume: (newResume: string) => set({resume: newResume}),
    updateJobTitle: (newJobTitle: string) => set({ jobTitle: newJobTitle}),
    updateJobDescription: (newJobDescription: string) => set({ jobDescription: newJobDescription}),
    updateCompanyName: (newCompanyName: string) => set({ companyName: newCompanyName}),
    updateCompanyDescription: (newCompanyDescription: string) => set({ companyDescription: newCompanyDescription}),
}))

export default useJobStore;