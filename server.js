const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "REDACTED_API_KEY";


// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
  })
);

app.use(express.json());
app.use(express.static(__dirname));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per `window`
  message: { reply: 'Too many requests from this IP, please try again after a minute.' }
});

app.post('/api/chat', apiLimiter, async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      return res.status(400).json({ reply: 'Invalid message.' });
    }

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return res.status(500).json({ reply: 'Server configuration error.' });
    }

    const payload = {
      system_instruction: {
        parts: [{
          text: "You are a friendly and knowledgeable guide to India's Constitution, democracy, election process, and civic duties. Answer questions clearly and concisely (2–4 sentences) about: the history and making of the Indian Constitution, Dr. B.R. Ambedkar's role, the Constituent Assembly, Fundamental Rights, Directive Principles, Fundamental Duties (Article 51A), constitutional amendments, the Election Commission of India (ECI), Lok Sabha and Rajya Sabha elections, state assembly elections, voter registration (Form 6, EPIC/Voter ID), the Model Code of Conduct, EVMs and VVPATs, multi-phase elections, polling day procedures, indelible ink, NOTA, postal ballots, voter duties and responsibilities, ethical voting, how to avoid misinformation, vote counting, seat majority (272+ seats), government formation, and the President's role. Be factual, nonpartisan, and India-focused. If a question is unrelated to India's Constitution, elections, or civic duties, politely redirect."
        }]
      },
      contents: [
        { role: "user", parts: [{ text: userMessage.substring(0, 1000) }] }
      ],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.4
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
    
    res.json({ reply: replyText });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ reply: 'An error occurred while processing your request. Please try again later.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
