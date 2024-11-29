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
const canBuyGoal = document.getElementById("canBuyGoal");
const doubloonsLeft = document.getElementById("doubloonsLeft");
const timeLeft = document.getElementById("timeLeft");
const scrollToTop = document.getElementById("scrollToTop");
const goalImage = document.getElementById("goalImage");
const isBlessed = document.getElementById("isBlessed");
const submitButton = document.getElementById("submitButton");
const importButton = document.getElementById("importButton");
const exportButton = document.getElementById("exportButton");

let totalEarnings = 0;
let totalHours = 0;

const locations = ["Us", "Eu", "In", "Xx", "Ca", "All"];

let shopData = [];
let filteredData = [];
let selectedItemId = null; // Track the selected item ID

const doubloonUrl = "https://raw.githubusercontent.com/hackclub/high-seas/refs/heads/main/public/doubloon.svg";
const doubloonImage = `<img src="${doubloonUrl}" alt="doubloons" width="20" height="20" class="doubloon">`

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
      <img src="${item.imageUrl}" alt="${item.name}" class="shop-item-image" loading="lazy"/>
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
  const itemData = { id };
  localStorage.setItem("selectedItem", JSON.stringify(itemData));
}

function updateGoalContainer(id) {
    if (id === "None") {
      goalImage.src = ""
      goalName.innerHTML = `None (${doubloonImage})`
      doubloonsLeft.innerHTML = `Doubloons until goal: 0 ${doubloonImage}`
      timeLeft.innerHTML = 'Estimated hours left: 0'
      canBuyGoal.innerHTML = 'No (0%)'
      canBuyGoal.classList.add("red")
      canBuyGoal.classList.remove("green")
      return;
    }

    // Update the goal container
    let item = getItemById(id);
    let price = 0;
    if (item.enabledUs === true) {
        price = item.priceUs;
    } else {
        price = item.priceGlobal;
    }
    goalName.innerHTML = `${item.name} (${price} ${doubloonImage})`;

    // Calculate doubloons left until the goal
    const doubloonsNeeded = price - totalEarnings;
    doubloonsLeft.innerHTML = `Doubloons until goal: ${doubloonsNeeded > 0 ? doubloonsNeeded : 0} ${doubloonImage}`;

    // Calculate estimated time left based on current doubloons and average hourly rate
    const averageHourlyRate = totalHours > 0 ? (totalEarnings / totalHours) : 0;
    const estimatedHours = averageHourlyRate > 0 ? ((price - totalEarnings) / averageHourlyRate) : 0;
    timeLeft.innerHTML = `Estimated hours left: ${estimatedHours > 0 ? estimatedHours.toFixed(2) : 0}`;

    // Calculate if goal can be bought (if yes, how many times)
    const buyAmount = totalEarnings / price;
    const remainingToNext = price - (totalEarnings % price);
    const remainingPercentage = 100 - (remainingToNext / price) * 100;
    if (buyAmount >= 1) {
      if (remainingPercentage > 0 && remainingPercentage !== 100) {
        canBuyGoal.textContent = `${buyAmount.toFixed(0)} (+${remainingPercentage.toFixed(0)}%)`;
      } else {
        canBuyGoal.textContent = `${buyAmount.toFixed(0)}`;
      }
      canBuyGoal.classList.add("green")
      canBuyGoal.classList.remove("red")
    } else {
      canBuyGoal.textContent = `No (${(buyAmount * 100).toFixed(0)}%)`;
      canBuyGoal.classList.add("red")
      canBuyGoal.classList.remove("green")
    }

    // Set the image to the item's image
    goalImage.src = item.imageUrl;
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

// Restore the shop filter
function restoreFilter() {
  const selectedFilter = localStorage.getItem("filter");
  if (selectedFilter && locations.includes(selectedFilter)) {
    locationFilter.value = selectedFilter;
  }
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
      item.availableLocations.includes(selectedLocation)
    );
  }

  renderShop(filteredData);
}

// Add project to the list
function addProjectToList(name, earnings, hours, blessed) {
  const hourlyRate = (earnings / hours).toFixed(2);
  const unblessedRate = ((earnings - earnings / 1.2) / hours).toFixed(2);

  const projectItem = document.createElement("li");

  const projectInfo = document.createElement("div");
  projectInfo.classList.add("project-info");
  projectInfo.innerHTML = `
      <strong class="projectNameInfo">${(blessed && !name.includes('🏴‍☠️ ')) ? '🏴‍☠️ ' : ''}${name}</strong>
      <span>Earnings: ${earnings} ${doubloonImage}${blessed ? ` (+${(earnings - earnings / 1.2).toFixed(0)})` : ''}</span>
      <span>Hours: ${hours}</span>
      <span>Doubloons/Hour: ${hourlyRate} ${blessed ? ` (+${unblessedRate})` : ''}</span>
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
    projectNameInput.value = project.querySelector('.projectNameInfo').textContent;
    projectEarningsInput.value = project.querySelector('span:nth-child(2)').textContent.split(' ')[1];
    projectHoursInput.value = project.querySelector('span:nth-child(3)').textContent.split(' ')[1];
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
    projectButtonContainer.getElementsByClassName("project-edit-btn")[0].textContent = "Edit";
    submitButton.textContent = "Add Project";
  });

  // Append buttons to the project item
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("project-button-container");
  buttonContainer.appendChild(editButton);
  buttonContainer.appendChild(removeButton);
  projectItem.appendChild(projectInfo);
  projectItem.appendChild(buttonContainer);
  projectsList.appendChild(projectItem);
  projectItem.classList.toggle("blessedProject", !!blessed);
}

// Calculate total hours
function calculateTotalHours() {
  totalHours = [...projectsList.children].reduce((sum, item) => {
    const hours = parseFloat(item.querySelector("span:nth-child(3)").textContent.match(/([\d.]+)/)[0]);
    return sum + (isNaN(hours) ? 0 : hours);
  }, 0);
}

// Calculate total earnings
function calculateTotalEarnings() {
  totalEarnings = [...projectsList.children].reduce((sum, item) => {
    const earnings = parseFloat(item.querySelector("span").textContent.match(/([\d.]+)/)[0]);
    return sum + (isNaN(earnings) ? 0 : earnings);
  }, 0);
}

// Update totals display
function updateTotals() {
  calculateTotalEarnings(); // Calculate total earnings
  calculateTotalHours(); // Calculate total hours
  const averageHourlyRate = totalHours > 0 ? (totalEarnings / totalHours).toFixed(2) : 0;

  // Calculate blessed earnings and blessed hours
  const blessedProjects = [...projectsList.children].filter(item => item.classList.contains("blessedProject"));
  const blessedEarnings = blessedProjects.reduce((sum, item) => {
    const earnings = parseFloat(item.querySelector("span").textContent.match(/([\d.]+)/)[0]);
    return sum + (earnings - earnings / 1.2);
  }, 0);

  const blessedAverageHours = (blessedEarnings / totalHours).toFixed(2)

  totalEarningsDisplay.innerHTML = `Total Earnings: ${totalEarnings} ${doubloonImage}${blessedEarnings > 0 ? ` (+${blessedEarnings.toFixed(0)})` : ''}`;
  totalHoursDisplay.innerHTML = `Total Hours: ${totalHours.toFixed(2)}`;
  averageHourlyRateDisplay.innerHTML = `Hourly Rate: ${averageHourlyRate} ${doubloonImage}/hour${blessedAverageHours > 0 ? ` (+${blessedAverageHours})` : ''}`;
}

// Save projects and totals to localStorage
function saveProjectsToLocalStorage() {
  const projectItems = [...projectsList.children].map((item) => {
      const projectInfo = item.querySelector(".project-info");
      const name = projectInfo.querySelector("strong").textContent.replace('🏴‍☠️ ', '');
      const blessed = !!(item.classList.contains("blessedProject"));
      const [earnings, hours] = [...projectInfo.querySelectorAll("span")]
          .map(span => parseFloat(span.textContent.match(/([\d.]+)/)[0]));

      return { name, earnings, hours, blessed };
  });

  localStorage.setItem("projects", JSON.stringify(projectItems));
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
  savedProjects.forEach((project) => addProjectToList(project.name, project.earnings, project.hours, project.blessed));

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
  const blessed = !!isBlessed.checked;

  if (projectName && !isNaN(projectEarnings) && !isNaN(projectHours)) {
      // Check if editing an existing project
      const editingItem = [...projectsList.children].find(item => item.dataset.editing);
      if (editingItem) {
          // Update the existing project
          editingItem.querySelector(".projectNameInfo").textContent = (blessed && !projectName.includes('🏴‍☠️ ')) ? '🏴‍☠️ ' + projectName : projectName;
          const spans = editingItem.querySelectorAll("span");
          spans[0].innerHTML = `Earnings: ${projectEarnings} ${doubloonImage}${blessed ? ` (+${(projectEarnings - projectEarnings / 1.2).toFixed(0)})` : ''}`;
          spans[1].textContent = `Hours: ${projectHours}`;
          spans[2].textContent = `Doubloons/Hour: ${(projectEarnings / projectHours).toFixed(2)} ${blessed ? ` (+${((projectEarnings - projectEarnings / 1.2) / projectHours).toFixed(2)})` : ''}`;

          // Update blessed state
          editingItem.classList.toggle("blessedProject", blessed);

          // Set the exit button back to "Edit"
          editingItem.getElementsByClassName("project-edit-btn")[0].textContent = "Edit"

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

importButton.addEventListener("click", (e) => {
  e.preventDefault();

  const b64String = prompt("Paste text here:")

  const binaryString = atob(b64String);
  const decodedData = new Uint8Array(
    binaryString.split("").map(char => char.charCodeAt(0))
  );
  const textDecoder = new TextDecoder();
  const jsonString = textDecoder.decode(decodedData);

  const importedData = JSON.parse(jsonString);

  const filterTemp = importedData.filter;
  const projectsTemp = importedData.projects;
  const selectedItemTemp = importedData.selectedItem;

  if (filterTemp && projectsTemp && selectedItemTemp) {
    locationFilter.value = filterTemp;
    selectedItemId = selectedItemTemp;

    // Load the projects from the imported data
    projectsList.innerHTML = "";
    projectsTemp.forEach(project => {
      addProjectToList(project.name, project.earnings, project.hours, project.blessed);
    });

    // Restore selection after shop data is loaded
    restoreSelection();
    filterShop();

    updateTotals();
    saveProjectsToLocalStorage();
    if (selectedItemId) {
      handleSelection(selectedItemId);
    }
  } else {
    alert("Invalid data, could not import!");
  }
});

exportButton.addEventListener("click", (e) => {
  e.preventDefault();

  const projects = [...projectsList.children].map((item) => {
    const projectInfo = item.querySelector(".project-info");
    const name = projectInfo.querySelector("strong").textContent.replace('🏴‍☠️ ', '');
    const blessed = !!(item.classList.contains("blessedProject"));
    const [earnings, hours] = [...projectInfo.querySelectorAll("span")]
        .map(span => parseFloat(span.textContent.match(/([\d.]+)/)[0]));

    return { name, earnings, hours, blessed };
  });

  const jsonString = JSON.stringify({filter: locationFilter.value, projects, selectedItem: selectedItemId});
  const encodedData = textEncoder.encode(jsonString);
  const binaryString = Array.from(encodedData)
    .map(byte => String.fromCharCode(byte))
    .join("");
  const b64String = btoa(binaryString);
  navigator.clipboard.writeText(b64String);

  alert("Data copied to clipboard!");
})

