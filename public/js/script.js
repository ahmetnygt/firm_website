// =============================
//  G T R   H O M E   S E A R C H
// =============================

// Elements
const todayBtn = document.querySelector(".today");
const tomorrowBtn = document.querySelector(".tomorrow");
const dateInput = document.getElementById("date");
const searchButton = document.querySelector("#searchForm button[type='submit']");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");

// =============================
// FLATPICKR (FIXED)
// =============================

const fp = flatpickr(dateInput, {
  locale: "tr",

  // 👇 Visible format for the user
  altInput: true,
  altFormat: "d.m.Y",

  // 👇 Actual input value format
  dateFormat: "Y-m-d",

  allowInput: true,
  minDate: "today",
  defaultDate: "today",
});

// =============================
// TODAY – TOMORROW BUTTONS
// =============================
if (todayBtn) {
  todayBtn.addEventListener("click", (e) => {
    e.preventDefault();
    fp.setDate(new Date(), true);
  });
}

if (tomorrowBtn) {
  tomorrowBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const d = new Date();
    d.setDate(d.getDate() + 1);
    fp.setDate(d, true);
  });
}

// =============================
// SAME CITY NOT ALLOWED
// =============================
function validateDifferentCities() {
  const from = fromSelect?.value;
  const to = toSelect?.value;

  if (from && to && from === to) {
    alert("Departure and arrival cannot be the same city!");
    return false;
  }
  return true;
}

fromSelect?.addEventListener("change", validateDifferentCities);
toSelect?.addEventListener("change", validateDifferentCities);

// =============================
// SEARCH BUTTON
// =============================
if (searchButton) {
  searchButton.addEventListener("click", async (e) => {
    e.preventDefault();

    const from = fromSelect?.value;
    const to = toSelect?.value;
    const date = dateInput.value; // 👈 REAL FORMAT: 2025-11-22

    if (!from || !to || !date) {
      alert("Please select departure, arrival, and date.");
      return;
    }

    if (!validateDifferentCities()) return;

    // 🔥 Format is now correct: YYYY-MM-DD
    window.location.href = `/trips?from=${from}&to=${to}&date=${date}`;
  });
}

$(document).ready(function () {
  // The navbar update function (checkAuthStatus) is no longer needed, PUG handles it.

  // 1. Login Form
  $("#loginForm").on("submit", async function (e) {
    e.preventDefault();

    const btn = $(this).find('button[type="submit"]');
    const spinner = btn.find(".spinner-border");
    const textSpan = btn.find(".text-btn");

    const idNumber = $(this).find('[name="idNumber"]').val().trim();
    const password = $(this).find('[name="password"]').val();

    // Lock UI
    setLoading(btn, true);

    try {
      const res = await $.ajax({
        url: "/login",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ idNumber, password }),
      });

      if (res.success) {
        // Backend already set the cookie, just reload the page
        window.location.reload();
      }
    } catch (err) {
      let msg = err.responseJSON?.error || "Login failed.";
      alert(msg);
    } finally {
      setLoading(btn, false);
    }
  });

  // 2. Register Form
  $("#registerForm").on("submit", async function (e) {
    e.preventDefault();

    const btn = $(this).find('button[type="submit"]');

    const formData = {
      name: $(this).find('[name="name"]').val().trim(),
      surname: $(this).find('[name="surname"]').val().trim(),
      phone: $(this).find('[name="phone"]').val().trim(),
      idNumber: $(this).find('[name="idNumber"]').val().trim(),
      email: $(this).find('[name="email"]').val().trim(),
      gender: $(this).find('[name="gender"]:checked').val(),
      password: $(this).find('[name="password"]').val(),
    };

    if (formData.idNumber.length !== 11) {
      alert("Turkish ID Number must be 11 digits.");
      return;
    }

    setLoading(btn, true);

    try {
      const res = await $.ajax({
        url: "/register",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(formData),
      });

      if (res.success) {
        alert("Registration successful! You are now logged in.");
        window.location.reload();
      }
    } catch (err) {
      let msg = err.responseJSON?.error || "An error occurred during registration.";
      alert(msg);
    } finally {
      setLoading(btn, false);
    }
  });
});

function setLoading(btn, isLoading) {
  const spinner = btn.find(".spinner-border");
  const textSpan = btn.find(".text-btn");

  if (isLoading) {
    btn.prop("disabled", true);
    spinner.removeClass("d-none");
    textSpan.addClass("d-none");
  } else {
    btn.prop("disabled", false);
    spinner.addClass("d-none");
    textSpan.removeClass("d-none");
  }
}