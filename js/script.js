(function () {
  "use strict";

  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const backToTop = document.querySelector("[data-back-to-top]");
  const yearNodes = document.querySelectorAll("[data-year]");
  const revealNodes = document.querySelectorAll("[data-reveal]");
  const feedbackForm = document.querySelector("[data-feedback-form]");

  document.body.classList.add("reveal-ready");

  yearNodes.forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  function setHeaderState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }

  function setBackToTopState() {
    if (!backToTop) return;
    backToTop.classList.toggle("visible", window.scrollY > 520);
  }

  window.addEventListener("scroll", () => {
    setHeaderState();
    setBackToTopState();
  }, { passive: true });

  setHeaderState();
  setBackToTopState();

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("nav-lock", isOpen);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        navToggle.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-lock");
      });
    });
  }

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.14,
      rootMargin: "0px 0px -60px 0px"
    });

    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  function getFieldWrapper(field) {
    return field.closest(".form-field");
  }

  function setFieldError(field, message) {
    const wrapper = getFieldWrapper(field);
    if (!wrapper) return;

    const errorNode = wrapper.querySelector(".field-error");
    wrapper.classList.toggle("is-invalid", Boolean(message));
    if (errorNode) {
      errorNode.textContent = message;
    }
  }

  function validateField(field) {
    const label = field.dataset.label || "Поле";
    const value = field.value.trim();

    if (field.required && !value) {
      setFieldError(field, `${label}: заполните поле.`);
      return false;
    }

    if (field.type === "email" && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        setFieldError(field, "Email: укажите корректный адрес.");
        return false;
      }
    }

    if (field.minLength > 0 && value.length > 0 && value.length < field.minLength) {
      setFieldError(field, `${label}: минимум ${field.minLength} символов.`);
      return false;
    }

    setFieldError(field, "");
    return true;
  }

  if (feedbackForm) {
    const fields = Array.from(feedbackForm.querySelectorAll("input:not([type='checkbox']), textarea, select"));
    const checkbox = feedbackForm.querySelector("input[type='checkbox'][required]");
    const formMessage = feedbackForm.querySelector("[data-form-message]");

    fields.forEach((field) => {
      field.addEventListener("input", () => validateField(field));
      field.addEventListener("change", () => validateField(field));
    });

    feedbackForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const isFieldsValid = fields
        .map((field) => validateField(field))
        .every(Boolean);
      const isCheckboxValid = checkbox ? checkbox.checked : true;

      if (checkbox) {
        checkbox.closest(".checkbox-field").classList.toggle("is-invalid", !isCheckboxValid);
      }

      if (!formMessage) return;

      if (!isFieldsValid || !isCheckboxValid) {
        formMessage.textContent = isCheckboxValid
          ? "Проверьте выделенные поля и повторите отправку."
          : "Подтвердите корректность данных перед отправкой.";
        formMessage.classList.add("is-error");
        return;
      }

      const submitButton = feedbackForm.querySelector("button[type='submit']");
      const originalButtonText = submitButton ? submitButton.textContent : "";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.lastChild.textContent = " Отправка...";
      }

      formMessage.textContent = "";
      formMessage.classList.remove("is-error");

      try {
        const response = await fetch(feedbackForm.action, {
          method: "POST",
          body: new FormData(feedbackForm),
          headers: {
            "X-Requested-With": "XMLHttpRequest"
          }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Не удалось сохранить заявку.");
        }

        formMessage.textContent = result.message;
        feedbackForm.reset();
        fields.forEach((field) => setFieldError(field, ""));
        if (checkbox) {
          checkbox.closest(".checkbox-field").classList.remove("is-invalid");
        }
      } catch (error) {
        formMessage.textContent = error.message || "Не удалось отправить заявку.";
        formMessage.classList.add("is-error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.lastChild.textContent = originalButtonText.replace(/\s+/g, " ");
        }
      }
    });
  }
})();
