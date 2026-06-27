# 텍사스, 오늘 Canvas 버전

이 버전은 HTML 화면을 캡처하지 않고 Canvas에 뉴스레터 이미지를 직접 그립니다.
사진 업로드와 이미지 생성이 이전 방식보다 안정적입니다.

GitHub Pages에 업로드할 파일:
- index.html
- manifest.webmanifest
- sw.js
- icon-192.png
- icon-512.png

업로드 후 접속:
https://jannyland7005.github.io/texas-today/?v=canvas6


v4: 고정 비율 제거, 사진 crop 방지, 사진 개수별 카드 높이 자동 조정, 하단 잘림 방지, 큰 글씨 유지.


v5: 사진 crop 완전 방지, 글씨 대폭 확대, 캔버스 높이 선계산으로 하단 잘림 방지.


v6: offscreen full render then final crop; no-crop photo boxes; much larger type.
