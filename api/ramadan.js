import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: "nodejs",
  api: { bodyParser: { sizeLimit: "15mb" } }
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in Vercel Env Vars" });
    }

    const { image } = req.body || {};
    if (!image) return res.status(400).json({ error: "No image provided" });

    const m = String(image).match(/^data:(.+);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: "Invalid image DataURL" });

    const mimeType = m[1];
    const base64Data = m[2];

    const ai = new GoogleGenAI({ apiKey });

    const prompt =
      "حوّل الصورة لأجواء رمضانية واقعية بدون تغيير ملامح الشخص: فوانيس رمضان مضيئة، زينة رمضان معلّقة، إضاءة ذهبية دافئة، هلال ونجوم خفيفة، طابع سينمائي واقعي، جودة عالية. بدون كتابة على الوجه.";

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        { text: prompt },
        { inlineData: { mimeType, data: base64Data } }
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          imageSize: "4K"
        }
      }
    });

    const parts = response?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData?.data);

    if (!imgPart?.inlineData?.data) {
      return res.status(500).json({ error: "No image returned from Gemini", debug: { partsCount: parts.length } });
    }

    return res.status(200).json({ imageBase64: imgPart.inlineData.data });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
