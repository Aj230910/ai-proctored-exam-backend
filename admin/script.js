// ===== AI Proctored Exam – Admin Dashboard Script =====

const API_BASE = 'https://ai-proctored-exam-backend.onrender.com';

// ── Auth helper ──
function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (token || '')
    };
}

// ── State ──
let allSessions = [];
let filteredSessions = [];
let deleteTarget = null;
let currentPage = 1;
const PAGE_SIZE = 10;

// ── DOM refs ──
const sessionsBody = document.getElementById('sessionsBody');
const searchInput = document.getElementById('searchInput');
const tableCount = document.getElementById('tableCount');
const footerInfo = document.getElementById('footerInfo');
const paginationEl = document.getElementById('pagination');
const totalStudentsEl = document.getElementById('totalStudents');
const activeSessionsEl = document.getElementById('activeSessions');
const totalViolationsEl = document.getElementById('totalViolations');
const terminatedCountEl = document.getElementById('terminatedCount');

// ── Utility ──
const avatarClasses = ['a', 'b', 'c', 'd', 'e'];
function avatarClass(name) {
    const code = (name || '').charCodeAt(0) || 0;
    return avatarClasses[code % avatarClasses.length];
}
function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

// ── Status helpers ──
function statusClass(status) {
    if (!status) return 'active';
    const s = status.toLowerCase().replace(/[\s_-]/g, '');
    if (s === 'completed') return 'completed';
    if (s === 'terminated') return 'terminated';
    if (s === 'loggedin' || s === 'logged_in' || s === 'logged-in' || s === 'online') return 'logged-in';
    if (s === 'active' || s === 'inprogress' || s === 'in_progress') return 'active';
    return 'active';
}
function statusLabel(status) {
    if (!status) return 'Active';
    const s = status.toLowerCase().replace(/[\s_-]/g, '');
    if (s === 'completed') return 'Completed';
    if (s === 'terminated') return 'Terminated';
    if (s === 'loggedin' || s === 'logged_in' || s === 'logged-in' || s === 'online') return 'Logged In';
    if (s === 'active' || s === 'inprogress' || s === 'in_progress') return 'Active';
    return status;
}

// ── Violations badge ──
function violationsLevel(v) {
    const n = parseInt(v) || 0;
    if (n === 0) return 'zero';
    if (n <= 5) return 'low';
    return 'high';
}

// ── Fetch sessions ──
async function fetchSessions() {
    showLoading();
    try {
        const res = await fetch(API_BASE + '/api/admin/sessions', {
            headers: getAuthHeaders()
        });
        if (res.status === 401) {
            showToast('error', 'Session expired. Redirecting to login...');
            setTimeout(function () { window.location.href = 'login.html'; }, 1500);
            return;
        }
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        allSessions = Array.isArray(data) ? data : (data.sessions || data.data || []);
    } catch (err) {
        console.error('Error fetching sessions:', err);
        allSessions = [];
        showToast('error', 'Failed to load sessions. Check server connection.');
    }
    applyFilter();
    updateStats();
}

// ── Filter & Render ──
function applyFilter() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    filteredSessions = allSessions.filter(function (s) {
        if (!query) return true;
        const username = (s.user_id || s.username || s.user || s.name || '').toLowerCase();
        const examId = String(s.exam_id || s.examId || '').toLowerCase();
        return username.includes(query) || examId.includes(query);
    });
    currentPage = 1;
    renderTable();
}
function filterSessions() { applyFilter(); }

// ── Render table ──
function renderTable() {
    const total = filteredSessions.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, total);
    const page = filteredSessions.slice(start, end);

    tableCount.textContent = total + ' session' + (total !== 1 ? 's' : '');
    footerInfo.textContent = total === 0
        ? 'No sessions found'
        : 'Showing ' + (start + 1) + '–' + end + ' of ' + total + ' sessions';

    if (total === 0) {
        sessionsBody.innerHTML =
            '<tr><td colspan="6">' +
            '<div class="empty-state">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="11" x2="19" y2="11"/></svg>' +
            '<p>No exam sessions found</p>' +
            '<span>Sessions will appear here when students start exams</span>' +
            '</div></td></tr>';
        renderPagination(totalPages);
        return;
    }

    var html = '';
    page.forEach(function (s, i) {
        const user = s.user_id || s.username || s.user || s.name || 'Unknown';
        const examId = s.exam_id || s.examId || '-';
        const score = s.score != null ? s.score : '-';
        const violations = s.violations != null ? s.violations : 0;
        const status = s.status || 'Active';
        const stClass = statusClass(status);
        const stLabel = statusLabel(status);
        const vLevel = violationsLevel(violations);
        const idx = start + i;

        html +=
            '<tr data-index="' + idx + '">' +
            '<td>' +
            '<div class="user-cell">' +
            '<div class="user-avatar ' + avatarClass(user) + '">' + initials(user) + '</div>' +
            '<span class="user-name">' + escapeHtml(user) + '</span>' +
            '</div>' +
            '</td>' +
            '<td><span class="exam-id-cell">' + escapeHtml(String(examId)) + '</span></td>' +
            '<td><span class="score-cell">' + escapeHtml(String(score)) + '</span></td>' +
            '<td>' +
            '<div class="violations-cell">' +
            '<span class="violations-count ' + vLevel + '">' + violations + '</span>' +
            '</div>' +
            '</td>' +
            '<td><span class="status-badge ' + stClass + '"><span class="status-dot"></span>' + stLabel + '</span></td>' +
            '<td>' +
            '<div class="action-btns">' +
            '<button class="btn-action view" data-tooltip="View Details" onclick="viewSession(' + idx + ')">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
            '</button>' +
            '<button class="btn-action terminate" data-tooltip="Terminate" onclick="terminateSession(' + idx + ')">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
            '</button>' +
            '<button class="btn-action delete" data-tooltip="Delete" onclick="showDeleteModal(' + idx + ')">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
            '</div>' +
            '</td>' +
            '</tr>';
    });

    sessionsBody.innerHTML = html;
    renderPagination(totalPages);

    // Stagger row animation
    var rows = sessionsBody.querySelectorAll('tr');
    rows.forEach(function (row, i) {
        row.style.opacity = '0';
        row.style.transform = 'translateY(8px)';
        setTimeout(function () {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, 40 * i);
    });
}

// ── Pagination ──
function renderPagination(totalPages) {
    if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }
    var html = '';
    html += '<button class="page-btn" onclick="goToPage(' + (currentPage - 1) + ')"' + (currentPage === 1 ? ' disabled' : '') + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>';
    for (var p = 1; p <= totalPages; p++) {
        html += '<button class="page-btn' + (p === currentPage ? ' active' : '') + '" onclick="goToPage(' + p + ')">' + p + '</button>';
    }
    html += '<button class="page-btn" onclick="goToPage(' + (currentPage + 1) + ')"' + (currentPage === totalPages ? ' disabled' : '') + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>';
    paginationEl.innerHTML = html;
}
function goToPage(p) {
    var totalPages = Math.max(1, Math.ceil(filteredSessions.length / PAGE_SIZE));
    if (p < 1 || p > totalPages) return;
    currentPage = p;
    renderTable();
}

// ── Stats ──
function updateStats() {
    const total = allSessions.length;
    const active = allSessions.filter(function (s) {
        const st = (s.status || '').toLowerCase().replace(/[\s_-]/g, '');
        return st === 'loggedin' || st === 'logged_in' || st === 'active' || st === 'inprogress' || st === 'online';
    }).length;
    const violations = allSessions.reduce(function (sum, s) { return sum + (parseInt(s.violations) || 0); }, 0);
    const terminated = allSessions.filter(function (s) {
        return (s.status || '').toLowerCase() === 'terminated';
    }).length;

    animateCounter(totalStudentsEl, total);
    animateCounter(activeSessionsEl, active);
    animateCounter(totalViolationsEl, violations);
    animateCounter(terminatedCountEl, terminated);
}

function animateCounter(el, target) {
    const start = parseInt(el.textContent) || 0;
    if (start === target) { el.textContent = target; return; }
    const duration = 600;
    const startTime = performance.now();
    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ── Loading ──
function showLoading() {
    sessionsBody.innerHTML =
        '<tr><td colspan="6">' +
        '<div class="table-loading" id="tableLoading"><div class="spinner"></div><p>Loading sessions...</p></div>' +
        '</td></tr>';
}

// ── Actions ──
function viewSession(index) {
    const s = filteredSessions[index];
    if (!s) return;
    const user = s.user_id || s.username || s.user || s.name || 'Unknown';
    showToast('info', 'Viewing details for ' + user);
}

async function terminateSession(index) {
    const s = filteredSessions[index];
    if (!s) return;
    const user = s.user_id || s.username || s.user || s.name || 'Unknown';
    const examId = s.exam_id || s.examId || '';

    try {
        const res = await fetch(API_BASE + '/api/admin/terminate', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ username: user, exam_id: examId })
        });
        if (!res.ok) throw new Error('Failed');
        showToast('success', 'Session terminated for ' + user);
        await fetchSessions();
    } catch (err) {
        console.error('Terminate error:', err);
        showToast('error', 'Failed to terminate session for ' + user);
    }
}

// ── Delete modal ──
function showDeleteModal(index) {
    deleteTarget = filteredSessions[index];
    if (!deleteTarget) return;
    const user = deleteTarget.user_id || deleteTarget.username || deleteTarget.user || deleteTarget.name || 'Unknown';
    document.getElementById('deleteUser').textContent = user;
    document.getElementById('deleteModal').classList.add('active');
}
function hideDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    deleteTarget = null;
}
async function confirmDelete() {
    if (!deleteTarget) return;
    const user = deleteTarget.user_id || deleteTarget.username || deleteTarget.user || deleteTarget.name || '';
    const examId = deleteTarget.exam_id || deleteTarget.examId || '';
    hideDeleteModal();

    try {
        const res = await fetch(API_BASE + '/api/admin/delete', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ username: user, exam_id: examId })
        });
        if (!res.ok) throw new Error('Failed');
        showToast('success', 'Session deleted for ' + user);
        await fetchSessions();
    } catch (err) {
        console.error('Delete error:', err);
        showToast('error', 'Failed to delete session for ' + user);
    }
}

// ── Refresh ──
async function refreshSessions() {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('spinning');
    await fetchSessions();
    setTimeout(function () { btn.classList.remove('spinning'); }, 800);
    showToast('success', 'Sessions refreshed');
}

// ── Logout ──
function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// ── Toast ──
function showToast(type, message) {
    var container = document.getElementById('toastContainer');
    var iconSvg = '';
    if (type === 'success') {
        iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    } else if (type === 'error') {
        iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
        iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = iconSvg + '<span>' + escapeHtml(message) + '</span>';
    container.appendChild(toast);
    setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3500);
}

// ── HTML escape ──
function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ── Init ──
document.addEventListener('DOMContentLoaded', function () {
    // Check if admin is logged in
    if (!localStorage.getItem('adminToken')) {
        window.location.href = 'login.html';
        return;
    }
    fetchSessions();

    // Auto-refresh every 15 seconds
    setInterval(function () {
        fetchSessions();
    }, 15000);
});