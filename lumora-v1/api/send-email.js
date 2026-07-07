import { Resend } from 'resend';

const resend = new Resend('re_T4wKF2fF_FWjPykMBp8qhEVEwCsKZZ3bx');

export default async function handler(req, res) {
  try {
    const { email, subject, html } = req.body;
    await resend.emails.send({
      from: 'LUMORA <onboarding@resend.dev>',
      to: email,
      subject: subject,
      html: html,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}