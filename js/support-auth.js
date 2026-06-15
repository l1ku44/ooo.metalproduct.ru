sessionStorage.removeItem("mtl_support_auth");
(function () {
  "use strict";

  const form = document.querySelector("[data-auth-form]");
  const message = document.querySelector("[data-auth-message]");
  const AUTH_KEY = "mtl_support_auth";

  document.body.classList.add("reveal-ready");
  document.querySelectorAll("[data-reveal]").forEach((node) => {
    node.classList.add("is-visible");
  });

  if (sessionStorage.getItem(AUTH_KEY) === "true") {
    window.location.href = "support-panel.html";
    return;
  }

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const login = String(formData.get("login") || "").trim();
    const password = String(formData.get("password") || "");

    fetch("php/ajax_login.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ login: login, password: password })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          sessionStorage.setItem(AUTH_KEY, "true");
          window.location.href = "support-panel.html";
        } else {
          if (message) {
            message.textContent = data.message || "Неверный логин или пароль.";
            message.classList.add("is-error");
          }
        }
      })
      .catch(() => {
        if (message) {
          message.textContent = "Ошибка соединения с сервером.";
          message.classList.add("is-error");
        }
      });
  });
})();