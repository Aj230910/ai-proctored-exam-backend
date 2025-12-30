const API = "https://ai-proctored-exam-backend.onrender.com/api/admin/sessions";
const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "/admin/login.html";
}

const table = document.getElementById("tableBody");
let chart;

function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin/login.html";
}

function loadData() {
  fetch(API, {
    headers: { Authorization: "Bearer " + token }
  })
    .then(res => res.json())
    .then(data => {
      table.innerHTML = "";

      const labels = [];
      const risks = [];

      data.forEach(s => {
        labels.push(s.user_id);
        risks.push(s.risk);

const row = document.createElement("tr");
row.innerHTML = `
  <td>${s.user_id}</td>
  <td>${s.exam_id || "-"}</td>
  <td>${s.score ?? "-"}</td>
  <td>${s.risk}</td>
  <td>${s.violations}</td>
  <td>
    <span class="badge ${s.terminated ? "terminated" : "active"}">
      ${s.status}
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
    });
}

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
      datasets: [{
        label: "Risk Score",
        data,
        backgroundColor: "#e04b66ff"
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
function deleteUser(userId) {
  if (!confirm(`Delete user ${userId}?`)) return;

  fetch(`http://127.0.0.1:8000/api/admin/delete-user?user_id=${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token
    }
  })
    .then(res => res.json())
    .then(() => {
      loadData(); // refresh dashboard
    });
}

loadData();
setInterval(loadData, 3000);
