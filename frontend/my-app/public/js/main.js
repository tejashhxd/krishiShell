async function loadMatchResults() {
  const container = document.getElementById("resultsList");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const selectedCrop = params.get("crop") || "Wheat";
  const quantity = Number(params.get("qty")) || 100;

  document.getElementById("cropTitle").innerText = `Market Matches for: ${selectedCrop}`;

  // Sirf tab matching hogi jab kisi buyer ne requirement post ki ho
  const allBuyerReqs = JSON.parse(localStorage.getItem("krishi_buyer_reqs")) || [];
  const matches = allBuyerReqs.filter(b => b.crop.toLowerCase() === selectedCrop.toLowerCase());

  // Agar koi match nahi mila toh clean message
  if (matches.length === 0) {
    container.innerHTML = `
      <div class="card-box text-center" style="grid-column: 1 / -1; padding: 40px 20px;">
        <h3 style="color: var(--text-muted); margin-bottom: 10px;">No Matching Buyers Found</h3>
        <p class="text-muted" style="font-size: 14px; max-width: 520px; margin: 0 auto;">
          Currently, no buyer has posted a requirement for <strong>${selectedCrop}</strong>. 
          As soon as a buyer submits a requirement matching your produce, their offer will appear here.
        </p>
      </div>
    `;
    return;
  }

  // Real buyer milne par card render hoga
  container.innerHTML = "";
  matches.forEach((buyer) => {
    const price = buyer.price || 0;
    const location = buyer.location || "Maharashtra Hub";
    const totalAmount = price * quantity;

    container.innerHTML += `
      <div class="result-card">
        <h3>Buyer Requirement</h3>
        <p class="buyer-price">₹${price} / kg</p>
        
        <div class="detail-row">
          <span>Required Crop:</span>
          <strong>${buyer.crop}</strong>
        </div>
        <div class="detail-row">
          <span>Needed Quantity:</span>
          <strong>${buyer.quantity} kg</strong>
        </div>
        <div class="detail-row">
          <span>Delivery Hub:</span>
          <strong>${location}</strong>
        </div>
        <div class="detail-row profit-row">
          <span>Total Offer Value (${quantity}kg):</span>
          <strong class="profit-val">₹${totalAmount}</strong>
        </div>

        <button class="btn btn-primary btn-full" onclick="alert('Offer Details:\\nCrop: ${buyer.crop}\\nDelivery Location: ${location}\\nOffered Rate: ₹${price}/kg')">
          Accept & Connect
        </button>
      </div>
    `;
  });
}