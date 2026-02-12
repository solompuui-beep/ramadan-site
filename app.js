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

goBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    statusEl.textContent = "ارفع صورة الأول من مربع (قبل).";
    return;
  }

  goBtn.disabled = true;
  statusEl.textContent = "جاري التحويل...";

  try {
    const fd = new FormData();
    fd.append("image", selectedFile);

    const resp = await fetch("/api/ramadan", {
      method: "POST",
      body: fd
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(JSON.stringify(data?.error || data));

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
