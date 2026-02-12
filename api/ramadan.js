export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const prompt =
      "حوّل الصورة لأجواء رمضانية واقعية بدون تغيير ملامح الشخص: إضاءة دافئة ذهبية، فوانيس رمضان مضيئة، زينة رمضان، هلال ونجوم خفيفة، بوكيه إضاءة، جودة عالية، شكل سينمائي.";

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1.5",
        prompt,
        image, 
        size: "1024x1536"
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json(data);
    }

    const b64 = data?.data?.[0]?.b64_json;
    return res.status(200).json({ imageBase64: b64 });

  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
