import express from "express";
import axios from "axios";

const router = express.Router();

// Fetch Jobs from Adzuna API
router.get("/fetch-jobs", async (req, res) => {
    try {
        const response = await axios.get("https://api.adzuna.com/v1/api/jobs/gb/search/1", {
            params: {
                app_id: "97c3856a", // Replace with your Adzuna app ID
                app_key: "852e595657093c70c34173e1d45cba8f", // Replace with your Adzuna app key
                results_per_page: 40,
                what: "developer",
                where: "London",
            },
            headers: {
                "Content-Type": "application/json",
            }
        });

        console.log("Jobs fetched successfully.");
        res.json({ jobs: response.data.results });
    } catch (error) {
        console.error("Error fetching jobs:", error.message);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
});

// Fetch Applied Jobs from Backend
router.get("/fetch-applied-jobs", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const response = await axios.get("http://localhost:5002/api/applied-jobs", {
            params: { userId }
        });

        console.log("Applied jobs fetched successfully.");
        res.json({ appliedJobs: response.data.appliedJobs.map((job) => job.jobId) });
    } catch (error) {
        console.error("Error fetching applied jobs:", error.message);
        res.status(500).json({ error: "Failed to fetch applied jobs" });
    }
});

// Apply for a Job
router.post("/apply-job", async (req, res) => {
    try {
        const { userId, jobId, jobTitle, company, location, url } = req.body;
        if (!userId || !jobId) {
            return res.status(400).json({ error: "User ID and Job ID are required" });
        }

        const response = await axios.post("http://localhost:5003/api/apply-job", {
            userId, jobId, jobTitle, company, location, url
        });

        console.log("Job application successful.");
        res.json({ message: "Job applied successfully" });
    } catch (error) {
        console.error("Error applying for job:", error.message);
        res.status(500).json({ error: "Failed to apply for job" });
    }
});

export default router;
