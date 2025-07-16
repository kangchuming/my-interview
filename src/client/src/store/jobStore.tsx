import { create } from 'zustand'

type ExtractInfo = {
    positionType: string,
    projectKeywords: string[],
    skillGaps: string[],
}

type Store = {
    jobTitle: string,
    jobDescription: string,
    companyName: string,
    companyDescription: string,
    resume: string,
    extractInfo: ExtractInfo,
    updateResume: (newResume: string) => void,
    updateJobTitle: (newJobTitle: string) => void,
    updateJobDescription: (newJobDescription: string) => void,
    updateCompanyName: (newCompanyName: string) => void,
    updateCompanyDescription: (newCompanyDescription: string) => void
    updateExtractInfo: (newExtractInfo: ExtractInfo) => void
}

const useJobStore = create<Store>()((set) => ({
    jobTitle: "",
    jobDescription: "",
    companyName: "",
    companyDescription: "",
    resume: "",
    extractInfo: {
        positionType: '',
        projectKeywords: [],
        skillGaps: [],
    },
    updateResume: (newResume: string) => set({resume: newResume}),
    updateJobTitle: (newJobTitle: string) => set({ jobTitle: newJobTitle}),
    updateJobDescription: (newJobDescription: string) => set({ jobDescription: newJobDescription}),
    updateCompanyName: (newCompanyName: string) => set({ companyName: newCompanyName}),
    updateCompanyDescription: (newCompanyDescription: string) => set({ companyDescription: newCompanyDescription}),
    updateExtractInfo: (newExtractInfo: ExtractInfo) => set({extractInfo: newExtractInfo})
}))

export default useJobStore;