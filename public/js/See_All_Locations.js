// Check if authenticated
async function checkAuth() {
  const res = await fetch("/api/authentication");
  const auth = await res.json();
  if (!auth.authenticated) {
    window.location.href = "../html/Login.html";
  }
}
checkAuth();

/*
* The catagories that we currently have :thumbsup:
* If there are any other catagories to add here lemme know otherwise
* we can add/remove/change catagories :p
*/
const CATEGORIES = {
  pantries: { title: 'Community Food Pantries',},
  farmers:  { title: 'BC Farmers Markets',},
  markets:  { title: 'Local Food Markets',}
};

const params = new URLSearchParams(window.location.search);
const category = params.get('category');

/*
* Display catagory title.
* If there isn't a catagory title, then set it to the default name.
*/
if (CATEGORIES[category]) {
  document.getElementById('page-title').textContent = CATEGORIES[category].title;
} else {
  document.getElementById('page-title').textContent = 'Food Locations';
}

// Event listeners when a certain button is clicked
document.getElementById('back-btn').addEventListener('click', () => history.back());
document.getElementById('filter-btn').addEventListener('click', openFilters);
document.getElementById('saved-btn').addEventListener('click', openSaved);

/**
 * Loads in locations from the database.
 */
async function loadLocations() {
  const res = await fetch("/api/locations");
  const locations = await res.json();
  await renderCards(locations);
}
loadLocations();

/**
 * 
 * @param {*} locations 
 */
function renderCards(locations) {
  const grid = document.getElementById("cards-grid");
  for (let i = 0; i < locations.length; i++) {
    grid.insertAdjacentHTML("beforeend", `
      <div class="card">

        <div class="card-image-wrapper">
          <img src="ex-img-url-here" alt="Location name" class="card-image">
          <button class="bookmark-btn">
            <span class="material-symbols-outlined">bookmark_heart</span>
          </button>
        </div>

        <div class="card-body">
          <p class="card-name">${locations[i].name}</p>
          <div class="card-meta">
            <span class="meta-distance">X km</span>
            <span class="meta-price">$$</span>
          </div>
          <div class="card-tags">
            ${locations[i].tags.map(tag => {
              return '<span class="tag">' + tag + '</span>'
            }).join('')}
          </div>
        </div>

      </div>
    `);
  }
}

/**
 * 
 * @param {*} event 
 * @param {*} locationId 
 */
function toggleSave(event, locationId) {
  event.stopPropagation(); //Prevent bubbling
  //TODO: Save/unsave a location...if a location isnt saved then save it, else if it is save then unsave it
}

/**
 * 
 * @param {*} locationId 
 */
function openLocation(locationId) {
  // TODO: Redirect to location detail page
}

function openFilters() {
  // TODO: Show the filter panel
}

/**
 *
 */
function openSaved() {
  // TODO: Show saved places page
}

/*
* Call loadLocations() once the functions are finished :p probs about it
*/