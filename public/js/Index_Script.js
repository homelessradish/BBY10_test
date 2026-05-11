const mapboxgl = window.mapboxgl;

// =========================
// MAPBOX ACCESS TOKEN
// =========================
const token = await fetch("/api/mapbox-token");
const tokenParsed = await token.json();
mapboxgl.accessToken = tokenParsed.token;

// =========================
// APP STATE
// =========================
let map;
let userLocation;
let selectedLocation = null;

let userMarker = null;
let locationMarkers = []; // 🔥 FIX: required for clearing POIs

let radius = 10; // km default

// =========================
// START APPLICATION
// =========================
// Damon: Sorry I am initializing the map before window loads, idk why it never loads
// it's probably due to my changes but it works...?
await initializeMap();
window.addEventListener("load", async () => {
  console.log("Window has loaded");
});

// =========================
// INITIALIZE MAP
// =========================
async function initializeMap() {
  userLocation = await getUserLocation();

  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: userLocation,
    zoom: 12,
  });

  map.addControl(new mapboxgl.NavigationControl());

  map.once("load", async () => {
    userMarker = createUserMarker(userLocation);

    setupMapClickHandler();
    setupSetLocationButton();

    await loadUserSettings();
    await loadLocations();
  });

  // load settings early (safe defaults)
  try {
    const raw = localStorage.getItem("userSettings");
    if (raw) {
      const settings = JSON.parse(raw);

      if (settings?.radius) radius = settings.radius;
      if (settings?.location) userLocation = settings.location;
    }
  } catch (err) {
    console.error("Failed to read settings:", err);
  }
}

// =========================
// DISTANCE HELPERS
// =========================
function getDistanceKm(a, b) {
  const R = 6371;

  const dLat = (b[1] - a[1]) * Math.PI / 180;
  const dLon = (b[0] - a[0]) * Math.PI / 180;

  const lat1 = a[1] * Math.PI / 180;
  const lat2 = b[1] * Math.PI / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 *
    Math.cos(lat1) *
    Math.cos(lat2);

  return R * (2 * Math.asin(Math.sqrt(x)));
}

function isWithinRadius(userLoc, pointLoc, radiusKm) {
  return getDistanceKm(userLoc, pointLoc) <= radiusKm;
}

// =========================
// USER SETTINGS
// =========================
async function loadUserSettings() {
  const raw = localStorage.getItem("userSettings");
  if (!raw) return;

  const settings = JSON.parse(raw);
  if (!settings?.location) return;

  userLocation = settings.location;

  map.setCenter(userLocation);

  if (userMarker) {
    userMarker.setLngLat(userLocation);
  } else {
    userMarker = createUserMarker(userLocation);
  }
}

// =========================
// USER MARKER
// =========================
function createUserMarker(location) {
  return new mapboxgl.Marker({ color: "blue" })
    .setLngLat(location)
    .addTo(map);
}

// =========================
// MAP CLICK
// =========================
function setupMapClickHandler() {
  map.on("click", async (event) => {
    selectedLocation = [
      event.lngLat.lng,
      event.lngLat.lat,
    ];

    drawDestination(selectedLocation);
    await getRoute(userLocation, selectedLocation);

    document.getElementById("set-location-btn").style.display = "block";
  });
}

// =========================
// DESTINATION MARKER
// =========================
function drawDestination(location) {
  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: location,
        },
      },
    ],
  };

  if (map.getSource("end")) {
    map.getSource("end").setData(geojson);
  } else {
    map.addSource("end", {
      type: "geojson",
      data: geojson,
    });

    map.addLayer({
      id: "end",
      type: "circle",
      source: "end",
      paint: {
        "circle-radius": 10,
        "circle-color": "#f30",
      },
    });
  }
}

// =========================
// SET LOCATION BUTTON
// =========================
function setupSetLocationButton() {
  const button = document.getElementById("set-location-btn");
  if (!button) return;

  button.addEventListener("click", handleSetLocation);
}

// =========================
// LOCATION UPDATE + REFRESH
// =========================
function handleSetLocation() {
  if (!selectedLocation) return;

  // 1. update state
  userLocation = selectedLocation;

  // 2. move user marker
  userMarker?.setLngLat(userLocation);

  // 3. recenter
  map.flyTo({
    center: userLocation,
    zoom: 15,
  });

  // 4. hide button
  document.getElementById("set-location-btn").style.display = "none";

  // 5. clear POIs
  clearPOIMarkers();

  // 6. clear route
  clearMapLayer("route");

  // 7. clear destination
  clearMapLayer("end");

  // 8. reload POIs
  loadLocations();
}

// =========================
// CLEAR HELPERS
// =========================
function clearPOIMarkers() {
  locationMarkers.forEach(m => m.remove());
  locationMarkers = [];
}

function clearMapLayer(id) {
  if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(id)) map.removeSource(id);
}

// =========================
// GEOLOCATION
// =========================
async function getUserLocation() {
  const defaultLocation = [-123.0016, 49.2532];

  if (!navigator.geolocation) return defaultLocation;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve([
          pos.coords.longitude,
          pos.coords.latitude,
        ]);
      },
      () => resolve(defaultLocation)
    );
  });
}

// =========================
// ROUTING
// =========================
async function getRoute(start, end) {
  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
    );

    const json = await res.json();
    if (!json.routes?.length) return;

    const route = json.routes[0].geometry;

    const geojson = {
      type: "Feature",
      geometry: route,
    };

    if (map.getSource("route")) {
      map.getSource("route").setData(geojson);
    } else {
      map.addSource("route", {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3887be",
          "line-width": 5,
          "line-opacity": 0.75,
        },
      });
    }

    updateInstructions(json.routes[0]);
  } catch (err) {
    console.error("Route error:", err);
  }
}

// =========================
// INSTRUCTIONS
// =========================
function updateInstructions(routeData) {
  const el = document.getElementById("instructions");
  if (!el) return;

  const steps = routeData.legs?.[0]?.steps || [];

  el.innerHTML = `
    <p><strong>
      Trip duration: ${Math.floor(routeData.duration / 60)} min
    </strong></p>

    <ol>
      ${steps.map(s => `<li>${s.maneuver.instruction}</li>`).join("")}
    </ol>
  `;
}

// =========================
// LOAD LOCATIONS
// =========================
async function loadLocations() {
  try {
    const res = await fetch("../resource/locations.JSON");
    const locations = await res.json();

    renderLocations(Array.isArray(locations) ? locations : [locations]);
  } catch (err) {
    console.error("Error loading locations JSON:", err);
  }
}

// =========================
// RENDER LOCATIONS (SOURCE OF TRUTH)
// =========================
function renderLocations(locations) {
  clearPOIMarkers();

  for (const loc of locations) {
    const coords = loc?.geo?.coordinates;
    if (!coords) continue;

    if (!userLocation) continue;

    if (!isWithinRadius(userLocation, coords, radius)) continue;

    const marker = new mapboxgl.Marker()
      .setLngLat(coords)
      .addTo(map);

    locationMarkers.push(marker);

    marker.getElement().addEventListener("click", () => {
      showInfoCard(loc);
    });
  }
}

// =========================
// INFO CARD
// =========================
function showInfoCard(data) {
  const card = document.getElementById("info-card");
  if (!card) return;

  const hoursHTML = Object.entries(data.hours || {})
    .map(([day, schedule]) => {
      if (!schedule) return `<li><strong>${day}:</strong> Closed`;

      return `
        <li>
          <strong>${day}:</strong>
          ${schedule.map(s => `${s.open} - ${s.close}`).join(", ")}
        </li>
      `;
    })
    .join("");

  card.innerHTML = `
    <h2>${data.name}</h2>
    <p><strong>Address:</strong><br>${data.address}</p>
    <p><strong>Tags:</strong> ${(data.tags || []).join(", ")}</p>

    <h3>Hours</h3>
    <ul>${hoursHTML}</ul>

    <h3>Notes</h3>
    <ul>
      ${(data.notes || []).map(n => `<li>${n}</li>`).join("")}
    </ul>

    <h3>Links</h3>
    <a href="${data.links?.[0] || "#"}" target="_blank">Website</a>
  `;

  card.classList.remove("hidden");
}
