const fileInput = document.getElementById("file");
const goBtn = document.getElementById("go");
const statusEl = document.getElementById("status");
const beforeImg = document.getElementById("before");
const afterImg = document.getElementById("after");
const afterPlaceholder = document.getElementById("afterPlaceholder");

let selectedFile = null;

fileInput.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (!f) return;

  selectedFile = f;

  beforeImg.src = URL.createObjectURL(f);
  beforeImg.classList.add("show");

  afterImg.removeAttribute("src");
  afterPlaceholder.style.display = "block";
  statusEl.textContent = "";
});

function fileToSquarePngDataURL(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = Math.floor((img.width - side) / 2);
      const sy = Math.floor((img.height - side) / 2);

      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, side, side, 0, 0, 1024, 1024);

      // PNG
      const dataUrl = canvas.toDataURL("image/png");
      resolve(dataUrl);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

goBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    statusEl.textContent = "ارفع صورة الأول من مربع (قبل).";
    return;
  }

  goBtn.disabled = true;
  statusEl.textContent = "جاري التحويل...";

  try {
    // ✅ نحول لصورة PNG مربعة 1024x1024
    const pngDataURL = await fileToSquarePngDataURL(selectedFile);

    const resp = await fetch("/api/ramadan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: pngDataURL })
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(JSON.stringify(data));

    afterImg.src = `data:image/png;base64,${data.imageBase64}`;
    afterImg.classList.add("show");
    afterPlaceholder.style.display = "none";
    statusEl.textContent = "تم ✅";
  } catch (e) {
    statusEl.textContent = "خطأ: " + e.message;
  } finally {
    goBtn.disabled = false;
  }
});
