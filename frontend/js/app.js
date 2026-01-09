// REGISTER
async function registerUser() {
  const res = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: rname.value,
      email: remail.value,
      password: rpassword.value
    })
  });

  const data = await res.json();
  alert(data.message);
  window.location.href = "login.html";
}

// LOGIN
async function loginUser() {
  const res = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: lemail.value,
      password: lpassword.value
    })
  });

  const data = await res.json();
  localStorage.setItem("token", data.token);

  if (data.role === "admin") {
    window.location.href = "admin-dashboard.html";
  } else {
    window.location.href = "user-dashboard.html";
  }
}

// DONATE
async function donateMoney() {
  const res = await fetch("http://localhost:5000/api/donation/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": localStorage.getItem("token")
    },
    body: JSON.stringify({
      amount: amount.value
    })
  });

  const data = await res.json();
  alert(data.message);
}

// LOGOUT
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
// LOAD DONATION HISTORY
async function loadDonationHistory() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  const res = await fetch("http://localhost:5000/api/donation/my-donations", {
    headers: {
      "Authorization": token
    }
  });

  const donations = await res.json();
  const container = document.getElementById("historyContainer");

  container.innerHTML = "";

  if (donations.length === 0) {
    container.innerHTML = "<p>No donations found.</p>";
    return;
  }

  donations.forEach(d => {
    const card = document.createElement("div");
    card.className = "card center";

    card.innerHTML = `
      <h3>₹ ${d.amount}</h3>
      <p>Status: <b>${d.status}</b></p>
      <p style="color: var(--muted); font-size: 14px;">
        ${new Date(d.timestamp).toLocaleString()}
      </p>
    `;

    container.appendChild(card);
  });
}
async function loadAdminStats() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await fetch("http://localhost:5000/api/admin/stats", {
    headers: {
      "Authorization": token
    }
  });

  const data = await res.json();

  document.getElementById("totalUsers").innerText = data.totalUsers;
  document.getElementById("totalDonations").innerText = data.totalDonations;
  document.getElementById("totalAmount").innerText = "₹ " + data.totalAmount;
}
// ADMIN - LOAD USERS
async function loadAdminUsers() {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/admin/users", {
    headers: { Authorization: token }
  });

  const users = await res.json();
  const container = document.getElementById("adminUsers");
  container.innerHTML = "";

  users.forEach(u => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <p><b>Name:</b> ${u.name}</p>
      <p><b>Email:</b> ${u.email}</p>
      <p><b>Role:</b> ${u.role}</p>
    `;
    container.appendChild(div);
  });
}

// ADMIN - LOAD DONATIONS
async function loadAdminDonations() {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/admin/donations", {
    headers: { Authorization: token }
  });

  const donations = await res.json();
  const container = document.getElementById("adminDonations");
  container.innerHTML = "";

  donations.forEach(d => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <p><b>User ID:</b> ${d.userId}</p>
      <p><b>Amount:</b> ₹${d.amount}</p>
      <p><b>Status:</b> ${d.status}</p>
      <p style="color:var(--muted); font-size:14px;">
        ${new Date(d.timestamp).toLocaleString()}
      </p>
    `;
    container.appendChild(div);
  });
}

// ADMIN REPORTS (DETAILED)
async function loadAdminReports() {
  const token = localStorage.getItem("token");

  // Get stats
  const statsRes = await fetch("http://localhost:5000/api/admin/stats", {
    headers: { Authorization: token }
  });
  const stats = await statsRes.json();

  // Get all donations
  const donationsRes = await fetch("http://localhost:5000/api/admin/donations", {
    headers: { Authorization: token }
  });
  const donations = await donationsRes.json();

  let successAmount = 0;
  let pendingAmount = 0;
  let failedAmount = 0;

  donations.forEach(d => {
    if (d.status === "success") {
      successAmount += Number(d.amount);
    } else if (d.status === "pending") {
      pendingAmount += Number(d.amount);
    } else if (d.status === "failed") {
      failedAmount += Number(d.amount);
    }
  });

  document.getElementById("rUsers").innerText = stats.totalUsers;
  document.getElementById("rDonations").innerText = stats.totalDonations;
  document.getElementById("rAmount").innerText = stats.totalAmount;

  document.getElementById("rSuccess").innerText = successAmount;
  document.getElementById("rPending").innerText = pendingAmount;
  document.getElementById("rFailed").innerText = failedAmount;

  document.getElementById("rTime").innerText =
    new Date().toLocaleString();
}

// ADMIN CHARTS
async function loadAdminCharts() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await fetch("http://localhost:5000/api/admin/donations", {
    headers: { Authorization: token }
  });

  const donations = await res.json();

  let successCount = 0;
  let pendingCount = 0;
  let failedCount = 0;

  let successAmount = 0;
  let pendingAmount = 0;
  let failedAmount = 0;

  donations.forEach(d => {
    if (d.status === "success") {
      successCount++;
      successAmount += Number(d.amount);
    } else if (d.status === "pending") {
      pendingCount++;
      pendingAmount += Number(d.amount);
    } else if (d.status === "failed") {
      failedCount++;
      failedAmount += Number(d.amount);
    }
  });

  // Pie Chart - Status Distribution
  new Chart(document.getElementById("statusChart"), {
    type: "pie",
    data: {
      labels: ["Success", "Pending", "Failed"],
      datasets: [{
        data: [successCount, pendingCount, failedCount]
      }]
    }
  });

  // Bar Chart - Amount by Status
  new Chart(document.getElementById("amountChart"), {
    type: "bar",
    data: {
      labels: ["Success", "Pending", "Failed"],
      datasets: [{
        label: "Amount (₹)",
        data: [successAmount, pendingAmount, failedAmount]
      }]
    }
  });
}
