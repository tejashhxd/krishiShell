async function loadMatchResults() {
  const container = document.getElementById("resultsList");
  if (!container) return;

  const storedRecommendation = sessionStorage.getItem("krishi_last_recommendation");
  if (!storedRecommendation) {
    container.innerHTML = `
      <div class="card-box text-center" style="grid-column: 1 / -1;">
        <h3 class="text-primary">No market analysis found</h3>
        <p class="text-muted">Add a crop first to compare suitable markets.</p>
      </div>
    `;
    return;
  }

  const analysis = JSON.parse(storedRecommendation);
  const selectedCrop = analysis.result.crop;
  const recommendation = analysis.result.recommendation;
  const alternatives = analysis.result.alternatives || [];
  const quantity = analysis.result.quantity_kg;

  document.getElementById("cropTitle").innerText = `Market Matches for: ${selectedCrop}`;

  if (!recommendation) {
    container.innerHTML = `
      <div class="card-box text-center" style="grid-column: 1 / -1;">
        <h3 class="text-primary">No Profitable Markets Found</h3>
        <p class="text-muted">${analysis.result.explanation}</p>
      </div>
    `;
    return;
  }

  const renderMarketCard = (market, isRecommended) => `
    <div class="result-card${isRecommended ? " recommended-card" : ""}">
      ${isRecommended ? '<p class="market-badge">Recommended Market</p>' : "<h3>Alternative Market</h3>"}
      <h3>${market.market_name}</h3>
      <p class="buyer-price">₹${market.price_per_kg.toFixed(2)} / kg</p>
      <div class="detail-row"><span>Distance:</span><strong>${market.distance_km} km</strong></div>
      <div class="detail-row"><span>Mandi modal price:</span><strong>₹${market.modal_price_per_quintal} / quintal</strong></div>
      <div class="detail-row"><span>Transport cost:</span><strong class="fare-deduct">₹${market.transport_cost_per_kg.toFixed(2)} / kg</strong></div>
      <div class="detail-row"><span>Net price:</span><strong>₹${market.net_price_per_kg.toFixed(2)} / kg</strong></div>
      <div class="detail-row profit-row"><span>Estimated realisation (${quantity}kg):</span><strong class="profit-val">₹${market.estimated_net_realisation.toFixed(2)}</strong></div>
    </div>
  `;

  container.innerHTML = renderMarketCard(recommendation, true);
  alternatives.forEach((market) => {
    container.innerHTML += renderMarketCard(market, false);
  });
}