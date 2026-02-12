export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const { image } = req.body || {};
    if (!image) return res.status(400).json({ error: "No image provided" });

    // data:image/png;base64,....
    const m = String(image).match(/^data:(.+);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: "Invalid image DataURL" });

    const mimeType = m[1];
    const base64Data = m[2];
    const buffer = Buffer.from(base64Data, "base64");

    const ext =
      mimeType.includes("png") ? "png" :
      mimeType.includes("jpeg") ? "jpg" :
      mimeType.includes("webp") ? "webp" : "png";

    const prompt =
      "حوّل الصورة لأجواء رمضانية واقعية بدون تغيير ملامح الشخص: إضاءة دافئة ذهبية، فوانيس رمضان مضيئة، زينة رمضان، هلال ونجوم خفيفة، بوكيه إضاءة، جودة عالية، شكل سينمائي.";

    // ✅ FormData الأصلي
    const form = new FormData();
    form.append("model", "dall-e-2");
    form.append("prompt", prompt);
    form.append("size", "1024x1024"); // DALL·E 2 يدعم 256/512/1024
    form.append("n", "1");

    const filename = `upload.${ext}`;

    // ✅ الأهم: نرفعها كـ File (مش Blob)
    let fileLike;
    if (typeof File !== "undefined") {
      fileLike = new File([buffer], filename, { type: mimeType });
      form.append("image", fileLike);
    } else {
      // احتياط لو File مش موجود
      const blob = new Blob([buffer], { type: mimeType });
      form.append("image", blob, filename);
    }

    const resp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        // ❗ متحطش Content-Type هنا
      },
      body: form,
    });

    const data = await resp.json();
    if (!resp.ok) return res.status(500).json(data);

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "No image returned" });

    return res.status(200).json({ imageBase64: b64 });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
