import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import emailRoutes from "./routes/email.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api", emailRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 Lumora Backend Running Successfully"
    });
});

export default app;

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
