import axios from "axios";
import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config()

const app = express();
const port = process.env.PORT || 3000;
const elasticUrl = process.env.ES_URL || "http://elasticsearch:9200/youtube";

app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
    const { from, size } = req.query;
    const data = {
        from,
        size,
        sort: [{ publishedAt: { order: "desc" } }],
    };

    try {
        const response = await axios.post(`${elasticUrl}/_search`, data, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        res.json(response.data);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

app.post("/search", async (req: Request, res: Response) => {
    const { from, size } = req.query;
    const data = {
        from,
        size,
        query: {
            multi_match: {
                query: req.body.query,
                fields: ["title", "description"],
            },
        },
    };

    try {
        const response = await axios.post(`${elasticUrl}/_search`, data, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        res.json(response.data)
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
