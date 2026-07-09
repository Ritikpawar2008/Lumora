export async function sendEmail(data) {

    const response = await fetch("backend-beta-r.vercel.app/api/send-email", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "Failed to send email");
    }

    return result;
}
