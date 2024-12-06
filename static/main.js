const projectForm = document.getElementById("projectForm");
const projectNameInput = document.getElementById("projectName");
const projectEarningsInput = document.getElementById("projectEarnings");
const projectHoursInput = document.getElementById("projectHours");
const projectsList = document.getElementById("projectsList");
const totalEarningsDisplay = document.getElementById("totalEarnings");
const totalHoursDisplay = document.getElementById("totalHours");
const averageHourlyRateDisplay = document.getElementById("averageHourlyRate");
const averageVotesDisplay = document.getElementById("averageVotes");
const shopContainer = document.getElementById("shopContainer");
const locationFilter = document.getElementById("locationFilter");
const goalName = document.getElementById("goalName");
const canBuyGoal = document.getElementById("canBuyGoal");
const doubloonsLeft = document.getElementById("doubloonsLeft");
const timeLeft = document.getElementById("timeLeft");
const scrollToTop = document.getElementById("scrollToTop");
const goalImage = document.getElementById("goalImage");
const isBlessed = document.getElementById("isBlessed");
const submitButton = document.getElementById("submitButton");
const importButton = document.getElementById("importButton");
const exportButton = document.getElementById("exportButton");
const selectedItemDropdown = document.getElementById("selectedItem");
const spendingsForm = document.getElementById("spendingsForm");
const spendingsList = document.getElementById("spendingsList");
const totalSpentDisplay = document.getElementById("totalSpent");
const extraDoubloons = document.getElementById("extraDoubloons");

let totalEarnings = 0;
let totalHours = 0;

const locations = ["Us", "Eu", "In", "Xx", "Ca", "All"];

let shopData = [];
let filteredData = [];
let totalSpent = {}; // Object to track total spent on each item
let selectedItemId = null; // Track the selected item ID

const doubloonUrl =
  "https://raw.githubusercontent.com/hackclub/high-seas/refs/heads/main/public/doubloon.svg";
const doubloonImage = `<img src="${doubloonUrl}" alt="doubloons" width="20" height="20" draggable="false" class="doubloon">`;

const hoursSvg =
  '<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="clock" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="24" height="24" style="display: inline-block; vertical-align: middle;"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M26 16c0 5.523-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6s10 4.477 10 10zm2 0c0 6.627-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4s12 5.373 12 12z"></path><path d="M15.64 17a1 1 0 0 1-1-1V9a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1z"></path><path d="M21.702 19.502a1 1 0 0 1-1.366.366l-5.196-3a1 1 0 0 1 1-1.732l5.196 3a1 1 0 0 1 .366 1.366z"></path></g></svg>';
const votesSvg =
  '<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="18" height="18" style="display: inline-block; vertical-align: middle;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zm64 192c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-96c0-17.7 14.3-32 32-32zm64-64c0-17.7 14.3-32 32-32s32 14.3 32 32l0 192c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-192zM320 288c17.7 0 32 14.3 32 32l0 32c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-32c0-17.7 14.3-32 32-32z"></path></svg>';

const textEncoder = new TextEncoder();

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
  const jsonData = await fetchJSON(
    "https://raw.githubusercontent.com/ImShyMike/Doubloon-Finance/refs/heads/main/static/shop.json",
  );
  if (!jsonData || !jsonData.value) {
    console.error("Invalid shop data format");
    return;
  }

  // Parse and clean the data
  shopData = jsonData.value.map((item) => {
    const locationKeys = Object.keys(item).filter((key) =>
      key.startsWith("enabled"),
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

  // Restore the previous location
  restoreFilter();

  // Restore selection after shop data is loaded
  restoreSelection();

  filterShop();
}

// Render the shop data
function renderShop(data) {
  shopContainer.innerHTML = "";

  data.forEach((item) => {
    const shopItem = document.createElement("div");
    shopItem.className = "shop-item";
    shopItem.dataset.id = item.id;

    let price = item.enabledUs === true ? item.priceUs : item.priceGlobal;
    let minTime = item.minimumHoursEstimated.toFixed(0);
    let maxTime = item.maximumHoursEstimated.toFixed(0);
    let subtitle = item.subtitle ? item.subtitle : "";

    shopItem.innerHTML = `
      <h3>${item.name}</h3>
      <p>${doubloonImage} ${price} (${minTime}-${maxTime} hours)</p>
      <p>${subtitle}</p>
      <img src="${item.imageUrl}" alt="${item.name}" class="shop-item-image" draggable="false" loading="lazy"  width="220" height="165"/>
    `;

    shopItem.item = item;

    if (item.outOfStock || item.comingSoon) {
      shopItem.classList.add("not-available");
    }

    shopItem.addEventListener("click", () => handleSelection(item.id));

    shopContainer.appendChild(shopItem);
  });
}

function getItemById(id) {
  return shopData.find((item) => item.id === id);
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
      `.shop-item[data-id="${selectedItemId}"]`,
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
  const itemData = { id };
  localStorage.setItem("selectedItem", JSON.stringify(itemData));
}

function updateGoalContainer(id) {
  if (id === "None") {
    goalImage.src = "";
    goalName.innerHTML = `None (${doubloonImage})`;
    doubloonsLeft.innerHTML = `Doubloons until goal: 0 ${doubloonImage}`;
    timeLeft.innerHTML = "Estimated hours left: 0";
    canBuyGoal.innerHTML = "No (0%)";
    canBuyGoal.classList.add("red");
    canBuyGoal.classList.remove("green");
    return;
  }

  const totalSpentAmount = Object.entries(totalSpent).reduce((total, [id, count]) => {
    const item = shopData.find(item => item.id === id);
    if (item) {
        return total + (item.priceGlobal * count); // Calculate total spent for each item
    }
    return total; // If item is not found, just return the total
  }, 0);

  // Update the goal container
  let item = getItemById(id);
  if (!item) {
    console.warn(`Item with ID ${id} not found in shopData.`);
    return; // Exit if the item is not found
  }

  const extraAmount = parseInt(extraDoubloons.value) || 0;
  console.log(extraAmount);
  let currentDoubloons = Math.max(0, (extraAmount + totalEarnings) - totalSpentAmount);

  let price = item.enabledUs === true ? item.priceUs : item.priceGlobal;
  goalName.innerHTML = `${item.name} (${price} ${doubloonImage})`;

  // Calculate doubloons left until the goal
  const doubloonsNeeded = price - currentDoubloons;
  doubloonsLeft.innerHTML = `Doubloons until goal: ${doubloonsNeeded > 0 ? doubloonsNeeded : 0} ${doubloonImage}`;

  // Calculate estimated time left based on current doubloons and average hourly rate
  const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
  const estimatedHours =
    averageHourlyRate > 0 ? (price - currentDoubloons) / averageHourlyRate : 0;
  timeLeft.innerHTML = `Estimated hours left: ${estimatedHours > 0 ? estimatedHours.toFixed(2) : 0}`;

  // Calculate if goal can be bought (if yes, how many times)
  const buyAmount = currentDoubloons / price;
  const remainingToNext = price - (currentDoubloons % price);
  const remainingPercentage = 100 - (remainingToNext / price) * 100;
  if (buyAmount >= 1) {
    if (remainingPercentage > 0 && remainingPercentage !== 100) {
      canBuyGoal.textContent = `${buyAmount.toFixed(0)} (+${remainingPercentage.toFixed(0)}%)`;
    } else {
      canBuyGoal.textContent = `${buyAmount.toFixed(0)}`;
    }
    canBuyGoal.classList.add("green");
    canBuyGoal.classList.remove("red");
  } else {
    canBuyGoal.textContent = `No (${(buyAmount * 100).toFixed(0)}%)`;
    canBuyGoal.classList.add("red");
    canBuyGoal.classList.remove("green");
  }

  // Set the image to the item's image
  goalImage.src = item.imageUrl;
}

// Restore selection from localStorage on page load
function restoreSelection() {
  const selectedItemObj = JSON.parse(localStorage.getItem("selectedItem"));
  selectedItemId = selectedItemObj?.id || null; // Ensure selectedItemId is set correctly

  if (selectedItemId) {
    const savedItem = document.querySelector(
      `.shop-item[data-id="${selectedItemId}"]`,
    );
    if (savedItem) {
      savedItem.classList.add("selected");
      handleSelection(savedItem.id);
      updateGoalContainer(selectedItemId);
    } else {
      console.warn("Selected item from storage not found in DOM.");
    }
  } else {
    console.warn("No selected item found in localStorage.");
  }
}

// Restore the shop filter
function restoreFilter() {
  const selectedFilter = localStorage.getItem("filter");
  if (selectedFilter && locations.includes(selectedFilter)) {
    locationFilter.value = selectedFilter;
  }
}

function populateSpendingsDropdown(shopData) {
  selectedItemDropdown.innerHTML = "";
  shopData.forEach((item) => {
    const optionElement = document.createElement("option");
    optionElement.value = item.id;
    optionElement.text = item.name;
    selectedItemDropdown.add(optionElement);
  });
}

// Filter shop items based on location
function filterShop() {
  const selectedLocation = locationFilter.value;
  localStorage.setItem("filter", selectedLocation);
  updateGoalContainer("None");

  if (selectedLocation === "") {
    // No filter, show all
    filteredData = shopData;
  } else {
    // Filter by selected location
    filteredData = shopData.filter((item) =>
      item.availableLocations.includes(selectedLocation),
    );
  }

  populateSpendingsDropdown(filteredData);

  renderShop(filteredData);
}

// Add project to the list
function addProjectToList(name, earnings, hours, blessed) {
  const hourlyRate = (earnings / hours).toFixed(2);
  const blessedRate = ((earnings - earnings / 1.2) / hours);

  const averageVotes = blessed ? ((hourlyRate - blessedRate) - 4.8) / 1.92 : (hourlyRate - 4.8) / 1.92;

  const projectItem = document.createElement("li");
  projectItem.classList.add("project-item");

  const projectInfo = document.createElement("div");
  projectInfo.classList.add("project-info");
  projectInfo.innerHTML = `
      <strong class="projectNameInfo">${blessed && !name.includes("🏴‍☠️ ") ? "🏴‍☠️ " : ""}${name}</strong>
      <span class="label">Earnings: </span><span class="value">${doubloonImage} ${earnings} ${blessed ? ` (+${(earnings - earnings / 1.2).toFixed(0)})` : ""}</span>
      <span class="label">Hours: </span><span class="value">${hoursSvg} ${hours} hours</span>
      <span class="label">Doubloons/Hour: </span><span class="value">${doubloonImage} ${hourlyRate} ${blessed ? ` (+${blessedRate.toFixed(2)})` : ""} / hour</span>
      <span class="label">Votes: </span><span class="value">${votesSvg} ~${averageVotes.toFixed(0)}/10 ${averageVotes > 10 || averageVotes < 0 ? " ???" : ""} votes</span>
  `;

  const editButton = document.createElement("button");
  editButton.classList.add("project-edit-btn");
  editButton.textContent = "Edit";
  editButton.addEventListener("click", () => {
    if (editButton.textContent === "Exit") {
      // Clear inputs
      projectNameInput.value = "";
      projectEarningsInput.value = "";
      projectHoursInput.value = "";
      isBlessed.checked = false;
      editButton.textContent = "Edit";
      submitButton.textContent = "Add Project";
      delete editingItem.dataset.editing;
      return;
    }

    // Populate inputs with current project data for editing
    const project = editButton.parentElement.parentElement;
    projectNameInput.value =
      project.querySelector(".projectNameInfo").textContent.replace("🏴‍☠️ ", "");
    projectEarningsInput.value = project
      .querySelector("span:nth-child(3)")
      .textContent.split(" ")[1];
    projectHoursInput.value = project
      .querySelector("span:nth-child(5)")
      .textContent.split(" ")[1];
    isBlessed.checked = project.classList.contains("blessedProject");
    // Store the project item for later replacement
    projectItem.dataset.editing = true; // Mark this item as being edited
    // Change the add button to "Save"
    submitButton.textContent = "Save";
    // Change own button to "Exit"
    editButton.textContent = "Exit";
  });

  const removeButton = document.createElement("button");
  removeButton.classList.add("project-remove-btn");
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => {
    projectItem.remove();
    totalEarnings -= earnings;
    totalHours -= hours;
    updateTotals();
    saveProjectsToLocalStorage();
    if (selectedItemId) {
      handleSelection(selectedItemId);
    }
    // If was being edited, reset state
    const projectButtonContainer = removeButton.parentElement;
    projectNameInput.value = "";
    projectEarningsInput.value = "";
    projectHoursInput.value = "";
    isBlessed.checked = false;
    projectButtonContainer.getElementsByClassName(
      "project-edit-btn",
    )[0].textContent = "Edit";
    submitButton.textContent = "Add Project";
  });

  projectInfo.addEventListener("click", () => {
    projectItem.classList.toggle("unexpanded");
  });

  // Append buttons to the project item
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("project-button-container");
  buttonContainer.appendChild(editButton);
  buttonContainer.appendChild(removeButton);
  projectItem.appendChild(projectInfo);
  projectItem.appendChild(buttonContainer);
  projectItem.classList.add("unexpanded");
  projectsList.appendChild(projectItem);
  projectItem.classList.toggle("blessedProject", !!blessed);
}

// Calculate total hours
function calculateTotalHours() {
  totalHours = [...projectsList.children].reduce((sum, item) => {
    const hours = parseFloat(
      item.querySelector("span:nth-child(5)").textContent.match(/([\d.]+)/)[0],
    );
    return sum + (isNaN(hours) ? 0 : hours);
  }, 0);
}

// Calculate total earnings
function calculateTotalEarnings() {
  totalEarnings = [...projectsList.children].reduce((sum, item) => {
    const earnings = parseFloat(
      item.querySelector(".value").textContent.match(/([\d.]+)/)[0],
    );
    return sum + (isNaN(earnings) ? 0 : earnings);
  }, 0);
}

// Update totals display
function updateTotals() {
  calculateTotalEarnings(); // Calculate total earnings
  calculateTotalHours(); // Calculate total hours
  const averageHourlyRate =
    totalHours > 0 ? (totalEarnings / totalHours).toFixed(2) : 0;

  // Calculate blessed earnings and blessed hours
  const blessedProjects = [...projectsList.children].filter((item) =>
    item.classList.contains("blessedProject"),
  );
  const blessedEarnings = blessedProjects.reduce((sum, item) => {
    const earnings = parseFloat(
      item.querySelector(".value").textContent.match(/([\d.]+)/)[0],
    );
    return sum + (earnings - earnings / 1.2);
  }, 0);

  const blessedAverageHours = (blessedEarnings / totalHours);

  const averageVotes = ((averageHourlyRate - blessedAverageHours) - 4.8) / 1.92;

  totalEarningsDisplay.innerHTML = `Total Earnings: ${doubloonImage} ${totalEarnings} ${blessedEarnings > 0 ? ` (+${blessedEarnings.toFixed(0)})` : ""}`;
  totalHoursDisplay.innerHTML = `Total Hours: ${hoursSvg} ${totalHours.toFixed(2)} hours`;
  averageHourlyRateDisplay.innerHTML = `Hourly Rate: ${doubloonImage} ${averageHourlyRate} / hour${blessedAverageHours > 0 ? ` (+${blessedAverageHours.toFixed(2)})` : ""}`;
  averageVotesDisplay.innerHTML = `Average Votes: ${votesSvg} ${averageHourlyRate > 0 ? `~${averageVotes.toFixed(0)}/10 ${averageVotes > 10 || averageVotes < 0 ? " ???" : ""}` : 0} votes`;
}

// Function to add spending to the list
function addSpendingToList(name, id) {
  const spendingsInfoContainer = document.createElement("li");
  spendingsInfoContainer.dataset.id = id;

  const item = getItemById(id);
  const selectedLocation = locationFilter.value;
  const price = selectedLocation === "Us" ? item.priceUs : item.priceGlobal

  const spendingsInfo = document.createElement("div");
  spendingsInfo.classList.add("project-info");
  spendingsInfo.innerHTML = `
    <strong>${name} ${doubloonImage} ${price}</strong>
    <span class="count">1</span>
  `;

  const removeButton = document.createElement("button");
  removeButton.classList.add("remove-spending-btn");
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => {
    const countSpan = spendingsInfo.querySelector('.count');
    const nameSpan = spendingsInfo.querySelector('strong');
    let count = parseInt(countSpan.textContent);
    if (count > 1) {
      countSpan.textContent = count - 1;
      totalSpent[id] -= 1;
      nameSpan.innerHTML = count > 2 ? `${name} ${doubloonImage} ${price}  (${doubloonImage} ${(price * (count-1)).toFixed(0)})` : `${name} ${doubloonImage} ${price}`
    } else {
      spendingsInfoContainer.remove();
      delete totalSpent[id];
    }
    updateTotalSpentDisplay();
    const spendingsItems = Object.entries(totalSpent).map(([id, count]) => ({ id, count }))
    localStorage.setItem("spendings", JSON.stringify(spendingsItems));
  });

  // Check if the item already exists in the spendings list
  const existingItem = [...spendingsList.children].find(item => item.dataset.id === id);
  if (existingItem) {
    // If it exists, increment the count and update total spent
    const countSpan = existingItem.querySelector('.count');
    const nameSpan = existingItem.querySelector('strong');
    let count = parseInt(countSpan.textContent) + 1;
    nameSpan.innerHTML = count > 1 ? `${name} ${doubloonImage} ${price}  (${doubloonImage} ${(price * count).toFixed(0)})` : `${name} ${doubloonImage} ${price}`
    countSpan.textContent = count;
    totalSpent[id] += 1; // Increment the spent count
  } else {
    // Initialize total spent for this item
    totalSpent[id] = 1; // Set initial spent count
    spendingsInfoContainer.appendChild(spendingsInfo);
    spendingsInfoContainer.appendChild(removeButton);
    spendingsList.appendChild(spendingsInfoContainer);
  }

  updateTotalSpentDisplay(); // Update display after adding

  const spendingsItems = Object.entries(totalSpent).map(([id, count]) => ({ id, count }))

  localStorage.setItem("spendings", JSON.stringify(spendingsItems));
}

// Function to update total spent display
function updateTotalSpentDisplay() {
  const totalSpentAmount = Object.entries(totalSpent).reduce((total, [id, count]) => {
      const item = shopData.find(item => item.id === id);
      if (item) {
          return total + (item.priceGlobal * count); // Calculate total spent for each item
      }
      return total; // If item is not found, just return the total
  }, 0);

  // Display total spent
  totalSpentDisplay.innerHTML = `Total Spent: ${doubloonImage} ${totalSpentAmount.toFixed(0)}`;
  
  // Update goal container based on total spent
  updateGoalContainer(selectedItemId);
}

// Function to save projects and totals to localStorage
function saveProjectsToLocalStorage() {
  const projectItems = [...projectsList.children].map((item) => {
    const projectInfo = item.querySelector(".project-info");
    const name = projectInfo
      .querySelector("strong")
      .textContent.replace("🏴‍☠️ ", "");
    const blessed = !!item.classList.contains("blessedProject");
    const [earnings, hours] = [...projectInfo.querySelectorAll(".value")].map(
      (span) => parseFloat(span.textContent.match(/([\d.]+)/)[0]),
    );

    return { name, earnings, hours, blessed };
  });

  localStorage.setItem("projects", JSON.stringify(projectItems));
}

// Load shop data on page load
document.addEventListener("DOMContentLoaded", () => {
  // Attach filter event
  locationFilter.addEventListener("change", filterShop);

  window.addEventListener("scroll", () => {
    if (window.scrollY > 0) {
      scrollToTop.classList.remove("hidden");
    } else {
      scrollToTop.classList.add("hidden");
    }
  });

  spendingsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const selectedItemId = selectedItemDropdown.value;
    const selectedItemName = selectedItemDropdown.options[selectedItemDropdown.selectedIndex].text;

    // Check if the item already exists in the spendings list
    const existingItem = [...spendingsList.children].find(item => item.dataset.id === selectedItemId);

    const item = getItemById(selectedItemId);
    const selectedLocation = locationFilter.value;
    const price = selectedLocation === "Us" ? item.priceUs : item.priceGlobal

    if (existingItem) {
        // If it exists, increment the count and update total spent
        const countSpan = existingItem.querySelector('.count');
        const name = existingItem.querySelector('strong');
        let count = parseInt(countSpan.textContent) + 1;
        countSpan.textContent = count;
        name.innerHTML = count > 1 ? `${selectedItemName} ${doubloonImage} ${price}  (${doubloonImage} ${(price * count).toFixed(0)})` : `${selectedItemName} ${doubloonImage} ${price}`

        // Update total spent for this item
        totalSpent[selectedItemId] += 1; // Increment the spent count
    } else {
        // If it doesn't exist, create a new entry
        const spendingsInfoContainer = document.createElement("li");
        spendingsInfoContainer.dataset.id = selectedItemId;

        const spendingsInfo = document.createElement("div");
        spendingsInfo.classList.add("project-info");
        spendingsInfo.innerHTML = `
          <strong>${selectedItemName} ${doubloonImage} ${price}</strong>
          <span class="count">1</span>
        `;

        // Create a remove button
        const removeButton = document.createElement("button");
        removeButton.classList.add("remove-spending-btn");
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => {
            const countSpan = spendingsInfo.querySelector('.count');
            const name = spendingsInfo.querySelector('strong');
            let count = parseInt(countSpan.textContent);
            if (count > 1) {
                countSpan.textContent = count - 1; // Decrement the count
                totalSpent[selectedItemId] -= 1; // Decrement the spent count
                name.innerHTML = count > 2 ? `${selectedItemName} ${doubloonImage} ${price}  (${doubloonImage} ${(price * (count-1)).toFixed(0)})` : `${selectedItemName} ${doubloonImage} ${price}`;
            } else {
                spendingsInfoContainer.remove(); // Remove the item if count is 1
                delete totalSpent[selectedItemId]; // Remove from total spent tracking
            }
            updateTotalSpentDisplay(); // Update total spent display
        });

        // Initialize total spent for this item
        totalSpent[selectedItemId] = 1; // Set initial spent count

        spendingsInfoContainer.appendChild(spendingsInfo);
        spendingsInfoContainer.appendChild(removeButton);
        spendingsList.appendChild(spendingsInfoContainer);
    }

    updateTotalSpentDisplay(); // Update total spent display

    const spendingsItems = Object.entries(totalSpent).map(([id, count]) => ({ id, count }))
  
    localStorage.setItem("spendings", JSON.stringify(spendingsItems));
  });

  // Handle project submission
  projectForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const projectName = projectNameInput.value.replace("🏴‍☠️ ", "").trim();
    const projectEarnings = parseFloat(projectEarningsInput.value);
    const projectHours = parseFloat(projectHoursInput.value);
    const blessed = !!isBlessed.checked;

    if (projectName && !isNaN(projectEarnings) && !isNaN(projectHours)) {
      // Check if editing an existing project
      const editingItem = [...projectsList.children].find(
        (item) => item.dataset.editing,
      );
      if (editingItem) {
        // Update the existing project
        const projectHourlyRate = projectEarnings / projectHours;
        const projectAverageVotes = blessed ? (((projectEarnings / 1.2) / projectHours) - 4.8) / 1.92 : (projectHourlyRate - 4.8) / 1.92;
        editingItem.querySelector(".projectNameInfo").textContent = blessed
          ? "🏴‍☠️ " + projectName
          : projectName;
        const spans = editingItem.querySelectorAll(".value");
        spans[0].innerHTML = `${doubloonImage} ${projectEarnings} ${blessed ? ` (+${(projectEarnings - projectEarnings / 1.2).toFixed(0)})` : ""}`;
        spans[1].innerHTML = `${hoursSvg} ${projectHours} hours`;
        spans[2].innerHTML = `${doubloonImage} ${projectHourlyRate.toFixed(2)} ${blessed ? ` (+${((projectEarnings - projectEarnings / 1.2) / projectHours).toFixed(2)})` : ""} / hour`;
        spans[3].innerHTML = `${votesSvg} ~${projectAverageVotes.toFixed(0)}/10 ${projectAverageVotes > 10 || projectAverageVotes < 0 ? " ???" : ""} votes`;

        // Update blessed state
        editingItem.classList.toggle("blessedProject", blessed);

        // Set the exit button back to "Edit"
        editingItem.getElementsByClassName("project-edit-btn")[0].textContent =
          "Edit";

        // Remove editing marker
        delete editingItem.dataset.editing;

        // Restore submit button text
        submitButton.textContent = "Add Project";
      } else {
        // Add project to the list
        addProjectToList(projectName, projectEarnings, projectHours, !!blessed);
      }

      // Update totals
      updateTotals(); // Update totals after adding or editing a project

      // Save to localStorage
      saveProjectsToLocalStorage();

      // Clear inputs
      projectNameInput.value = "";
      projectEarningsInput.value = "";
      projectHoursInput.value = "";
      isBlessed.checked = false;

      if (selectedItemId) {
        handleSelection(selectedItemId);
      }
    }
  });

  importButton.addEventListener("click", () => {
    const b64String = prompt("Paste text here:");
    const binaryString = atob(b64String);
    const decodedData = new Uint8Array(
      binaryString.split("").map((char) => char.charCodeAt(0)),
    );
    const textDecoder = new TextDecoder();
    const jsonString = textDecoder.decode(decodedData);
    const importedData = JSON.parse(jsonString);

    const { filter, projects, selectedItem, spendings, extra } = importedData;

    if (filter && projects && selectedItem) {
      // Apply location filter
      locationFilter.value = filter;
      extraDoubloons.value = extra;

      // Clear existing projects
      projectsList.innerHTML = "";

      // Add imported projects
      projects.forEach((project) => {
        addProjectToList(
          project.name,
          project.earnings,
          project.hours,
          project.blessed,
        );
      });

      filterShop();

      // Update the selected item
      selectedItemId = selectedItem;
      localStorage.setItem(
        "selectedItem",
        JSON.stringify({ id: selectedItemId }),
      );

      handleSelection(selectedItemId);

      // Update goal container
      updateGoalContainer(selectedItemId);

      // Update totals
      updateTotals();

      // Save imported state to localStorage
      saveProjectsToLocalStorage();

      // Reselect to calculate goal data
      handleSelection(selectedItemId);

      if (spendings) {
        spendingsList.innerHTML = "";
        totalSpent = {};
        spendings.forEach(({ id, count }) => {
          const item = shopData.find(item => item.id === id);
          for (let i = 0; i < count; i++) {
            addSpendingToList(item.name, id);
          }
        });
      }
    } else {
      alert("Invalid data, could not import!");
    }
  });

  exportButton.addEventListener("click", () => {
    const projects = [...projectsList.children].map((item) => {
      const projectInfo = item.querySelector(".project-info");
      const name = projectInfo
        .querySelector("strong")
        .textContent.replace("🏴‍☠️ ", "");
      const blessed = !!item.classList.contains("blessedProject");
      const extra = extraDoubloons.value;
      const [earnings, hours] = [...projectInfo.querySelectorAll(".value")].map(
        (span) => parseFloat(span.textContent.match(/([\d.]+)/)[0]),
      );

      return { name, earnings, hours, blessed, extra };
    });

    const jsonString = JSON.stringify({
      filter: locationFilter.value,
      projects,
      selectedItem: selectedItemId,
      spendings: Object.entries(totalSpent).map(([id, count]) => ({ id, count })), // Include spendings
    });
    const encodedData = textEncoder.encode(jsonString);
    const binaryString = Array.from(encodedData)
      .map((byte) => String.fromCharCode(byte))
      .join("");
    const b64String = btoa(binaryString);
    navigator.clipboard.writeText(b64String);

    alert("Data copied to clipboard!");
  });

  extraDoubloons.addEventListener("input", () => {
    updateGoalContainer(selectedItemId);
    localStorage.setItem("extra", extraDoubloons.value);
  });

  loadShopData().then(() => {
    // Restore the filter
    restoreFilter();

    // Restore saved projects
    const savedProjects = JSON.parse(localStorage.getItem("projects")) || [];
    savedProjects.forEach((project) =>
      addProjectToList(
        project.name,
        project.earnings,
        project.hours,
        project.blessed,
      ),
    );

    // Restore selected item
    restoreSelection();

    // Update totals
    updateTotals();

    updateTotalSpentDisplay();

    if (selectedItemId) {
      handleSelection(selectedItemId);
    }

    // Restore spendings
    const savedSpendings = JSON.parse(localStorage.getItem("spendings")) || [];
    if (savedSpendings) {
      spendingsList.innerHTML = "";
      totalSpent = {};
      savedSpendings.forEach(({ id, count }) => {
        const item = getItemById(id);
        for (let i = 0; i < count; i++) {
          addSpendingToList(item.name, id); // Function to add spending to the list
        }
      });
    }

    extraDoubloons.value = localStorage.getItem("extra");

    // Update total spent display after loading spendings
    updateTotalSpentDisplay(); // Ensure total spent is updated after loading spendings

    // Update goal container based on total spent
    if (selectedItemId) {
      updateGoalContainer(selectedItemId); // Update goal container with the current selected item
    } else {
      console.warn("No selected item ID found on page load.");
    }
  });
});
