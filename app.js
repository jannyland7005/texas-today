function initDate() {
  const today = new Date();
  const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  document.getElementById("dateInput").value = local;
}

document.addEventListener("DOMContentLoaded", () => {
  initDate();
  renderNewsletter();

  document.getElementById("dateInput").addEventListener("change", renderNewsletter);
  document.getElementById("subtitleInput").addEventListener("input", renderNewsletter);
  document.getElementById("familyText").addEventListener("input", renderNewsletter);
  document.getElementById("photoInput").addEventListener("change", e => handlePhotos(e.target.files));
  document.getElementById("rerollBtn").addEventListener("click", () => {
    rerollOffset += 1;
    renderNewsletter();
  });
  document.getElementById("shareBtn").addEventListener("click", shareNewsletter);
});
