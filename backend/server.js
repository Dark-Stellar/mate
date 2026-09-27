const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = 3000;

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// PDF UPLOAD CONFIGURATION
// ===============================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// ===============================
// CHECK GEMINI API KEY
// ===============================
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing.");
  process.exit(1);
}

// ===============================
// GEMINI AI
// ===============================
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ===============================
// GEMINI MODEL
// ===============================
const GEMINI_MODEL = "gemini-3.6-flash";

// ===============================
// GEMINI REQUEST WITH RETRY
// ===============================
async function generateWithRetry(contents, maxRetries = 4) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Gemini request attempt ${attempt + 1}/${maxRetries + 1}`
      );

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
      });

      return response;
    } catch (error) {
      lastError = error;

      const status = error?.status || error?.code;

      console.error(
        `Gemini request failed on attempt ${attempt + 1}:`,
        status || error.message
      );

      const shouldRetry =
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504;

      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.pow(2, attempt) * 1000;

      console.log(
        `Retrying Gemini request in ${delay / 1000} seconds...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }

  throw lastError;
}

// ===============================
// HOME ROUTE
// ===============================
app.get("/", (req, res) => {
  res.json({
    message: "StudyMate AI backend is running!",
  });
});

// ===============================
// AI CHAT - STREAMING
// ===============================
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required.",
      });
    }

    console.log("Chat request received:", message);

    // Tell browser/app that response will be streamed
    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    res.flushHeaders();

    // ===============================
    // STREAMING WITH RETRY
    // ===============================

    let responseStream;
    let lastError;

    for (let attempt = 0; attempt <= 4; attempt++) {
      try {
        console.log(
          `Chat streaming attempt ${attempt + 1}/5`
        );

        responseStream =
          await ai.models.generateContentStream({
            model: GEMINI_MODEL,
            contents: message.trim(),
          });

        break;
      } catch (error) {
        lastError = error;

        const status =
          error?.status || error?.code;

        console.error(
          `Chat streaming failed on attempt ${
            attempt + 1
          }:`,
          status || error.message
        );

        const shouldRetry =
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504;

        if (!shouldRetry || attempt === 4) {
          throw error;
        }

        const delay =
          Math.pow(2, attempt) * 1000;

        console.log(
          `Retrying chat in ${
            delay / 1000
          } seconds...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );
      }
    }

    if (!responseStream) {
      throw lastError || new Error("No response stream.");
    }

    // ===============================
    // SEND CHUNKS TO APP
    // ===============================

    for await (const chunk of responseStream) {
      const text = chunk.text || "";

      if (text) {
        res.write(text);
      }
    }

    res.end();

    console.log("Chat streaming completed.");
  } catch (error) {
    console.error("Gemini Chat Error:", error);

    // If response hasn't started yet,
    // send normal JSON error
    if (!res.headersSent) {
      return res.status(503).json({
        error:
          "Gemini AI is temporarily unavailable. Please try again in a few seconds.",
      });
    }

    // If streaming already started,
    // close the response
    res.end();
  }
});

// ===============================
// PDF SUMMARY
// ===============================
app.post(
  "/summarize-pdf",
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "PDF file is required.",
        });
      }

      console.log(
        "PDF received:",
        req.file.originalname
      );

      const base64PDF =
        req.file.buffer.toString("base64");

      const prompt = `
You are StudyMate AI, an academic study assistant.

Read the uploaded PDF carefully and create a clear, student-friendly summary.

Please provide:

1. Main Topic
2. Key Points
3. Important Definitions
4. Important Concepts
5. Short Summary
6. Exam/Study Notes

Use simple English.
Organize the answer with clear headings and bullet points.
Do not include information that is not present in the PDF.
`;

      const contents = [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64PDF,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ];

      const response =
        await generateWithRetry(contents);

      res.json({
        fileName: req.file.originalname,
        summary: response.text,
      });
    } catch (error) {
      console.error(
        "PDF Summary Error:",
        error
      );

      res.status(503).json({
        error:
          "Gemini AI is temporarily unavailable. Please try the PDF again in a few seconds.",
      });
    }
  }
);

// ===============================
// AI QUIZ GENERATOR
// ===============================
app.post("/generate-quiz", async (req, res) => {
  try {
    const {
      topic,
      numberOfQuestions = 5,
      difficulty = "medium",
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        error: "Topic is required.",
      });
    }

    const questionCount = Math.max(
      1,
      Math.min(
        Number(numberOfQuestions) || 5,
        20
      )
    );

    const prompt = `
You are StudyMate AI, an academic quiz generator.

Create a multiple-choice quiz for students.

Topic: ${topic}
Number of Questions: ${questionCount}
Difficulty: ${difficulty}

Return ONLY valid JSON in exactly this format:

{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": 0,
      "explanation": "Short explanation"
    }
  ]
}

IMPORTANT RULES:

1. Create exactly ${questionCount} questions.
2. Every question must have exactly 4 options.
3. "correctAnswer" MUST be a number.
4. "correctAnswer" represents the ZERO-BASED INDEX of the correct option.
5. Option A = 0
6. Option B = 1
7. Option C = 2
8. Option D = 3
9. The correctAnswer number MUST match the correct option.
10. Only one option can be correct.
11. Use simple and clear English.
12. Questions must be relevant to the topic.
13. Do not include markdown.
14. Return valid JSON only.
`;

    console.log(
      "Generating quiz for:",
      topic
    );

    const response =
      await generateWithRetry(prompt);

    let text = response.text.trim();

    // Remove accidental markdown code fences
    text = text.replace(
      /^```json\s*/i,
      ""
    );

    text = text.replace(
      /^```\s*/i,
      ""
    );

    text = text.replace(
      /\s*```$/i,
      ""
    );

    let quiz;

    try {
      quiz = JSON.parse(text);
    } catch (jsonError) {
      console.error(
        "Quiz JSON Parse Error:",
        jsonError
      );

      console.error(
        "Gemini returned:",
        text
      );

      return res.status(500).json({
        error:
          "Gemini returned an invalid quiz format. Please try again.",
      });
    }

    // ===============================
    // VALIDATE QUIZ
    // ===============================

    if (
      !quiz ||
      !quiz.questions ||
      !Array.isArray(quiz.questions)
    ) {
      throw new Error(
        "Invalid quiz format."
      );
    }

    if (
      quiz.questions.length !==
      questionCount
    ) {
      throw new Error(
        `Expected ${questionCount} questions but received ${quiz.questions.length}.`
      );
    }

    for (const question of quiz.questions) {
      if (
        !question.question ||
        typeof question.question !==
          "string" ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        typeof question.correctAnswer !==
          "number" ||
        !Number.isInteger(
          question.correctAnswer
        ) ||
        question.correctAnswer < 0 ||
        question.correctAnswer > 3
      ) {
        throw new Error(
          "Invalid question format."
        );
      }

      // Make sure every option is a string
      if (
        !question.options.every(
          (option) =>
            typeof option === "string" &&
            option.trim()
        )
      ) {
        throw new Error(
          "Invalid options format."
        );
      }

      // Explanation is optional
      if (
        question.explanation !==
          undefined &&
        typeof question.explanation !==
          "string"
      ) {
        throw new Error(
          "Invalid explanation format."
        );
      }
    }

    res.json(quiz);
  } catch (error) {
    console.error(
      "Quiz Generation Error:",
      error
    );

    res.status(503).json({
      error:
        "Gemini AI is temporarily unavailable. Please try generating the quiz again.",
    });
  }
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `StudyMate AI backend running on port ${PORT}`
  );

  console.log(
    `Gemini model: ${GEMINI_MODEL}`
  );
});