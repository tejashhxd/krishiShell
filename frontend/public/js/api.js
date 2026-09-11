const API_BASE_URL = "https://krishishell.onrender.com/api";

const MAHARASHTRA_FALLBACK_RATES = {
  Tomato: 32,
  Potato: 22,
  Onion: 48,
  Wheat: 28,
  Mustard: 85
};

async function fetchMandiRates() {
  try {
    const response = await fetch(`${API_BASE_URL}/mandi-rates`);
    if (!response.ok) throw new Error("Offline");
    return await response.json();
  } catch (err) {
    return MAHARASHTRA_FALLBACK_RATES;
  }
}

async function fetchMatchingBuyers(crop) {
  try {
    const response = await fetch(`${API_BASE_URL}/buyers?crop=${encodeURIComponent(crop)}`);
    if (!response.ok) throw new Error("Offline");
    return await response.json();
  } catch (err) {
    // Sirf wahi buyers aayenge jo actual me add-requirement.html se post hue hain
    const localDemands = JSON.parse(localStorage.getItem("krishi_buyer_reqs")) || [];
    return localDemands.filter(item => item.crop.toLowerCase() === crop.toLowerCase());
  }
}

async function postCropListing(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/crops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (err) {
    let list = JSON.parse(localStorage.getItem("krishi_farmer_crops")) || [];
    list.unshift(payload);
    localStorage.setItem("krishi_farmer_crops", JSON.stringify(list));
    return { status: "local_saved" };
  }

}

async function analyzeFarmerCrop(payload) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Unable to find suitable markets.");
  }

  return result;
}

async function fetchCrops() {
  const response = await fetch(`${API_BASE_URL}/crops`);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || "Unable to load crops.");
  }
  return result.data;
}

async function geocodeFarmerLocation(location) {
  const response = await fetch(
    `${API_BASE_URL}/geocode?location=${encodeURIComponent(location)}`
  );
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || "Unable to resolve the entered location.");
  }
  return result.data;
}

async function postBuyerDemand(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/buyer-demands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (err) {
    let list = JSON.parse(localStorage.getItem("krishi_buyer_reqs")) || [];
    list.unshift(payload);
    localStorage.setItem("krishi_buyer_reqs", JSON.stringify(list));
    return { status: "local_saved" };
  }
}