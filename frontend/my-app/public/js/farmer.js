const REALTIME_MANDI_RATES = {
  Tomato: 32,
  Potato: 22,
  Onion: 48,
  Wheat: 28,
  Mustard: 85
};

function updateMandiRateBadge() {
  const cropSelect = document.getElementById("cropName");
  const priceDisplay = document.getElementById("liveMandiPrice");
  if (!cropSelect || !priceDisplay) return;

  const rate = REALTIME_MANDI_RATES[cropSelect.value] || 25;
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

  userCrops.forEach((item) => {
    tableBody.innerHTML += `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>${item.quantity} kg</td>
        <td>${item.location}</td>
        <td>${item.date}</td>
        <td>
          <a href="results.html?crop=${encodeURIComponent(item.name)}&qty=${item.quantity}" class="btn btn-outline btn-sm">
            View Matches
          </a>
        </td>
      </tr>
    `;
  });
}

function handleAddCrop(event) {
  event.preventDefault();

  const name = document.getElementById("cropName").value;
  const quantity = Number(document.getElementById("cropQty").value);
  const location = document.getElementById("cropLocation").value.trim();
  const date = document.getElementById("cropDate").value;

  const newListing = { name, quantity, location, date };
  let currentList = JSON.parse(localStorage.getItem("krishi_farmer_crops")) || [];
  currentList.unshift(newListing);
  localStorage.setItem("krishi_farmer_crops", JSON.stringify(currentList));

  window.location.href = "farmer-dashboard.html";
}