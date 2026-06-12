import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables from .env.example (user's workaround)
dotenv.config({ path: ".env.example" });

// Mock Database (since Cloud SQL is disabled and Firebase was declined)
// In a real scenario, this would be your "secure SQL database".
type User = {
  id: string;
  name: string;
  email: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
};

let db: User[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  app.post("/api/submit-quiz", async (req, res) => {
    const { name, email, score, totalQuestions } = req.body;

    if (!name || !email || score === undefined || !totalQuestions) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      name,
      email,
      score,
      totalQuestions,
      timestamp: new Date().toISOString(),
    };

    // Save to our mock DB
    db.push(newUser);

    // Initialize Mail Transport
    let emailStatusMessage = `Mock email logged to console (SMTP credentials missing).`;
    
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      try {
        await transporter.sendMail({
          from: `"Quiz Admin" <${process.env.SMTP_USER}>`,
          to: email,
          subject: "Your Quiz Results",
          text: `Hi ${name},\n\nYou scored ${score}/${totalQuestions} on your logic and pattern quiz!\n\nThank you for participating.`,
        });
        emailStatusMessage = `Real email sent successfully to ${email}`;
        console.log(`[REAL EMAIL SENT] To: ${email}`);
      } catch (err) {
        console.error("Error sending email:", err);
        emailStatusMessage = `Failed to send real email. Check server logs.`;
      }
    } else {
      // Mock Email sending
      console.log(`\n======================================================`);
      console.log(`[MOCK EMAIL SENT]`);
      console.log(`To: ${email}`);
      console.log(`Subject: Your Quiz Results`);
      console.log(`Hi ${name}, you scored ${score}/${totalQuestions} on your logic and pattern quiz!`);
      console.log(`======================================================\n`);
    }

    return res.json({ success: true, message: emailStatusMessage, user: newUser });
  });

  // --- Admin Authentication ---
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "secure_admin_2026";
  const ADMIN_TOKEN = "mock_session_token_" + Math.random().toString(36).substring(7);

  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return res.json({ token: ADMIN_TOKEN });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  });

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token;
    if (authHeader === `Bearer ${ADMIN_TOKEN}` || queryToken === ADMIN_TOKEN) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  app.get("/api/admin/stats", requireAdmin, (req, res) => {
    const totalUsers = db.length;
    const averageScore = totalUsers > 0 
      ? db.reduce((sum, user) => sum + user.score, 0) / totalUsers 
      : 0;

    return res.json({
      totalUsers,
      averageScore,
      users: [...db].reverse() // send newest first
    });
  });

  app.get("/api/admin/export-csv", requireAdmin, (req, res) => {
    // Generate CSV string
    const headers = ["ID", "Name", "Email", "Score", "TotalQuestions", "Date"];
    const rows = db.map(u => [
      u.id, 
      `"${u.name.replace(/"/g, '""')}"`, // escape quotes
      `"${u.email}"`,
      u.score,
      u.totalQuestions,
      u.timestamp
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="quiz_results.csv"');
    res.status(200).send(csvContent);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
