import { Resend } from "resend";

const CONTACT_EMAIL = "wholesale@thestables.world";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json();
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!fullName || !email || !message) {
    return Response.json(
      { error: "Full name, email, and message are required." },
      { status: 400 },
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Invalid email address." }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: `The Stables Website <${CONTACT_EMAIL}>`,
    to: CONTACT_EMAIL,
    replyTo: email,
    subject: subject ? `Wholesale inquiry: ${subject}` : "New wholesale inquiry",
    text: [
      `Name: ${fullName}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      subject ? `Subject: ${subject}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (error) {
    return Response.json({ error: "Failed to send message." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
