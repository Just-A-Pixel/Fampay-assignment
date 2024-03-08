import cron from "node-cron";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import dotenv from "dotenv";
import { BulkDocument, DataAction, IndexAction, YoutubeResponse } from "./types";

dotenv.config();

const cronDuration = process.env.CRON || "*/10 * * * * *";
const apiKey = process.env.API || "AIzaSyAVAzrISpiXGc0iqq5JVA7TMno6cQ9Lu4M";
const searchQuery = "anime";
const publishedAfterDateTime = "2024-01-01T12:00:00Z";
const apiEndpoint = "https://www.googleapis.com/youtube/v3/search";
const indexName = "youtube";
const elasticURL = "http://localhost:9200/" + indexName;

async function createOrUpdateMapping(indexName: string) {
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
        console.error("Error creating or updating mapping:", error);
    }
}

async function bulkWriteDocuments(data: BulkDocument[]) {
   
    let result = ''
    for (let i = 0; i < data.length; i++) {
        result += JSON.stringify(data[i]) + '\n';
    }

    try {
        const response = await axios.post(elasticURL + "/_bulk", result, {
            headers: {
                "Content-Type": "application/x-ndjson", // Set content type as newline-delimited JSON
            },
        });

        console.log("Bulk write response:", response.data);
    } catch (error) {
        console.error("Error performing bulk write:", error);
    }
}

createOrUpdateMapping(indexName)

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
        console.error("Error fetching latest videos:", error);
        throw error;
    }
}

function parseYoutubeResponseToElasticBulkRequest(youtubeResponse: YoutubeResponse[]) : BulkDocument[] {
  let result : BulkDocument[] = []

  for(let i = 0; i<youtubeResponse.length; i++) {
    const currentResponse = youtubeResponse[i];

    const currentIndexAction : IndexAction = {
      index: {
        _index: indexName,
        _id: currentResponse.id.videoId
      }
    }

    const currentDataAction : DataAction = {
      publishedAt: currentResponse.snippet.publishedAt,
      title: currentResponse.snippet.title,
      description: currentResponse.snippet.description
    }

    result.push(
      currentIndexAction,
      currentDataAction
    )
  }

  return result
}

cron.schedule(cronDuration, async () => {
    let data: YoutubeResponse[] = [];
    // Fetch youtube api
    try {
        data = await fetchLatestVideos(apiKey, searchQuery);
        console.log(data);
    } catch (error) {
        console.error(error);
    }

    // Parse data
    const parsedData = parseYoutubeResponseToElasticBulkRequest(data)
    console.log(parsedData)

    // Post to elastic
    bulkWriteDocuments(parsedData);
    
});



// pass:  1-SA0hpwGDV3WHTGaFIY
//  0ebc24f50627d564620ccbd2d6ee0bc8ac6c477790c1b438d560ec3ef93ab7a4

// npm run build && npm start
