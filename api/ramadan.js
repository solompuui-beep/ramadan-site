import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // ✅ formidable ممكن يرجّع files.image كـ array أو object
    const img = files?.image;
    const file = Array.isArray(img) ? img[0] : img;

    if (!file) {
      return res.status(400).json({ error: "No image uploaded (image)" });
    }

    // ✅ بعض النسخ: filepath / path
    const filePath = file.filepath || file.path;
    const fileName = file.originalFilename || file.name || "image.png";

    if (!filePath) {
      return res.status(500).json({
        error: "Upload parsed but file path is missing",
        debug: { keys: Object.keys(file) },
      });
    }

    const prompt =
      "حوّل الصورة لأجواء رمضانية واقعية بدون تغيير ملامح الشخص: إضاءة دافئة ذهبية، فوانيس رمضان مضيئة، زينة رمضان، هلال ونجوم خفيفة، بوكيه إضاءة، جودة عالية، شكل سينمائي.";

    const fd = new FormData();
    fd.append("model", "gpt-image-1.5");
    fd.append("prompt", prompt);
    fd.append("size", "1024x1536");
    fd.append("image", fs.createReadStream(filePath), fileName);

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
      return res.status(500).json({ error: data?.error || data });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "No image returned" });

    return res.status(200).json({ imageBase64: b64 });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
