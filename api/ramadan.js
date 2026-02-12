import OpenAI, { toFile } from "openai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "12mb"
    }
  }
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const { image } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // نتوقع DataURL PNG مربّع من الفرونت (هنتأكد في app.js)
    const m = String(image).match(/^data:(.+);base64,(.+)$/);
    if (!m) {
      return res.status(400).json({ error: "Invalid image DataURL" });
    }

    const mimeType = m[1];
    const base64Data = m[2];

    if (mimeType !== "image/png") {
      return res.status(400).json({
        error: "Image must be PNG for dall-e-2 edits. (Client should send PNG)"
      });
    }

    const buffer = Buffer.from(base64Data, "base64");

    // ✅ نحولها لملف Uploadable باستخدام toFile (المكتبة بتعمل multipart صح)
    const file = await toFile(buffer, "image.png", { type: "image/png" });

    const prompt =
      "حوّل الصورة لأجواء رمضانية واقعية بدون تغيير ملامح الشخص: إضاءة دافئة ذهبية، فوانيس رمضان مضيئة، زينة رمضان، هلال ونجوم خفيفة، بوكيه إضاءة، جودة عالية، شكل سينمائي.";

    const result = await client.images.edit({
      model: "dall-e-2",
      image: file,
      prompt,
      size: "1024x1024",
      n: 1,
      response_format: "b64_json"
    });

    const b64 = result?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "No image returned" });

    return res.status(200).json({ imageBase64: b64 });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
