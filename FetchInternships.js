import "dotenv/config";
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5001;
const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;

app.use(cors());
app.use(express.json());

// Route to fetch internships from Jooble
app.get("/api/internships", async (req, res) => {
    try {
        const response = await axios.post(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
            keywords: "internship",
            location: "India", // Adjust as needed
        });

        res.json(response.data.jobs);
    } catch (error) {
        console.error("Error fetching internships:", error);
        res.status(500).json({ error: "Failed to fetch internships" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
