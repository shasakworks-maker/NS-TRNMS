import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store for OTPs (In a real app, use Redis or a DB)
// Note: On Netlify Functions, this will be ephemeral and not shared across instances.
const otpStore = new Map<string, { otp: string; expires: number }>();

// In-memory store for system-wide notifications
const systemNotifications: any[] = [
  {
    id: 'sys1',
    title: 'Welcome to NS Tournaments!',
    message: 'Get ready for the ultimate gaming experience. Check out upcoming tournaments now!',
    type: 'info',
    createdAt: new Date().toISOString()
  }
];

// Hourly notification generator
const crispMessages = [
  "Tip: Always check your internet connection before a match starts!",
  "News: A new Free Fire tournament is coming next week with a massive prize pool!",
  "Reminder: Don't forget to update your Free Fire game to the latest version.",
  "Tip: Practice makes perfect. Join our daily practice matches!",
  "Fun Fact: Did you know? NS Tournaments has over 1000 active players!",
  "Tip: Communication is key in squad matches. Use your mic!",
  "News: Winner of yesterday's tournament has been announced in the results tab."
];

// In a serverless environment, this interval won't work as expected.
// We'll just generate one on the fly if needed or keep it static for now.
const generateRandomNotification = () => {
  const randomMessage = crispMessages[Math.floor(Math.random() * crispMessages.length)];
  return {
    id: `sys-${Date.now()}`,
    title: 'System Update',
    message: randomMessage,
    type: 'info',
    createdAt: new Date().toISOString()
  };
};

// API route to get system notifications
app.get('/api/notifications/system', (req, res) => {
  // Add a random one occasionally to simulate the background process in serverless
  const results = [...systemNotifications];
  if (Math.random() > 0.7) {
    results.unshift(generateRandomNotification());
  }
  res.json(results.slice(0, 20));
});

// API route to send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

  otpStore.set(email, { otp, expires });

  let transporter;
  let isTest = false;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const testAccount = await nodemailer.createTestAccount();
    isTest = true;
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  const mailOptions = {
    from: isTest ? '"NS Tournaments Test" <no-reply@nstournaments.com>' : `"NS Tournaments" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for NS Tournaments',
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
        <h2 style="color: #F27D26; text-align: center;">NS Tournaments</h2>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) for signing up is:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #666;">This OTP will expire in 5 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 10px; color: #999; text-align: center;">Powered by Shasak Singh</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;
    
    res.json({ 
      success: true, 
      message: isTest ? 'OTP sent to test service' : 'OTP sent to your email',
      previewUrl 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

// API route to verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const storedData = otpStore.get(email);

  if (!storedData) {
    return res.status(400).json({ error: 'No OTP found for this email' });
  }

  if (Date.now() > storedData.expires) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP has expired' });
  }

  if (storedData.otp === otp) {
    otpStore.delete(email);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

export default app;
