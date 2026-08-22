type SendResult = { sent: boolean; reason?: string };

export async function sendInviteEmail(params: {
  to: string;
  circleName: string;
  inviterName: string;
  link: string;
}): Promise<SendResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EMAIL_FROM"];
  if (!apiKey || !from) {
    return { sent: false, reason: "Email sending isn't set up yet — copy the link and send it yourself." };
  }

  const html = `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px;color:#2b2320">
      <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(params.inviterName)} shared a circle with you</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px">
        You've been invited to co-own the circle <strong>${escapeHtml(params.circleName)}</strong> on FriendCircles.
        This link works once and expires in 14 days.
      </p>
      <p style="margin:0 0 24px">
        <a href="${params.link}" style="background:#b4643c;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-family:Helvetica,sans-serif;font-size:15px">Accept invite</a>
      </p>
      <p style="font-size:12px;color:#7a6b64;word-break:break-all">${params.link}</p>
    </div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: `${params.inviterName} shared "${params.circleName}" with you`,
        html,
      }),
    });
    if (!response.ok) {
      console.error("[invite-email] send failed", response.status, await response.text());
      return { sent: false, reason: "We couldn't send the email — copy the link instead." };
    }
    return { sent: true };
  } catch (error) {
    console.error("[invite-email] send error", error);
    return { sent: false, reason: "We couldn't send the email — copy the link instead." };
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );
}
