// Check if authenticated
async function checkAuth() {
  const res = await fetch("/api/authentication");
  const auth = await res.json();
  if (!auth.authenticated) {
    window.location.href = "../html/Login.html";
  }
}
checkAuth();

/**
 * Reference: COMP1800_202530_BBY21 project
 * https://github.com/RuleOfSix/1800_202530_BBY21
 */

/**
 * Loads saved location only from the logged in user.
 * Load all locations and filter them to have only the same ids in the userSavedList.
 */
async function loadSavedLocations() {
  const locations = await loadLocations();
  const userSavedList = await loadUserSavedList();

  const savedLocations = locations.filter((location) =>
    userSavedList.includes(location._id),
  );

  renderCards(savedLocations);
}

/**
 * Loads in locations from the database. (helper method)
 */
async function loadLocations() {
  const res = await fetch("/api/locations");
  return await res.json();
}

/**
 * Loads saved_list in users from the database (helper method)
 */
async function loadUserSavedList() {
  const res = await fetch("/api/users");
  const users = await res.json();

  // TODO: Needs to be updated as soon as the session logic is comepleted.
  const testUser = users.find((user) => user.username === "test");

  if (testUser && testUser.saved_list) {
    return testUser.saved_list;
  }
}

loadSavedLocations();

/**
 * @param savedLocations locations that filtered by user saved list.
 *        User saved list contains array of ids that user saved.
 */
function renderCards(savedLocations) {
  const grid = document.getElementById("section__saved-page");
  grid.innerHTML = "";

  for (let i = 0; i < savedLocations.length; i++) {
    // TODO: images need to be updated: either from the databse or from the images folder.
    grid.insertAdjacentHTML(
      "beforeend",
      `<article class="card" data-id="${savedLocations[i]._id}">
        <div class="card__image-container">
            <img
            src="/img/queensborough.jpg"
            alt="Queensborough Coummnity Centre"
            />
            <button type="button" class="card__save-btn">
            <span
                class="material-symbols-outlined material-symbols-outlined-bookmark"
            >
                bookmark
            </span>
            </button>
        </div>
        <div class="card__text-container">
            <h3 class="card__title">${savedLocations[i].name}</h3>
        </div>
    </article>
    `,
    );

    const lastCard = grid.lastElementChild;
    const saveBtn = lastCard.querySelector(".card__save-btn");
    const bookmarkIcon = saveBtn.querySelector(
      ".material-symbols-outlined-bookmark",
    );

    saveBtn.addEventListener("click", () => {
      toggleSaveBtn(savedLocations[i]._id, bookmarkIcon);
    });
  }
}

/**
 * Changes bookmark icon as the user clicked and updates user's saved_list.
 * @pararm savedLocationsId the id of each card that needs to be updated.
 * @param bookmarkIcon the icon in the save button that the user clicked.
 */
async function toggleSaveBtn(savedLocationId, bookmarkIcon) {
  const savedIcon = bookmarkIcon.classList.contains(
    "material-symbols-outlined-bookmark",
  );

  if (savedIcon) {
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark-unsave");
    unsavePlace(savedLocationId);
  } else {
    // to save the place again before leaving the page
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark-unsave");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark");
    savePlace(savedLocationId);
  }
}

/**
 * Example: postJson(data)
 * https://developer.mozilla.org/ko/docs/Web/API/Fetch_API/Using_Fetch
 *
 * Removes a savedlocation ID to the user's saved_list in the database. (helper method)
 * @param savedLocationId the id of each card that needs to be updated.
 */
async function unsavePlace(savedLocationId) {
  try {
    const response = await fetch("/api/unsave-location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ savedLocationId: savedLocationId }),
    });

    const result = await response.json();
    console.log("unsavePlace - success: ", result.message);
  } catch (error) {
    console.log("unsavePlace - fail: ", error);
  }
}

/**
 * Adds a savedlocation ID to the user's saved_list in the database. (helper method)
 * @param savedLocationId the id of each card that needs to be updated.
 */
async function savePlace(savedLocationId) {
  try {
    const response = await fetch("/api/save-location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ savedLocationId: savedLocationId }),
    });

    const result = await response.json();
    console.log("savePlace - success: ", result.message);
  } catch (error) {
    console.log("savePlace - fail: ", error);
  }
}
