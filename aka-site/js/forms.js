/* =========================================================================
   AKA — Form submission handler
   -------------------------------------------------------------------------
   Any <form data-api="contact"> or <form data-api="apply"> is submitted to
   the AKA backend Worker via fetch, with an inline status message. The CV
   upload on the careers form is sent as multipart/form-data automatically.
   ========================================================================= */

const AKA_API = "https://aka-api.hadi-alakkadd.workers.dev";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form[data-api]").forEach((form) => {
    const endpoint = form.getAttribute("data-api"); // "contact" or "apply"
    const status = form.querySelector(".form-status");
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (button) button.disabled = true;
      if (status) {
        status.className = "form-status";
        status.textContent = I18N.t("form.sending");
      }

      try {
        const res = await fetch(`${AKA_API}/${endpoint}`, {
          method: "POST",
          body: new FormData(form),
        });
        const data = await res.json().catch(() => ({ ok: false }));

        if (res.ok && data.ok) {
          form.reset();
          if (status) {
            status.classList.add("form-status--ok");
            status.textContent = I18N.t(
              endpoint === "apply" ? "form.applied" : "form.success"
            );
          }
        } else {
          throw new Error("request failed");
        }
      } catch (err) {
        if (status) {
          status.classList.add("form-status--err");
          status.textContent = I18N.t("form.error");
        }
      } finally {
        if (button) button.disabled = false;
      }
    });
  });
});
