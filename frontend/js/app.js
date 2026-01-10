// MASTER API CONFIGURATION
const API_BASE = "https://ngo-donation-backend.onrender.com";
// const API_BASE = "http://localhost:5000"; 

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
    if(res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("name", data.user.name); // Store name for welcome message
      
      showToast("Login Successful!");
      
      // Redirect based on role
      setTimeout(() => {
          if(data.user.role === 'admin') window.location.href = "admin-dashboard.html";
          else window.location.href = "user-dashboard.html";
      }, 1000);
    } else {
      showToast(data.message);
    }
  } catch(err) {
    console.error(err);
    showToast("Login failed");
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
        const res = await fetch(API_BASE + "/api/donation/my-history", {
            headers: { "Authorization": localStorage.getItem("token") }
        });
        const data = await res.json();
        
        if (data.length === 0) {
            container.innerHTML = "<p>No donations found. Start your journey today!</p>";
            return;
        }

        container.innerHTML = ""; // Clear loading text
        data.forEach(d => {
            // Create a receipt card
            const date = new Date(d.createdAt).toLocaleDateString();
            const card = `
                <div class="card">
                    <h3>₹${d.amount}</h3>
                    <p>Status: <b>${d.status}</b></p>
                    <p>Date: ${date}</p>
                </div>
            `;
            container.innerHTML += card;
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Failed to load history.</p>";
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
            document.getElementById("totalUsers").innerText = data.totalUsers;
            document.getElementById("totalDonations").innerText = data.totalDonations;
            document.getElementById("totalAmount").innerText = "₹" + data.totalAmount;
        }
    } catch(err) {
        console.error(err);
    }
}

// ADMIN: LOAD CHARTS
async function loadAdminCharts() {
    // Placeholder logic - you would fetch real data here or pass data from loadAdminStats
    // For now, we render static charts or init empty ones
    // Check if Chart.js is loaded
    if(typeof Chart === 'undefined') return;

    // We need to fetch data first ideally, but here is the setup
    const ctx1 = document.getElementById('statusChart');
    const ctx2 = document.getElementById('amountChart');
    
    // You can populate these with real data later
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