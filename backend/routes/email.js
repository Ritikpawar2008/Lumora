import express from "express";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/send-email", async (req, res) => {
    try {

        const { to, subject, message } = req.body;

        if (!to || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: "Please fill all required fields."
            });
        }

        const { data, error } = await resend.emails.send({
            from: "LUMORA <onboarding@resend.dev>",
            to: [to],
            subject: subject,
            html: `
                <div style="font-family:Arial,sans-serif;padding:20px;">
                    <h2>${subject}</h2>

                    <p style="white-space:pre-line;">
                        ${message}
                    </p>

                    <br>

                    <p>Regards,</p>
                    <h3>Team LUMORA</h3>
                </div>
            `
        });

        if (error) {
            return res.status(500).json({
                success: false,
                error
            });
        }

        return res.status(200).json({
            success: true,
            data
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            error: err.message
        });

    }
});

export default router;