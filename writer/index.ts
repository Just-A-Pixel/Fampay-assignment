import cron from "node-cron";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import dotenv from "dotenv";
import { YoutubeResponse } from "./types";
// import Youtube from "youtube"

dotenv.config();

const cronDuration = process.env.CRON || "*/10 * * * * *";
const apiKey = process.env.API || "AIzaSyAVAzrISpiXGc0iqq5JVA7TMno6cQ9Lu4M";
const searchQuery = "anime";
const publishedAfterDateTime = "2024-01-01T12:00:00Z";
const apiEndpoint = "https://www.googleapis.com/youtube/v3/search";

async function fetchLatestVideos(
    apiKey: string,
    searchQuery: string
): Promise<YoutubeResponse> {
    const params: any = {
        key: apiKey,
        part: "snippet",
        maxResults: 10,
        q: searchQuery,
        type: "video",
        publishedAfter: publishedAfterDateTime,
    };

    try {
        const response: AxiosResponse<YoutubeResponse, AxiosRequestConfig> =
            await axios.get(apiEndpoint, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching latest videos:", error);
        throw error;
    }
}

cron.schedule(cronDuration, async () => {
    // Fetch youtube api
    try {
        const data = await fetchLatestVideos(apiKey, searchQuery);
        console.log(data);
    } catch (error) {
        console.error(error);
    }

    // Post to elastic
});
