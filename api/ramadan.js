import { GoogleGenAI } from "@google/genai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb" // 4K ممكن يبقى كبير
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    const { image } = req.body || {};
    if (!image) return res.status(400).json({ error: "No image provided" });

    // DataURL: data:image/png;base64,....
    const m = String(image).match(/^data:(.+);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: "Invalid image DataURL" });

    const mimeType = m[1];
    const base64Data = m[2];

    const ai = new GoogleGenAI({ apiKey });

    const prompt =
      "حوّل الصورة لأجواء رمضانية واقعية بدون تغيير ملامح الشخص أو شكله. أضف فوانيس رمضان مضيئة، زينة رمضانية معلّقة، إضاءة دافئة ذهبية، هلال ونجوم خفيفة في الخلفية، بوكيه إضاءة، طابع سينمائي واقعي، بدون كتابة على الوجه.";

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        }
      ],
      // لازم نطلب IMAGE علشان يرجع صورة
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "4K" // مهم: K كبير
        }
      }
    });

    // نطلع أول صورة راجعة (inlineData)
    const parts = response?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData?.data);

    if (!imgPart?.inlineData?.data) {
      return res.status(500).json({ error: "No image returned from Gemini" });
    }

    return res.status(200).json({ imageBase64: imgPart.inlineData.data });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
