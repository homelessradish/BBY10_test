let images = [];
let currentIndex = 0;

const imgEl = document.getElementById("slide-image");

async function loadSlideshow() {
  const res = await fetch("/resource/slideshow/fileCollect.JSON");
  const data = await res.json();

  images = data.images.map(
    (img) => `/resource/slideshow/${img}`
  );

  showImage(0);
}

function showImage(index) {
  if (!images.length) return;

  currentIndex = index;

  imgEl.src = images[currentIndex];
}

function nextImage() {
  if (!images.length) return;

  currentIndex = (currentIndex + 1) % images.length;
  showImage(currentIndex);
}

function prevImage() {
  if (!images.length) return;

  currentIndex =
    (currentIndex - 1 + images.length) % images.length;

  showImage(currentIndex);
}

// buttons
document.getElementById("next").addEventListener("click", nextImage);
document.getElementById("prev").addEventListener("click", prevImage);

// init
loadSlideshow();