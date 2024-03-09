import cron from "node-cron";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import dotenv from "dotenv";
import {
    BulkDocument,
    DataAction,
    IndexAction,
    YoutubeResponse,
} from "./types";

dotenv.config();

const searchQuery = "cricket";
const indexName = "youtube";
const publishedAfterDateTime = "2023-01-01T12:00:00Z";
const cronDuration = process.env.CRON || "*/10 * * * * *";
const apiEndpoint = process.env.YOUTUBE_API || "https://www.googleapis.com/youtube/v3/search";
const elasticHost = process.env.ES_HOST || "http://elasticsearch:9200"
const elasticURL =  `${elasticHost}/${indexName}`
const youtubeAPIKeys = process.env.YOUTUBE_API_KEY || "AIzaSyAVAzrISpiXGc0iqq5JVA7TMno6cQ9Lu4M,AIzaSyAVAzrISpiXGc0iqq5JVA7TMno6cQ9Lu4M,AIzaSyAVAzrISpiXGc0iqq5JVA7TMno6cQ9Lu4M";
const youtubeAPIKeyArray = youtubeAPIKeys.split(',')


let isMapped = false;
let currentYoutubeAPIKeyIndex = 0;
let currentYoutubeAPIKey = youtubeAPIKeyArray[currentYoutubeAPIKeyIndex]

function setNextApiKey() {
  if (currentYoutubeAPIKeyIndex === youtubeAPIKeyArray.length - 1) {
    console.log("All API Keys seem to be exhausted. Retraversing list.")
  }

  currentYoutubeAPIKeyIndex = (currentYoutubeAPIKeyIndex+1) % youtubeAPIKeyArray.length
  currentYoutubeAPIKey = youtubeAPIKeyArray[currentYoutubeAPIKeyIndex]
}

async function createOrUpdateMapping() {
    const mapping = {
        mappings: {
            properties: {
                publishedAt: {
                    type: "date",
                    format: "strict_date_optional_time",
                },
                title: {
                    type: "text",
                },
                description: {
                    type: "text",
                },
            },
        },
    };

    try {
        const response = await axios.put(elasticURL, mapping);
        console.log("Successfully created or updated mapping:", response);
    } catch (error) {
        console.error("Error creating or updating mapping");
        throw error;
    }
}

async function bulkWriteDocuments(data: BulkDocument[]) {
    let result = "";
    for (let i = 0; i < data.length; i++) {
        result += JSON.stringify(data[i]) + "\n";
    }

    try {
        const response = await axios.post(elasticURL + "/_bulk", result, {
            headers: {
                "Content-Type": "application/x-ndjson",
            },
        });

        console.log("Bulk write response:", response.data);
    } catch (error) {
        console.error("Error performing bulk write:", error);
    }
}

async function fetchLatestVideos(
    apiKey: string,
    searchQuery: string
): Promise<YoutubeResponse[]> {
    const params: any = {
        key: apiKey,
        part: "snippet",
        maxResults: 10,
        q: searchQuery,
        type: "video",
        publishedAfter: publishedAfterDateTime,
    };

    try {
        const response = await axios.get(apiEndpoint, { params });
        return response.data.items;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
            console.log("Youtube API KEY exhausted, setting next available API KEY");
            setNextApiKey()
            console.log("New API KEY (Showing for project purpose):", currentYoutubeAPIKey)
            throw null;
        }
        console.error("Error fetching latest videos:", error);
        throw error;
    }
}

function parseYoutubeResponseToElasticBulkRequest(
    youtubeResponse: YoutubeResponse[]
): BulkDocument[] {
    let result: BulkDocument[] = [];

    for (let i = 0; i < youtubeResponse.length; i++) {
        const currentResponse = youtubeResponse[i];

        const currentIndexAction: IndexAction = {
            index: {
                _index: indexName,
                _id: currentResponse.id.videoId,
            },
        };

        const currentDataAction: DataAction = {
            publishedAt: currentResponse.snippet.publishedAt,
            title: currentResponse.snippet.title,
            description: currentResponse.snippet.description,
        };

        result.push(currentIndexAction, currentDataAction);
    }

    return result;
}
cron.schedule(cronDuration, async () => {
    let data: YoutubeResponse[] = [];

    if (!isMapped) {
        try {
            await createOrUpdateMapping();
            isMapped = true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                console.log("ES is already mapped");
                isMapped = true;
            } else {
                console.log(error);
            }
        }
    }

    // Fetch youtube api
    try {
        data = await fetchLatestVideos(currentYoutubeAPIKey, searchQuery);
        console.log(data);
    } catch (error) {
        console.error(error);
        // return;
    }

    data = [
        {
            id: {
                videoId: "dthtfhfdh",
            },
            snippet: {
                publishedAt: new Date(),
                title: "title",
                description: "efwfwsefsef",
            },
        },
    ];

    // Parse data
    const parsedData = parseYoutubeResponseToElasticBulkRequest(data);
    console.log(parsedData);
    // Post to elastic
    bulkWriteDocuments(parsedData);
});

// pass:  1-SA0hpwGDV3WHTGaFIY
//  0ebc24f50627d564620ccbd2d6ee0bc8ac6c477790c1b438d560ec3ef93ab7a4

// npm run build && npm start
