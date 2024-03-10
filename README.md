# Overview

- [x] Server should call the YouTube API continuously in background (async) with some interval (say 10 seconds) for fetching the latest videos for a predefined search query and should store the data of videos (specifically these fields - Video title, description, publishing datetime, thumbnails URLs and any other fields you require) in a database with proper indexes.
- [x] A GET API which returns the stored video data in a paginated response sorted in descending order of published datetime.
- [x] A basic search API to search the stored videos using their title and description.
- [x] Dockerize the project.
- [x] It should be scalable and optimised.
- [x] Add support for supplying multiple API keys so that if quota is exhausted on one, it automatically uses the next available key.
- [x] Optimise search api, so that it's able to search videos containing partial match for the search query in either video title or description

# Setup 
1. Clone the repository
2. From the root directory, run ```bash start.sh```
3. Wait for a minute to let all containers spin up

# Usage

1. Making a paginated get request
   
`GET http://localhost:3000/search?from=0&size=4`

```from``` and ```size``` are being used for pagination. 

**Example Curl:** `curl --location 'http://localhost:3000?from=0&size=4'`

2. Making partial search request
   
`POST http://localhost:3000/search?from=0&size=4`

Body: `{
    "query": "cricket india"
}`

**Example Curl:** `curl --location 'http://localhost:3000/search?from=0&size=4' \
--header 'Content-Type: application/json' \
--data '{
    "query": "cricket india"
}'`

# How does it work?

## Tech Stack
TypeScript, Elastic Search, Docker, NodeJS

## System Design 
- The `writer` service is responsible for sending api requests to youtube every 10 seconds and storing the response in Elastic Search. Title, Description, ID and PublishedAt are being stored.
- The `gateway` service is responsible for providing the api endpoints for the user.
  
