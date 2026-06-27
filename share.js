function canvasToBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.95));
}

async function getNewsletterBlob() {
  renderNewsletter();
  const canvas = document.getElementById("newsletterCanvas");
  latestBlob = await canvasToBlob(canvas);
  return latestBlob;
}

async function shareNewsletter() {
  try {
    setStatus("공유 이미지를 준비하는 중입니다.");
    const blob = await getNewsletterBlob();
    const date = document.getElementById("dateInput").value || "today";
    const file = new File([blob], `텍사스_오늘_${date}.png`, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      setStatus("공유창을 열었습니다.");
      return;
    }

    setStatus("이 기기에서는 이미지 파일 공유가 제한됩니다. Chrome 또는 Safari에서 다시 시도해보세요.");
  } catch (err) {
    console.error(err);
    setStatus("공유가 취소되었거나 제한되었습니다.");
  }
}
