const mapboxgl = window.mapboxgl;

// =========================
// MAPBOX ACCESS TOKEN
// =========================
const token = await fetch("/api/mapbox-token");
const tokenParsed = await token.json();
mapboxgl.accessToken = tokenParsed.token;

// =========================
// ELEMENTS
// =========================
const addressInput = document.getElementById("address-input");
const saveBtn = document.getElementById("save-address");
const slider = document.getElementById("radius-slider");
const radiusLabel = document.getElementById("radius-value");
const status = document.getElementById("status");

// =========================
// LOAD EXISTING SETTINGS
// =========================
const saved = getSettings();

if (saved.address) {
  addressInput.value = saved.address;
}

if (saved.radius) {
  slider.value = saved.radius;
  radiusLabel.textContent = saved.radius;
}

// =========================
// SLIDER UI UPDATE
// =========================
slider.addEventListener("input", () => {
  radiusLabel.textContent = slider.value;
});

// =========================
// SAVE BUTTON
// =========================
saveBtn.addEventListener("click", async () => {
  const address = addressInput.value.trim();
  const radius = Number(slider.value);

  if (!address) {
    setStatus("Please enter an address.");
    return;
  }

  setStatus("Geocoding address...");

  const coords = await geocodeAddress(address);

  if (!coords) {
    setStatus("Invalid address. Try again.");
    return;
  }

  const settings = {
    address,
    radius,
    location: coords,
  };

  localStorage.setItem(
    "userSettings",
    JSON.stringify(settings)
  );

  setStatus("Settings saved ✔");
});

// =========================
// GET SETTINGS
// =========================
function getSettings() {
  return (
    JSON.parse(localStorage.getItem("userSettings")) || {
      address: "",
      radius: 5,
      location: null,
    }
  );
}

// =========================
// GEOCODE ADDRESS
// =========================
async function geocodeAddress(address) {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${mapboxgl.accessToken}`;

    const res = await fetch(url);
    const data = await res.json();

    return data.features?.[0]?.center || null;
  }

  catch (err) {
    console.error(err);
    return null;
  }
}

// =========================
// UI STATUS HELPER
// =========================
function setStatus(msg) {
  status.textContent = msg;
}