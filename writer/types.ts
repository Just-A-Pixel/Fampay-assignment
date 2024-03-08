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

export type IndexAction = {
  index: {
    _index: string;
    _id: string;
  };
};

export type DataAction = {
  publishedAt: Date;
  title: string;
  description: string;
};

export type BulkDocument = IndexAction | DataAction;