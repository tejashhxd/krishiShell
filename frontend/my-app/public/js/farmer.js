const REALTIME_MANDI_RATES = {
  Tomato: 32,
  Potato: 22,
  Onion: 48,
  Wheat: 28,
  Mustard: 85
};

function showFormMessage(message) {
  const messageElement = document.getElementById("formMessage");
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.classList.add("visible");
  }
}

async function loadCropOptions() {
  const cropSelect = document.getElementById("cropName");
  if (!cropSelect) return;

  try {
    const crops = await window.fetchCrops();
    cropSelect.innerHTML = crops.map((crop) =>
      `<option value="${crop.id}" data-crop-name="${crop.name}">${crop.name}</option>`
    ).join("");
    updateMandiRateBadge();
  } catch (error) {
    cropSelect.innerHTML = '<option value="">Unable to load crops</option>';
    showFormMessage(error.message);
  }
}

function updateMandiRateBadge() {
  const cropSelect = document.getElementById("cropName");
  const priceDisplay = document.getElementById("liveMandiPrice");
  if (!cropSelect || !priceDisplay) return;

  const cropName = cropSelect.selectedOptions[0]?.dataset.cropName;
  const rate = REALTIME_MANDI_RATES[cropName] || 25;
  priceDisplay.innerText = `₹${rate} / kg`;
}

function loadFarmerCrops() {
  const tableBody = document.getElementById("cropTableBody");
  if (!tableBody) return;

  const userCrops = JSON.parse(localStorage.getItem("krishi_farmer_crops")) || [];
  
  const buyerReqs = JSON.parse(localStorage.getItem("krishi_buyer_reqs")) || [];

  const countElem = document.getElementById("statCropCount");
  const demandElem = document.getElementById("statDemandCount");
  const avgRateElem = document.getElementById("statAvgRate");

  if (countElem) countElem.innerText = `${userCrops.length} Items`;

  let matchedBuyerCount = 0;
  userCrops.forEach((c) => {
    matchedBuyerCount += buyerReqs.filter((b) => b.crop.toLowerCase() === c.name.toLowerCase()).length;
  });
  if (demandElem) demandElem.innerText = `${matchedBuyerCount} Buyers`;

  if (avgRateElem) {
    if (userCrops.length === 0) {
      avgRateElem.innerText = "₹0 / kg";
    } else {
      let totalPrice = 0;
      userCrops.forEach((item) => {
        totalPrice += (REALTIME_MANDI_RATES[item.name] || 25);
      });
      const dynamicAvg = (totalPrice / userCrops.length).toFixed(1);
      avgRateElem.innerText = `₹${dynamicAvg} / kg`;
    }
  }

  tableBody.innerHTML = "";
  if (userCrops.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #888;">No produce listed yet. Click "+ Add New Produce" above.</td></tr>`;
    return;
  }

  userCrops.forEach((item, index) => {
    tableBody.innerHTML += `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>${item.quantity} kg</td>
        <td>${item.location}</td>
        <td>${item.date}</td>
        <td>
          <div class="table-actions">
            <a href="results.html?crop=${encodeURIComponent(item.name)}&qty=${item.quantity}" class="btn btn-outline btn-sm">
              View Matches
            </a>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteFarmerCrop(${index})">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

function deleteFarmerCrop(index) {
  const userCrops = JSON.parse(localStorage.getItem("krishi_farmer_crops")) || [];
  if (!Number.isInteger(index) || index < 0 || index >= userCrops.length) return;

  userCrops.splice(index, 1);
  localStorage.setItem("krishi_farmer_crops", JSON.stringify(userCrops));
  loadFarmerCrops();
}

async function handleAddCrop(event) {
  event.preventDefault();

  const cropSelect = document.getElementById("cropName");
  const cropId = Number(cropSelect.value);
  const name = cropSelect.selectedOptions[0]?.dataset.cropName;
  const quantity = Number(document.getElementById("cropQty").value);
  const location = document.getElementById("cropLocation").value.trim();
  const date = document.getElementById("cropDate").value;
  const submitButton = event.target.querySelector("button[type='submit']");

  const newListing = { name, quantity, location, date };

  if (!Number.isFinite(quantity) || quantity <= 0) {
    showFormMessage("Please enter a valid quantity.");
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Finding Suitable Markets...";
  }

  try {
    if (!Number.isInteger(cropId) || cropId <= 0) {
      throw new Error("Please select a valid crop.");
    }

    const coordinates = await window.geocodeFarmerLocation(location);
    const recommendation = await window.analyzeFarmerCrop({
      crop_id: cropId,
      quantity_kg: quantity,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    });

    const currentList = JSON.parse(localStorage.getItem("krishi_farmer_crops")) || [];
    currentList.unshift(newListing);
    localStorage.setItem("krishi_farmer_crops", JSON.stringify(currentList));
    sessionStorage.setItem("krishi_last_recommendation", JSON.stringify({
      listing: newListing,
      result: recommendation
    }));

    window.location.href = `results.html?crop=${encodeURIComponent(name)}&qty=${quantity}`;
  } catch (error) {
    showFormMessage(error.message);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Find Best Matching Buyers";
    }
  }
}