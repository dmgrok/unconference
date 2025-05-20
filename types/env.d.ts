declare module '@nuxt/schema' {
  interface RuntimeConfig {
    topicsFilePath: string
    usersFilePath: string
    public: {
      maxVotesPerTopic: number
      topTopicsCount: number
    }
  }
}
