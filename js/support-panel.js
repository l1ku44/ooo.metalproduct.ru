(function () {
  "use strict";

  const AUTH_KEY = "mtl_support_auth";
  const STORAGE_KEY = "mtl_support_requests";

  // Русские названия статусов (ключи совпадают со значениями в БД)
  const STATUS_LABELS = {
    "новая": "Новая",
    "в работе": "В работе",
    "завершена": "Завершена",
    "отклонена": "Отклонена"
  };

  // ---------- Проверка сессии через PHP ----------
  fetch('check_session.php')
    .then(response => response.json())
    .then(data => {
      if (!data.authenticated) {
        sessionStorage.removeItem(AUTH_KEY);
        window.location.href = "support-login.html";
        return;
      }
      initPanel();
    })
    .catch(() => {
      window.location.href = "support-login.html";
    });

  // ---------- Основная панель ----------
  function initPanel() {
    const tbody = document.querySelector("[data-requests-body]");
    const filter = document.querySelector("[data-status-filter]");
    const message = document.querySelector("[data-panel-message]");
    const modeNode = document.querySelector("[data-support-mode]");
    const refreshButton = document.querySelector("[data-refresh]");
    const logoutButton = document.querySelector("[data-logout]");

    let requests = [];
    let mode = "static";

    function setMessage(text, isError) {
      if (!message) return;
      message.textContent = text || "";
      message.classList.toggle("is-error", Boolean(isError));
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function formatDate(value) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value || "";
      return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    function normalizeRequest(item) {
      return {
        id: Number(item.id),
        employee_name: item.employee_name || "",
        department: item.department || "",
        email: item.email || "",
        phone: item.phone || "",
        topic: item.topic || "",
        message: item.message || "",
        status: item.status || "новая",
        created_at: item.created_at || new Date().toISOString()
      };
    }

    function getStoredRequests() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      } catch (error) {
        return [];
      }
    }

    function saveStoredRequests(items) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    function updateStats() {
      const total = requests.length;
      const newCount = requests.filter(r => r.status === "новая").length;
      const progressCount = requests.filter(r => r.status === "в работе").length;
      const doneCount = requests.filter(r => r.status === "завершена").length;

      const totalNode = document.querySelector("[data-stat-total]");
      const newNode = document.querySelector("[data-stat-new]");
      const progressNode = document.querySelector("[data-stat-progress]");
      const doneNode = document.querySelector("[data-stat-done]");

      if (totalNode) totalNode.textContent = String(total);
      if (newNode) newNode.textContent = String(newCount);
      if (progressNode) progressNode.textContent = String(progressCount);
      if (doneNode) doneNode.textContent = String(doneCount);
    }

    function renderRequests() {
      if (!tbody) return;
      const currentFilter = filter ? filter.value : "all";
      const visible = currentFilter === "all"
        ? requests
        : requests.filter(r => r.status === currentFilter);

      updateStats();
      if (modeNode) {
        modeNode.textContent = mode === "api"
          ? "Режим: MySQL через PHP"
          : "Режим: локальное хранение браузера";
      }

      if (visible.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Заявок нет.</td></tr>';
        return;
      }

      tbody.innerHTML = visible.map(item => `
        <tr>
          <td>${escapeHtml(item.id)}</td>
          <td><strong>${escapeHtml(item.employee_name)}</strong><br>${escapeHtml(item.department)}</td>
          <td>${escapeHtml(item.email)}<br>${escapeHtml(item.phone)}</td>
          <td>${escapeHtml(item.topic)}</td>
          <td>${escapeHtml(item.message)}</td>
          <td>
            <select class="request-status" data-status-id="${escapeHtml(item.id)}">
              ${Object.entries(STATUS_LABELS).map(([val, label]) => `
                <option value="${escapeHtml(val)}" ${item.status === val ? "selected" : ""}>${escapeHtml(label)}</option>
              `).join("")}
            </select>
          </td>
          <td>${escapeHtml(formatDate(item.created_at))}</td>
          <td><button class="request-delete" data-delete-id="${escapeHtml(item.id)}">Удалить</button></td>
        </tr>
      `).join("");
    }

    async function apiRequest(url, data) {
      const resp = await fetch(url, {
        method: "POST",
        body: data,
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });
      const json = await resp.json();
      if (!resp.ok || !json.success) throw new Error(json.message || "Ошибка запроса");
      return json;
    }

    async function loadRequests() {
      setMessage("");
      try {
        const resp = await fetch("php/list_requests.php", {
          headers: { "X-Requested-With": "XMLHttpRequest" }
        });
        const json = await resp.json();
        if (!resp.ok || !json.success) throw new Error(json.message || "PHP API недоступен");
        mode = "api";
        requests = json.requests.map(normalizeRequest);
        renderRequests();
      } catch (err) {
        mode = "static";
        requests = getStoredRequests().map(normalizeRequest).sort((a,b)=>b.id-a.id);
        renderRequests();
        setMessage("PHP/MySQL недоступны, используется локальное хранение браузера.", false);
      }
    }

    async function updateStatus(id, status) {
      if (mode === "api") {
        const fd = new FormData();
        fd.append("id", id);
        fd.append("status", status);
        await apiRequest("php/update_request.php", fd);
        await loadRequests();
        return;
      }
      requests = requests.map(r => Number(r.id) === Number(id) ? { ...r, status } : r);
      saveStoredRequests(requests);
      renderRequests();
    }

    async function deleteRequest(id) {
      if (mode === "api") {
        const fd = new FormData();
        fd.append("id", id);
        await apiRequest("php/delete_request.php", fd);
        await loadRequests();
        return;
      }
      requests = requests.filter(r => Number(r.id) !== Number(id));
      saveStoredRequests(requests);
      renderRequests();
    }

    if (tbody) {
      tbody.addEventListener("change", async (e) => {
        const target = e.target;
        if (!target.matches("[data-status-id]")) return;
        try {
          await updateStatus(target.dataset.statusId, target.value);
          setMessage("Статус обновлён");
        } catch (err) {
          setMessage(err.message, true);
          await loadRequests();
        }
      });
      tbody.addEventListener("click", async (e) => {
        const btn = e.target;
        if (!btn.matches("[data-delete-id]")) return;
        if (!confirm("Удалить заявку?")) return;
        try {
          await deleteRequest(btn.dataset.deleteId);
          setMessage("Заявка удалена");
        } catch (err) {
          setMessage(err.message, true);
        }
      });
    }

    if (filter) filter.addEventListener("change", renderRequests);
    if (refreshButton) refreshButton.addEventListener("click", loadRequests);
    if (logoutButton) {
      logoutButton.addEventListener("click", async () => {
        await fetch("logout.php").catch(()=>{});
        sessionStorage.removeItem(AUTH_KEY);
        window.location.href = "support-login.html";
      });
    }
    loadRequests();

    // ---------- Управление сотрудниками (только для админа) ----------
    const staffPanel = document.querySelector("[data-staff-panel]");
    const staffBody = document.querySelector("[data-staff-body]");
    const staffAddBtn = document.querySelector("[data-staff-add]");
    const staffModal = document.querySelector("[data-staff-modal]");
    const staffForm = document.getElementById("staff-form");
    const modalTitle = document.querySelector("[data-modal-title]");
    const closeModalBtn = document.querySelector("[data-modal-close]");

    async function checkAdminAndLoadStaff() {
      if (!staffPanel) return;
      try {
        const resp = await fetch("php/staff_management.php?action=list");
        const data = await resp.json();
        if (resp.ok && data.success) {
          staffPanel.style.display = "block";
          renderStaffList(data.staff);
        } else {
          staffPanel.style.display = "none";
        }
      } catch (err) {
        staffPanel.style.display = "none";
      }
    }

    function renderStaffList(staff) {
      if (!staffBody) return;
      if (!staff.length) {
        staffBody.innerHTML = '<tr><td colspan="5">Нет сотрудников</td></tr>';
        return;
      }
      staffBody.innerHTML = staff.map(user => `
        <tr>
          <td>${escapeHtml(user.id)}</td>
          <td>${escapeHtml(user.username)}</td>
          <td>${escapeHtml(user.full_name)}</td>
          <td>${user.role === 'admin' ? 'Администратор' : 'Оператор'}</td>
          <td>
            <button class="staff-edit" data-staff-id="${user.id}" data-staff-username="${escapeHtml(user.username)}" data-staff-fullname="${escapeHtml(user.full_name)}" data-staff-role="${user.role}">Ред.</button>
            <button class="staff-delete" data-staff-id="${user.id}">Удалить</button>
          </td>
        </tr>
      `).join("");

      document.querySelectorAll(".staff-edit").forEach(btn => {
        btn.addEventListener("click", () => {
          openStaffModal(btn.dataset.staffId, btn.dataset.staffUsername, btn.dataset.staffFullname, btn.dataset.staffRole);
        });
      });
      document.querySelectorAll(".staff-delete").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.staffId;
          if (!confirm("Удалить сотрудника?")) return;
          try {
            const resp = await fetch("php/staff_management.php", {
              method: "DELETE",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ id: id })
            });
            const data = await resp.json();
            if (data.success) {
              setMessage(data.message);
              checkAdminAndLoadStaff();
            } else {
              setMessage(data.message, true);
            }
          } catch (err) {
            setMessage("Ошибка удаления", true);
          }
        });
      });
    }

    function openStaffModal(id, username, fullname, role) {
      if (!staffModal || !staffForm) return;
      staffForm.querySelector("[name='id']").value = id;
      staffForm.querySelector("[name='username']").value = username;
      staffForm.querySelector("[name='password']").value = "";
      staffForm.querySelector("[name='full_name']").value = fullname;
      staffForm.querySelector("[name='role']").value = role;
      if (modalTitle) modalTitle.textContent = id ? "Редактирование сотрудника" : "Добавление сотрудника";
      staffModal.style.display = "flex";
    }

    if (staffForm) {
      staffForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(staffForm);
        const msgDiv = staffForm.querySelector("[data-staff-form-message]");
        try {
          const resp = await fetch("php/staff_management.php", { method: "POST", body: fd });
          const data = await resp.json();
          if (data.success) {
            if (msgDiv) msgDiv.textContent = data.message;
            setTimeout(() => { if (staffModal) staffModal.style.display = "none"; }, 1000);
            checkAdminAndLoadStaff();
          } else {
            if (msgDiv) msgDiv.textContent = data.message;
          }
        } catch (err) {
          if (msgDiv) msgDiv.textContent = "Ошибка сохранения";
        }
      });
    }
    if (staffAddBtn) staffAddBtn.addEventListener("click", () => openStaffModal(0, "", "", "operator"));
    if (closeModalBtn) closeModalBtn.addEventListener("click", () => { if (staffModal) staffModal.style.display = "none"; });
    window.addEventListener("click", (e) => { if (e.target === staffModal && staffModal) staffModal.style.display = "none"; });

    checkAdminAndLoadStaff();
  }
})();