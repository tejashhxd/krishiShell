function loadBuyerReqs() {
  const tableBody = document.getElementById("reqTableBody");
  if (!tableBody) return;

  const storedReqs = JSON.parse(localStorage.getItem("krishi_buyer_reqs")) || [];
  tableBody.innerHTML = "";

  if (storedReqs.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='4' style='text-align: center; color: #888;'>No crop demands found.</td></tr>";
    return;
  }

  storedReqs.forEach((item) => {
    tableBody.innerHTML += `
      <tr>
        <td><strong>${item.crop}</strong></td>
        <td>${item.quantity} kg</td>
        <td>₹${item.price} / kg</td>
        <td>${item.location}</td>
      </tr>
    `;
  });
}

async function handleAddRequirement(event) {
  event.preventDefault();

  const crop = document.getElementById("reqCrop").value;
  const quantity = Number(document.getElementById("reqQty").value);
  const price = Number(document.getElementById("reqPrice").value);
  const location = document.getElementById("reqLocation").value.trim();

  const newDemand = { crop, quantity, price, location };
  await postBuyerDemand(newDemand);

  window.location.href = "buyer-dashboard.html";
}