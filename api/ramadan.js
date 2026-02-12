import FormData from "form-data";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // علشان base64 بتكون كبيرة
    },
  },
};

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

    // image جاية DataURL: data:image/png;base64,....
    const match = String(image).match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Invalid image format (expected DataURL base64)" });
    }

    const mimeType = match[1];         // مثل image/png
    const base64Data = match[2];       // الـ base64
    const buffer = Buffer.from(base64Data, "base64");

    const ext =
      mimeType.includes("png") ? "png" :
      mimeType.includes("jpeg") ? "jpg" :
      mimeType.includes("webp") ? "webp" : "png";

    const prompt =
      "حوّل الصورة لأجواء رمضانية واقعية بدون تغيير ملامح الشخص: إضاءة دافئة ذهبية، فوانيس رمضان مضيئة، زينة رمضان، هلال ونجوم خفيفة، بوكيه إضاءة، جودة عالية، شكل سينمائي.";

    // ✅ لازم multipart/form-data لأن DALL·E 2 edits عايز file
    const fd = new FormData();
    fd.append("model", "dall-e-2");
    fd.append("prompt", prompt);
    fd.append("size", "1024x1024");

    // هنا بنضيف الصورة كـ “ملف”
    fd.append("image", buffer, {
      filename: `upload.${ext}`,
      contentType: mimeType,
    });

    const resp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...fd.getHeaders(),
      },
      body: fd,
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(500).json(data);
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "No image returned" });

    return res.status(200).json({ imageBase64: b64 });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
