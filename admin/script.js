/*********************************
 * CONFIG
 *********************************/
const API_BASE = "https://ai-proctored-exam-backend.onrender.com";
const SESSIONS_API = `${API_BASE}/api/admin/sessions`;
const DELETE_API = `${API_BASE}/api/admin/delete-user`;

const token = localStorage.getItem("adminToken");

/*********************************
 * AUTH GUARD
 *********************************/
if (!token) {
  window.location.href = "/admin/login.html";
}

/*********************************
 * ELEMENTS
 *********************************/
const table = document.getElementById("tableBody");
let chart;

/*********************************
 * LOGOUT
 *********************************/
function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin/login.html";
}

/*********************************
 * LOAD DASHBOARD DATA
 *********************************/
function loadData() {
  fetch(SESSIONS_API, {
    headers: {
      Authorization: "Bearer " + token
    }
  })
    .then(res => {
      // 🔐 Token expired / invalid
      if (res.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "/admin/login.html";
        return;
      }
      return res.json();
    })
    .then(data => {
      if (!data) return;

      table.innerHTML = "";

      const labels = [];
      const risks = [];

      data.forEach(s => {
        labels.push(s.user_id);
        risks.push(s.risk || 0);

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${s.user_id}</td>
          <td>${s.exam_id || "-"}</td>
          <td>${s.score ?? "-"}</td>
          <td>${s.risk ?? 0}</td>
          <td>${s.violations ?? 0}</td>
          <td>
            <span class="badge ${s.terminated ? "terminated" : "active"}">
              ${s.status || "Active"}
            </span>
          </td>
          <td>
            <button class="delete-btn" onclick="deleteUser('${s.user_id}')">
              Delete
            </button>
          </td>
        `;
        table.appendChild(row);
      });

      renderChart(labels, risks);
    })
    .catch(err => {
      console.error("Failed to load admin data:", err);
    });
}

/*********************************
 * RISK CHART
 *********************************/
function renderChart(labels, data) {
  const ctx = document.getElementById("riskChart");

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
    return;
  }

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Risk Score",
          data,
          backgroundColor: "#e04b66"
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

/*********************************
 * DELETE USER
 *********************************/
function deleteUser(userId) {
  if (!confirm(`Delete user "${userId}"?`)) return;

  fetch(`${DELETE_API}?user_id=${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token
    }
  })
    .then(res => {
      if (!res.ok) {
        alert("Failed to delete user");
        return;
      }
      loadData(); // refresh
    })
    .catch(err => {
      console.error("Delete failed:", err);
    });
}

/*********************************
 * INIT
 *********************************/
loadData();
setInterval(loadData, 3000);
