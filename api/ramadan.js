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

    // image جاية DataURL زي: data:image/png;base64,....
    // نحولها لـ base64 فقط (من غير الهيدر)
    const base64Only = String(image).includes("base64,")
      ? String(image).split("base64,")[1]
      : String(image);

    const prompt =
      "حوّل الصورة لأجواء رمضانية واقعية بدون تغيير ملامح الشخص: إضاءة دافئة ذهبية، فوانيس رمضان مضيئة، زينة رمضان، هلال ونجوم خفيفة، بوكيه إضاءة، جودة عالية، شكل سينمائي.";

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-2",
        prompt,
        // DALL·E 2 edits هنا بنبعت الصورة كـ base64
        image: base64Only,
        size: "1024x1024",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json(data);
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "No image returned" });

    return res.status(200).json({ imageBase64: b64 });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
