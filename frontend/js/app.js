// MASTER API CONFIGURATION
// Switch this comment if you are testing locally
const API_BASE = "https://ngo-donation-backend.onrender.com";
// const API_BASE = "http://localhost:5000";


// CUSTOM TOAST NOTIFICATION
function showToast(message) {
    const toast = document.getElementById("toast-box");
    
    // Safety check: If you forgot to add the HTML div in Step 2, fallback to alert
    if (!toast) {
        console.warn("Toast HTML missing, falling back to alert.");
        return alert(message); 
    }

    toast.innerText = message;
    toast.className = "show"; // This triggers the CSS animation

    // Disappear after 3 seconds
    setTimeout(function(){ 
        toast.className = toast.className.replace("show", ""); 
    }, 3000);
}

// ==========================================
// 🛡️ SECURITY & AUTHENTICATION
// ==========================================

// THE BOUNCER: Checks if user is allowed to be here
function checkAdminAccess() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // 1. If not logged in -> Go to Login
  if (!token) {
    window.location.replace("login.html"); // 'replace' prevents back-button loop
    return false;
  }

  // 2. If logged in but NOT admin -> Kick to Home
  if (role !== "admin") {
    showToast("⛔ Access Denied: Administrators Only.");
    window.location.replace("index.html");
    return false;
  }
  return true;
}

// LOGOUT
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.replace("login.html");
}

// ==========================================
// 👤 USER FUNCTIONS (Auth & Dashboard)
// ==========================================

// REGISTER
async function registerUser() {
  try {
    const res = await fetch(API_BASE + "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: rname.value,
        email: remail.value,
        password: rpassword.value
      })
    });

    const data = await res.json();
    showToast(data.message);
    if (res.ok) window.location.href = "login.html";
  } catch (err) {
    showToast("Connection Error. Please try again.");
  }
}

// LOGIN
async function loginUser() {
  try {
    const res = await fetch(API_BASE + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: lemail.value,
        password: lpassword.value
      })
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      // Redirect based on Role
      if (data.role === "admin") {
        window.location.replace("admin-dashboard.html");
      } else {
        window.location.replace("user-dashboard.html");
      }
    } else {
      showToast(data.message);
    }
  } catch (err) {
    showToast("Login failed. Check your internet connection.");
  }
}

// DONATE
async function donateMoney() {
  const inputVal = Number(amount.value); // Convert string to number

  // 1. VALIDATION CHECK (New)
  if (!inputVal || inputVal <= 0) {
    return showToast("Please enter a valid positive amount (e.g. 500).");
  }

  try {
    const res = await fetch(API_BASE + "/api/donation/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": localStorage.getItem("token")
      },
      body: JSON.stringify({ amount: inputVal }) // Use the validated number
    });

    const data = await res.json();
    showToast(data.message);
    
    // Optional: Reload to show new status
    // location.reload(); 

  } catch (err) {
    console.error(err);
    showToast("Donation request failed. Check your connection.");
  }
}

// LOAD USER HISTORY
async function loadDonationHistory() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.replace("login.html");
    return;
  }

  const res = await fetch(API_BASE + "/api/donation/my-donations", {
    headers: { "Authorization": token }
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
    card.className = "card"; // CSS handles the layout now

    // Format Money (e.g., 10,000)
    const formattedAmount = Number(d.amount).toLocaleString('en-IN');

    card.innerHTML = `
      <h3>₹ ${formattedAmount}</h3>
      <p>Status: <b>${d.status}</b></p>
      <p style="color: var(--muted); font-size: 14px;">
        ${new Date(d.timestamp).toLocaleString()}
      </p>
    `;
    container.appendChild(card);
  });
}

// ==========================================
// 🛡️ ADMIN DASHBOARD FUNCTIONS
// ==========================================

// ADMIN - LOAD STATS
async function loadAdminStats() {
  if (!checkAdminAccess()) return;

  const token = localStorage.getItem("token");
  const res = await fetch(API_BASE + "/api/admin/stats", {
    headers: { "Authorization": token }
  });

  const data = await res.json();

  document.getElementById("totalUsers").innerText = data.totalUsers;
  document.getElementById("totalDonations").innerText = data.totalDonations;
  // Professional Money Format
  document.getElementById("totalAmount").innerText = "₹ " + data.totalAmount.toLocaleString('en-IN');
}

// ADMIN - LOAD USERS
async function loadAdminUsers() {
  if (!checkAdminAccess()) return;

  const token = localStorage.getItem("token");
  const res = await fetch(API_BASE + "/api/admin/users", {
    headers: { Authorization: token }
  });

  const users = await res.json();
  const container = document.getElementById("adminUsers");
  container.innerHTML = "";

  users.forEach(u => {
    const div = document.createElement("div");
    div.className = "card";
    // Check if admin to add special badge logic if needed
    if (u.role === 'admin') div.innerHTML += `<span style="display:none">admin</span>`;

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
  if (!checkAdminAccess()) return;

  const token = localStorage.getItem("token");
  const res = await fetch(API_BASE + "/api/admin/donations", {
    headers: { Authorization: token }
  });

  const donations = await res.json();
  const container = document.getElementById("adminDonations");
  container.innerHTML = "";

  donations.forEach(d => {
    const div = document.createElement("div");
    div.className = "card";

    const formattedAmount = Number(d.amount).toLocaleString('en-IN');

    div.innerHTML = `
      <p><b>User ID:</b> ${d.userId}</p>
      <p><b>Amount:</b> ₹${formattedAmount}</p>
      <p><b>Status:</b> ${d.status}</p>
      <p style="color:var(--muted); font-size:14px;">
        ${new Date(d.timestamp).toLocaleString()}
      </p>
    `;
    container.appendChild(div);
  });
}

// ADMIN - REPORTS
async function loadAdminReports() {
  if (!checkAdminAccess()) return;

  const token = localStorage.getItem("token");

  // Parallel Fetch for speed
  const [statsRes, donationsRes] = await Promise.all([
    fetch(API_BASE + "/api/admin/stats", { headers: { Authorization: token } }),
    fetch(API_BASE + "/api/admin/donations", { headers: { Authorization: token } })
  ]);

  const stats = await statsRes.json();
  const donations = await donationsRes.json();

  let success = 0, pending = 0, failed = 0;

  donations.forEach(d => {
    const amt = Number(d.amount);
    if (d.status === "success") success += amt;
    else if (d.status === "pending") pending += amt;
    else if (d.status === "failed") failed += amt;
  });

  // Fill UI
  document.getElementById("rUsers").innerText = stats.totalUsers;
  document.getElementById("rDonations").innerText = stats.totalDonations;
  document.getElementById("rAmount").innerText = stats.totalAmount.toLocaleString('en-IN');

  document.getElementById("rSuccess").innerText = success.toLocaleString('en-IN');
  document.getElementById("rPending").innerText = pending.toLocaleString('en-IN');
  document.getElementById("rFailed").innerText = failed.toLocaleString('en-IN');

  document.getElementById("rTime").innerText = new Date().toLocaleString();
}

// ADMIN - CHARTS (With Earth Theme Colors)
async function loadAdminCharts() {
  if (!checkAdminAccess()) return;
  const token = localStorage.getItem("token");

  const res = await fetch(API_BASE + "/api/admin/donations", {
    headers: { Authorization: token }
  });
  const donations = await res.json();

  let sCount = 0, pCount = 0, fCount = 0;
  let sAmt = 0, pAmt = 0, fAmt = 0;

  donations.forEach(d => {
    const amt = Number(d.amount);
    if (d.status === "success") { sCount++; sAmt += amt; }
    else if (d.status === "pending") { pCount++; pAmt += amt; }
    else if (d.status === "failed") { fCount++; fAmt += amt; }
  });

  // Theme Colors: Green, Orange, Red
  const chartColors = ['#10b981', '#f59e0b', '#ef4444'];

  // 1. PIE CHART
  new Chart(document.getElementById("statusChart"), {
    type: "pie",
    data: {
      labels: ["Success", "Pending", "Failed"],
      datasets: [{
        data: [sCount, pCount, fCount],
        backgroundColor: chartColors
      }]
    }
  });

  // 2. BAR CHART
  new Chart(document.getElementById("amountChart"), {
    type: "bar",
    data: {
      labels: ["Success", "Pending", "Failed"],
      datasets: [{
        label: "Funds (₹)",
        data: [sAmt, pAmt, fAmt],
        backgroundColor: chartColors
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
// ==========================================
// 📥 DATA EXPORT FUNCTION
// ==========================================

async function exportUsersToCSV() {
    // 1. Check Admin Access
    if (!checkAdminAccess()) return;

    try {
        const token = localStorage.getItem("token");
        
        // 2. Fetch the latest user list
        const res = await fetch(API_BASE + "/api/admin/users", {
            headers: { Authorization: token }
        });
        
        const users = await res.json();

        if (!users || users.length === 0) {
            return showToast("No users to export.");
        }

        // 3. Define CSV Headers
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "User ID,Name,Email,Role,Joined Date\n"; // Header Row

        // 4. Loop through users and format rows
        users.forEach(u => {
            const row = [
                u._id,
                u.name, 
                u.email, 
                u.role, 
                new Date(u.createdAt).toLocaleDateString() // Clean Date format
            ].join(","); // Join columns with commas
            csvContent += row + "\n"; // Add new line
        });

        // 5. Create a Download Link & Click it
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ngo_users_export.csv");
        document.body.appendChild(link);
        
        link.click(); // Auto-click
        document.body.removeChild(link); // Clean up

    } catch (err) {
        console.error(err);
        showToast("Failed to export data.");
    }
}