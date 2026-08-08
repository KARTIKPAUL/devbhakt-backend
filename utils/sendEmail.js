import transporter from "../config/mailer.js";

// Fire-and-forget style helper. Email delivery should never be the reason
// a signup or checkout request fails, so errors are logged, not thrown.
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn(`SMTP not configured — skipping email "${subject}" to ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"DevBhakt" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Email send failed:", error.message);
  }
};

export default sendEmail;
