export type YoutubeResponse = {

  id : {
    videoId: string
  }
  snippet : {
    publishedAt: Date
    title: string
    description: string
  }
}