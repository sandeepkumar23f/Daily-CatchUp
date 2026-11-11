import { GoogleGenAI } from "@google/genai";
import { tavily } from "@tavily/core";
import { z } from "zod";

const querySchema = z.object({
  topic: z.string().min(2, "Search query is required"),
  mode: z.enum(["brief", "standard", "detailed"]).optional().default("standard"),
});

export const summarizeNewsTopic = async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

    const parseResult = querySchema.safeParse(req.body || {});
    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues?.[0]?.message || "Invalid payload";
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const { topic, mode } = parseResult.data;

    const searchResponse = await tvly.search(topic, {
      searchDepth: "basic",
      topic: "news",
      maxResults: 5,
    });

    const results = searchResponse?.results || [];
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No live news found for this topic",
      });
    }

    const newsText = results
      .map(
        (item) =>
          `- Title: ${item.title}\n  Content: ${(item.content || "").slice(0, 300)}\n  URL: ${item.url}`
      )
      .join("\n\n");

    const prompt = `
    You are an expert news editor for Daily CatchUp.
    Summarize the following live web news into clear structured JSON.
    Use ONLY the provided news content.

    Detail Level: ${mode}
    
    News Content:
    ${newsText}

    Return strictly a JSON object with this exact schema:
    {
      "title": "Overall headline summarizing the news context",
      "executiveSummary": "1-2 sentence quick overview of the news topic",
      "bulletPoints": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
      "sentiment": "Positive | Neutral | Negative",
      "sources": [
        { "title": "Source 1 Title", "url": "https://..." }
      ]
    }
    `;

    // Updated model name to gemini-3.8-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text.replace(/```json|```/g, "").trim();
    const structuredData = JSON.parse(rawText);

    return res.status(200).json({
      success: true,
      data: structuredData,
    });
  } catch (error) {
    console.error("Live News Summarize Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch or summarize news",
    });
  }
};