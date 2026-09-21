/**
 * mailer.js
 * Gmail SMTP OTP email delivery, shared between dev and production.
 */
import nodemailer from 'nodemailer';

function getSmtpConfig() {
  return {
    user: (process.env.SMTP_USER || '').trim(),
    pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    from: (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim(),
  };
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'*'.repeat(Math.min(user.length - 2, 5))}${user.slice(-1)}@${domain}`;
}

export async function sendOtpEmail(toEmail, otpCode) {
  const smtp = getSmtpConfig();

  if (!smtp.user || !smtp.pass) {
    // No SMTP configured — the console is the only delivery channel available,
    // so the OTP must be printed here for the admin to complete recovery.
    // Once SMTP is configured, the code is emailed only and never logged.
    console.log('\n======================================================');
    console.log(`📧 [OTP EMAIL] Verification code for: ${toEmail}`);
    console.log(`🔑 6-Digit OTP: ${otpCode}`);
    console.log('⏱️  Valid for 10 minutes | Resend cooldown: 30s');
    console.warn('⚠️  [OTP EMAIL] SMTP credentials not set — OTP shown in server log only.');
    console.log('======================================================\n');
    return { emailSent: false, error: '' };
  }

  console.log(`📧 [OTP EMAIL] Sending verification code to ${maskEmail(toEmail)}...`);

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transporter.sendMail({
      from: `"Sri Poondi Mahan Admin" <${smtp.from}>`,
      to: toEmail,
      subject: `Your Admin Login Verification Code — ${otpCode}`,
      text: [
        'Sri Poondi Mahan | Attru Swamy Ashramam',
        '',
        `Your 6-digit verification code is: ${otpCode}`,
        '',
        'This code is valid for 10 minutes.',
        'Do not share it with anyone.',
        '',
        'If you did not request this, please ignore this email.',
      ].join('\n'),
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a1210;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1210;padding:32px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#0f1a17;border:1px solid #1e3530;border-radius:16px;overflow:hidden;max-width:480px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#173F35,#0E2D27);padding:28px 32px;text-align:center;border-bottom:1px solid #1e3530;">
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#D8B86A;letter-spacing:1px;">Sri Poondi Mahan</p>
          <p style="margin:0;font-size:11px;color:#77736A;letter-spacing:3px;text-transform:uppercase;">Attru Swamy Ashramam · Admin Panel</p>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;text-align:center;">
          <p style="margin:0 0 8px;font-size:14px;color:#A69B89;">Your verification code is</p>
          <div style="display:inline-block;background:#132920;border:2px solid #B78A3B;border-radius:12px;padding:18px 36px;margin:12px 0;">
            <span style="font-size:38px;font-weight:800;letter-spacing:10px;color:#D8B86A;font-family:'Courier New',monospace;">${otpCode}</span>
          </div>
          <p style="margin:16px 0 0;font-size:12px;color:#77736A;">Valid for <strong style="color:#D8B86A;">10 minutes</strong>. Do not share this code with anyone.</p>
        </td></tr>
        <tr><td style="background:#0a1210;border-top:1px solid #1e3530;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#3a4a47;">If you did not request this code, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    console.log(`✅ [OTP EMAIL] Sent to ${maskEmail(toEmail)} successfully.`);
    return { emailSent: true, error: '' };
  } catch (err) {
    console.error('❌ [OTP EMAIL] Failed to send email!', err.message);
    return { emailSent: false, error: err.message };
  }
}
