import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());

const PORT = 5005;
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID; // Store in .env
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;
const COUNTRY = "in"; // India

app.get("/api/workshops", async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/1`,
            {
                params: {
                    app_id: ADZUNA_APP_ID,
                    app_key: ADZUNA_API_KEY,
                    what: "workshop", // Searching for workshops
                    results_per_page: 100, // Fetch 100 results
                },
            }
        );

        const workshops = response.data.results.map((workshop) => ({
            title: workshop.title || "Unnamed Workshop",
            company: workshop.company?.display_name || "Unknown",
            location: workshop.location?.display_name || "Unknown",
            url: workshop.redirect_url || "https://api.adzuna.com/v1/api/workshops/gb/search/1",
        }));

        res.json({ workshops });
    } catch (error) {
        console.error("❌ Error fetching workshops:", error.message);
        res.status(500).json({ error: "Failed to fetch workshops" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on https://opportune-frontend-1kbh.vercel.app:${PORT}`));
