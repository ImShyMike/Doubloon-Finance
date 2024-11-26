const projectForm = document.getElementById("projectForm");
const projectNameInput = document.getElementById("projectName");
const projectEarningsInput = document.getElementById("projectEarnings");
const projectHoursInput = document.getElementById("projectHours");
const projectsList = document.getElementById("projectsList");
const totalEarningsDisplay = document.getElementById("totalEarnings");
const totalHoursDisplay = document.getElementById("totalHours");
const averageHourlyRateDisplay = document.getElementById("averageHourlyRate");
const shopContainer = document.getElementById("shopContainer");
const locationFilter = document.getElementById("locationFilter");
const goalName = document.getElementById("goalName");
const doubloonsLeft = document.getElementById("doubloonsLeft");
const timeLeft = document.getElementById("timeLeft");
const scrollToTop = document.getElementById("scrollToTop");

let totalEarnings = 0;
let totalHours = 0;

const locations = ["Us", "Eu", "In", "Xx", "Ca", "All"];

let shopData = [];
let filteredData = [];
let selectedItemId = null; // Track the selected item ID

// Fetch JSON from a URL
async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching JSON:", error);
  }
}

// Load shop data and parse it
async function loadShopData() {
  const jsonData = await fetchJSON("https://raw.githubusercontent.com/ImShyMike/Doubloon-Finance/refs/heads/main/static/shop.json");
  if (!jsonData || !jsonData.value) {
    console.error("Invalid shop data format");
    return;
  }

  // Parse and clean the data
  shopData = jsonData.value.map((item) => {
    const locationKeys = Object.keys(item).filter((key) =>
      key.startsWith("enabled")
    );
    const availableLocations = locationKeys
      .filter((key) => item[key])
      .map((key) => key.replace("enabled", ""));
    item.availableLocations = availableLocations;
    locationKeys.forEach((key) => delete item[key]);
    return item;
  });

  // Render the shop data
  renderShop(shopData);
  
  // Restore selection after shop data is loaded
  restoreSelection();
}

// Render the shop data
function renderShop(data) {
  shopContainer.innerHTML = "";

  data.forEach((item) => {
    const shopItem = document.createElement("div");
    shopItem.className = "shop-item";
    shopItem.dataset.id = item.id;

    let price = 0;
    if (item.enabledUs === true) {
      price = item.priceUs;
    } else {
      price = item.priceGlobal;
    }

    let minTime = Number(item.minimumHoursEstimated).toFixed(0).toString();
    let maxTime = Number(item.maximumHoursEstimated).toFixed(0).toString();

    let subtitle = "";
    if (item.subtitle) {
      subtitle = item.subtitle;
    }

    shopItem.innerHTML = `
      <h3>${item.name}</h3>
      <p><img src="https://highseas.hackclub.com/doubloon.svg" alt="doubloons" width="20" height="20" class="doubloon"> ${price} (${minTime}-${maxTime} hours)</p>
      <p>${subtitle}</p>
      <img src="${item.imageUrl}" alt="${item.name}" class="shop-item-image" loading="lazy"/>
    `;

    shopItem.item = item;

    if (item.outOfStock) {
      shopItem.classList.add("not-available");
    }

    shopItem.addEventListener("click", () => handleSelection(item.id));

    shopContainer.appendChild(shopItem);
  });
}

function getItemById(id) {
  const item = shopData.find((item) => item.id === id);
  return item;
}

// Handle card selection
function handleSelection(id) {
  const currentItem = document.querySelector(`.shop-item[data-id="${id}"]`);

  // If no item is found in the DOM, fallback to localStorage
  if (!currentItem) {
    const selectedItemObj = JSON.parse(localStorage.getItem("selectedItem"));
    if (selectedItemObj && selectedItemObj.id === id) {
      return; // Already selected from storage
    }
    return; // No item found
  }

  // Prevent selection of unavailable items
  if (currentItem.classList.contains("not-available")) {
    return;
  }

  // Deselect the previously selected item
  if (selectedItemId) {
    const prevSelected = document.querySelector(
      `.shop-item[data-id="${selectedItemId}"]`
    );
    if (prevSelected) {
      prevSelected.classList.remove("selected");
    }
  }

  // Select the new item
  currentItem.classList.add("selected");
  selectedItemId = id;

  updateGoalContainer(id);

  // Save the selected item's data to localStorage
  const itemData = {
    id,
  };
  localStorage.setItem("selectedItem", JSON.stringify(itemData));
}

function updateGoalContainer(id) {
    // Update the goal container
    let item = getItemById(id);
    let price = 0;
    if (item.enabledUs === true) {
        price = item.priceUs;
    } else {
        price = item.priceGlobal;
    }
    goalName.innerHTML = `${item.name} (${price} <img src="https://highseas.hackclub.com/doubloon.svg" alt="doubloons" width="20" height="20" class="doubloon">)`;

    // Calculate doubloons left until the goal
    const doubloonsNeeded = price - totalEarnings;
    doubloonsLeft.innerHTML = `Doubloons until goal: ${doubloonsNeeded > 0 ? doubloonsNeeded : 0} <img src="https://highseas.hackclub.com/doubloon.svg" alt="doubloons" width="20" height="20" class="doubloon">`;

    // Calculate estimated time left based on current doubloons and average hourly rate
    const averageHourlyRate = totalHours > 0 ? (totalEarnings / totalHours) : 0;
    const estimatedHours = averageHourlyRate > 0 ? ((price - totalEarnings) / averageHourlyRate) : 0;
    timeLeft.innerHTML = `Estimated hours left: ${estimatedHours > 0 ? estimatedHours.toFixed(2) : 0}`;
}

// Restore selection from localStorage on page load
function restoreSelection() {
  const selectedItemObj = JSON.parse(localStorage.getItem("selectedItem"));
  if (selectedItemObj && selectedItemObj.id) {
    // Find the saved item in the DOM and apply the selected class
    const savedItem = document.querySelector(
      `.shop-item[data-id="${selectedItemObj.id}"]`
    );

    if (savedItem) {
      savedItem.classList.add("selected");
      selectedItemId = selectedItemObj.id;
      updateGoalContainer(selectedItemId);
    } else {
      console.warn("Selected item from storage not found in DOM.");
    }
  }
}

// Filter shop items based on location
function filterShop() {
  const selectedLocation = locationFilter.value;

  if (selectedLocation === "") {
    // No filter, show all
    filteredData = shopData;
  } else {
    // Filter by selected location
    filteredData = shopData.filter((item) =>
      item.availableLocations.includes(selectedLocation)
    );
  }

  renderShop(filteredData);
}

// Add project to the list
function addProjectToList(name, earnings, hours) {
  const hourlyRate = (earnings / hours).toFixed(2);

  const projectItem = document.createElement("li");

  const projectInfo = document.createElement("div");
  projectInfo.classList.add("project-info");
  projectInfo.innerHTML = `
      <strong>${name}</strong>
      <span>Earnings: ${earnings} doubloons</span>
      <span>Hours: ${hours}</span>
      <span>Doubloons/Hour: ${hourlyRate}</span>
  `;

  const removeButton = document.createElement("button");
  removeButton.classList.add("project-remove-btn");
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => {
      projectItem.remove();
      totalEarnings -= earnings;
      totalHours -= hours;
      updateTotals();
      saveProjectsToLocalStorage();
  });

  projectItem.appendChild(projectInfo);
  projectItem.appendChild(removeButton);
  projectsList.appendChild(projectItem);
}

// Update totals display
function updateTotals() {
  const averageHourlyRate = totalHours > 0 ? (totalEarnings / totalHours).toFixed(2) : 0;

  totalEarningsDisplay.innerHTML = `Total Earnings: ${totalEarnings} <img src="https://highseas.hackclub.com/doubloon.svg" alt="doubloons" width="20" height="20" class="doubloon">`;
  totalHoursDisplay.innerHTML = `Total Hours: ${totalHours}`;
  averageHourlyRateDisplay.innerHTML = `Average Hourly Rate: ${averageHourlyRate} <img src="https://highseas.hackclub.com/doubloon.svg" alt="doubloons" width="20" height="20" class="doubloon">/hour`;
}

// Save projects and totals to localStorage
function saveProjectsToLocalStorage() {
  const projectItems = [...projectsList.children].map((item) => {
      const projectInfo = item.querySelector(".project-info");
      const name = projectInfo.querySelector("strong").textContent;
      const [earnings, hours] = [...projectInfo.querySelectorAll("span")]
          .map(span => parseFloat(span.textContent.match(/([\d.]+)/)[0]));

      return { name, earnings, hours };
  });

  localStorage.setItem("projects", JSON.stringify(projectItems));
  localStorage.setItem("totalEarnings", totalEarnings.toString());
  localStorage.setItem("totalHours", totalHours.toString());
}

// Attach filter event
locationFilter.addEventListener("change", filterShop);

// Load shop data on page load
document.addEventListener("DOMContentLoaded", () => {
  loadShopData();

  const savedProjects = JSON.parse(localStorage.getItem("projects")) || [];
  totalEarnings = parseFloat(localStorage.getItem("totalEarnings")) || 0;
  totalHours = parseFloat(localStorage.getItem("totalHours")) || 0;

  // Restore saved projects
  savedProjects.forEach((project) => addProjectToList(project.name, project.earnings, project.hours));

  // Restore totals
  updateTotals();
});

window.addEventListener("scroll", () => {
  if (window.scrollY > 0) {
      scrollToTop.classList.remove("hidden");
  } else {
      scrollToTop.classList.add("hidden");
  }
});

// Handle project submission
projectForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const projectName = projectNameInput.value.trim();
  const projectEarnings = parseFloat(projectEarningsInput.value);
  const projectHours = parseFloat(projectHoursInput.value);

  if (projectName && !isNaN(projectEarnings) && !isNaN(projectHours)) {
      // Add project to the list
      addProjectToList(projectName, projectEarnings, projectHours);

      // Update totals
      totalEarnings += projectEarnings;
      totalHours += projectHours;
      updateTotals();

      // Save to localStorage
      saveProjectsToLocalStorage();

      // Clear inputs
      projectNameInput.value = "";
      projectEarningsInput.value = "";
      projectHoursInput.value = "";
  }
});