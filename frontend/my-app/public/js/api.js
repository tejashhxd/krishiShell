const API_BASE_URL = "http://127.0.0.1:5000/api";

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