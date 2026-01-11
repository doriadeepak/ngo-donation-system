// MASTER API CONFIGURATION
// const API_BASE = "https://ngo-donation-backend.onrender.com";
const API_BASE = "http://localhost:5000"; 

// --- UTILS ---
// CUSTOM TOAST NOTIFICATION
function showToast(message) {
    const toast = document.getElementById("toast-box");
    // Backup for pages without the toast container
    if (!toast) return alert(message); 

    toast.innerText = message;
    toast.className = "show"; 
    setTimeout(function(){ 
        toast.className = toast.className.replace("show", ""); 
    }, 3000);
}

// REGISTER
async function registerUser() {
  const name = document.getElementById("rname").value;
  const email = document.getElementById("remail").value;
  const password = document.getElementById("rpassword").value;

  if(!name || !email || !password) return showToast("All fields are required");

  try {
    const res = await fetch(API_BASE + "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if(res.ok) {
      showToast("Registration Successful! Please Login.");
      setTimeout(() => window.location.href = "login.html", 1500);
    } else {
      showToast(data.message);
    }
  } catch(err) {
    console.error(err);
    showToast("Registration failed");
  }
}

// LOGIN
async function loginUser() {
  const email = document.getElementById("lemail").value;
  const password = document.getElementById("lpassword").value;

  if(!email || !password) return showToast("All fields are required");

  try {
    const res = await fetch(API_BASE + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();

    // Defensive Check: Ensure res is ok AND data.user exists
    if(res.ok && data.user) { 
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("name", data.user.name);
      
      showToast("Login Successful!");
      
      setTimeout(() => {
          // Redirecting based on verified role
          if(data.user.role === 'admin') window.location.href = "admin-dashboard.html";
          else window.location.href = "user-dashboard.html";
      }, 1000);
    } else {
      // If backend sends an error message, show it
      showToast(data.message || "Invalid email or password");
    }
  } catch(err) {
    console.error("Login Error:", err);
    showToast("Server error. Please try again later.");
  }
}

// LOGOUT
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ============================================
//  MOCK PAYMENT LOGIC (Simulated Gateway)
// ============================================

let currentDonationId = null; 

// 1. OPEN THE MODAL
async function donateMoney() {
    const amountInput = document.getElementById("amount");
    const inputVal = Number(amountInput.value);
    
    if (!inputVal || inputVal <= 0) {
        return showToast("Please enter a valid positive amount.");
    }

    try {
        // Create the PENDING order first
        const res = await fetch(API_BASE + "/api/donation/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token")
            },
            body: JSON.stringify({ amount: inputVal })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        // Store ID and Amount for the modal
        currentDonationId = data.donation._id;
        document.getElementById("pay-display").innerText = "₹" + inputVal;

        // Show the Mock UI
        document.getElementById("payment-modal").style.display = "flex";

    } catch (err) {
        console.error(err);
        showToast("Error: " + err.message);
    }
}

// 2. PROCESS THE "FAKE" PAYMENT
async function processMockPayment() {
    const btn = document.getElementById("pay-btn");
    const originalText = btn.innerText;
    
    btn.innerText = "Processing...";
    btn.disabled = true; // Prevent double clicks

    // Fake 2-second delay
    setTimeout(async () => {
        try {
            // Call the Mock Backdoor we made earlier
            const verifyRes = await fetch(API_BASE + "/api/donation/verify-mock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ donationId: currentDonationId })
            });

            if (verifyRes.ok) {
                closeModal();
                showToast("✅ Payment Successful! Thank you.");
                document.getElementById("amount").value = ""; // Clear input
                
                // Reload to show update
                setTimeout(() => location.reload(), 2000);
            } else {
                showToast("Payment Verification Failed");
                btn.innerText = originalText;
                btn.disabled = false;
            }
        } catch (err) {
            console.error(err);
            showToast("Network Error");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }, 2000);
}

// 3. CLOSE MODAL HELPER
function closeModal() {
    document.getElementById("payment-modal").style.display = "none";
    const btn = document.getElementById("pay-btn");
    if(btn) {
        btn.innerText = "Pay Now";
        btn.disabled = false;
    }
}

// ============================================
//  DASHBOARD LOADERS
// ============================================

// LOAD DONATION HISTORY (User)
async function loadDonationHistory() {
    const container = document.getElementById("historyContainer");
    try {
        const res = await fetch(API_BASE + "/api/donation/my-donations", { 
            headers: { "Authorization": localStorage.getItem("token") }
        });
        const data = await res.json();
        
        if (!data || data.length === 0) {
            container.innerHTML = "<p>No donations found.</p>";
            return;
        }

        container.innerHTML = data.map(d => `
            <div class="card">
                <h3>₹${d.amount}</h3>
                <p>Status: <b>${d.status || 'success'}</b></p>
                <p>Date: ${new Date(d.createdAt).toLocaleDateString()}</p>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = "<p>Error loading history.</p>";
    }
}

// ADMIN: LOAD STATS
async function loadAdminStats() {
    try {
        const res = await fetch(API_BASE + "/api/admin/stats", {
            headers: { "Authorization": localStorage.getItem("token") }
        });
        const data = await res.json();
        
        if(res.ok) {
            // Updating the <h3> tags in your admin-dashboard.html
            document.getElementById("totalUsers").innerText = data.totalUsers || 0;
            document.getElementById("totalDonations").innerText = data.totalDonations || 0;
            document.getElementById("totalAmount").innerText = "₹" + (data.totalAmount || 0);
        }
    } catch(err) {
        console.error("Failed to load admin stats:", err);
    }
}

// ADMIN: LOAD CHARTS
async function loadAdminCharts() {
    try {
        const res = await fetch(API_BASE + "/api/admin/stats", {
            headers: { "Authorization": localStorage.getItem("token") }
        });
        const data = await res.json();
        if(!res.ok) return;

        // Draw Doughnut
        new Chart(document.getElementById('statusChart'), {
            type: 'doughnut',
            data: {
                labels: ['Success', 'Pending', 'Failed'],
                datasets: [{
                    data: [data.successCount, data.pendingCount, data.failedCount],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                }]
            }
        });

        // Draw Bar
        new Chart(document.getElementById('amountChart'), {
            type: 'bar',
            data: {
                labels: ['Revenue'],
                datasets: [{ label: '₹', data: [data.totalAmount], backgroundColor: '#4A6741' }]
            }
        });
    } catch(err) { console.error("Chart Error:", err); }
}

// ADMIN: LOAD USERS
async function loadAdminUsers() {
    const container = document.getElementById("adminUsers");
    try {
        const res = await fetch(API_BASE + "/api/admin/users", {
            headers: { "Authorization": localStorage.getItem("token") }
        });
        const users = await res.json();
        
        container.innerHTML = "";
        users.forEach(u => {
            const card = `
                <div class="card">
                   <p><b>Name:</b> ${u.name}</p>
                   <p><b>Email:</b> ${u.email}</p>
                   <p><b>Role:</b> ${u.role}</p>
                   <p><b>ID:</b> ${u._id}</p>
                </div>
            `;
            container.innerHTML += card;
        });
    } catch(err) {
        container.innerHTML = "<p>Failed to load users.</p>";
    }
}

// ADMIN: LOAD ALL DONATIONS
async function loadAdminDonations() {
    const container = document.getElementById("adminDonations");
    try {
        const res = await fetch(API_BASE + "/api/admin/donations", {
            headers: { "Authorization": localStorage.getItem("token") }
        });
        const donations = await res.json();
        
        container.innerHTML = "";
        donations.forEach(d => {
             const date = new Date(d.createdAt).toLocaleDateString();
             const card = `
                <div class="card">
                   <p><b>User ID:</b> ${d.user}</p>
                   <p><b>Amount:</b> ₹${d.amount}</p>
                   <p><b>Status:</b> ${d.status}</p>
                   <p>${date}</p>
                </div>
            `;
            container.innerHTML += card;
        });
    } catch(err) {
        container.innerHTML = "<p>Failed to load donations.</p>";
    }
}

// ADMIN: CSV EXPORT
function exportUsersToCSV() {
    fetch(API_BASE + "/api/admin/users", {
        headers: { "Authorization": localStorage.getItem("token") }
    })
    .then(res => res.json())
    .then(users => {
        if(!users || users.length === 0) return showToast("No data to export");
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + "ID,Name,Email,Role\n"
            + users.map(u => `${u._id},${u.name},${u.email},${u.role}`).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ngo_users.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    })
    .catch(err => showToast("Export Failed"));
}

// ADMIN: LOAD REPORT
async function loadAdminReports() {
    try {
        const res = await fetch(API_BASE + "/api/admin/stats", {
            headers: { "Authorization": localStorage.getItem("token") }
        });
        const data = await res.json();
        
        if(res.ok) {
            // Mapping data to the Audit Report IDs
            document.getElementById("rUsers").innerText = data.totalUsers || 0;
            document.getElementById("rDonations").innerText = data.totalDonations || 0;
            document.getElementById("rSuccess").innerText = data.successAmount || 0;
            document.getElementById("rPending").innerText = data.pendingAmount || 0;
            document.getElementById("rFailed").innerText = data.failedAmount || 0;
            document.getElementById("rAmount").innerText = data.totalAmount || 0;
            document.getElementById("rTime").innerText = new Date().toLocaleString();
        }
    } catch(err) {
        console.error("Report Loading Failed:", err);
    }
}

// --- ADMIN EXPORT FUNCTIONS ---

// 1. Export Donations to CSV
function exportDonationsToCSV() {
    fetch(API_BASE + "/api/admin/donations", {
        headers: { "Authorization": localStorage.getItem("token") }
    })
    .then(res => res.json())
    .then(donations => {
        if(!donations || donations.length === 0) return showToast("No donation records found.");
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + "ID,User_ID,Amount,Status,Date\n"
            + donations.map(d => `${d._id},${d.user},${d.amount},${d.status},${new Date(d.createdAt).toLocaleDateString()}`).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Global_Ledger_Export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    })
    .catch(err => showToast("Export Error"));
}

// 2. Ensure loadAdminReports is mapping correctly
async function loadAdminReports() {
    try {
        const res = await fetch(API_BASE + "/api/admin/stats", {
            headers: { "Authorization": localStorage.getItem("token") }
        });
        const data = await res.json();
        
        if(res.ok) {
            document.getElementById("rUsers").innerText = data.totalUsers || 0;
            document.getElementById("rDonations").innerText = data.totalDonations || 0;
            document.getElementById("rSuccess").innerText = data.successAmount || 0;
            document.getElementById("rPending").innerText = data.pendingAmount || 0;
            document.getElementById("rFailed").innerText = data.failedAmount || 0;
            document.getElementById("rAmount").innerText = data.totalAmount || 0;
            document.getElementById("rTime").innerText = new Date().toLocaleString();
        }
    } catch(err) {
        console.error("Report Load Error", err);
    }
}