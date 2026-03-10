window.onerror = function (msg, url, line, col, err) {
  console.error("Error:", msg, url, line, col, err);
  return false;
};

let siteData = { events: [], carta: { drinks: [] }, photos: [], settings: {} };
let editingEventIndex = -1;
let editingCartaIndex = -1;

function showLogin() {
  document.getElementById("login-overlay").style.display = "flex";
}

function hideLogin() {
  document.getElementById("login-overlay").style.display = "none";
}

async function checkSession() {
  try {
    const res = await fetch("/api/admin/session");
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.authenticated);
  } catch (_error) {
    return false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (await checkSession()) {
    hideLogin();
    loadData();
    return;
  }

  showLogin();
});

async function logout() {
  try {
    await fetch("/api/admin/logout", { method: "POST" });
  } catch (_error) {
    // Ignore logout errors and refresh UI state.
  }
  window.location.reload();
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("login-user").value;
  const password = document.getElementById("login-pass").value;

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const result = await res.json();
    if (res.ok) {
      hideLogin();
      loadData();
    } else {
      alert("Invalid credentials: " + (result.error || "Unknown error"));
    }
  } catch (err) {
    alert("Login error: " + err.message);
  }
}

function switchTab(e, id) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  e.currentTarget.classList.add("active");
  const panel = document.getElementById("panel-" + id);
  if (panel) panel.classList.add("active");
}

async function loadData() {
  try {
    const res = await fetch("/api/data");
    if (res.status === 401) {
      showLogin();
      return;
    }
    if (!res.ok) throw new Error("Server returned " + res.status);
    const data = await res.json();
    siteData = {
      events: data.events || [],
      carta: { drinks: data.carta && data.carta.drinks ? data.carta.drinks : [] },
      photos: data.photos || [],
      settings: data.settings || {}
    };
    renderAll();
  } catch (err) {
    alert("Failed to load data: " + err.message);
  }
}

function renderAll() {
  renderEvents();
  renderCarta();
  renderPhotos();
  if (siteData.settings) {
    document.getElementById("set-tiktok").value = siteData.settings.tiktok || "";
    document.getElementById("set-insta").value = siteData.settings.instagram || "";
    document.getElementById("set-fb").value = siteData.settings.facebook || "";
    document.getElementById("set-wa").value = siteData.settings.whatsapp || "";
    document.getElementById("set-phone").value = siteData.settings.phone || "";
  }
}

async function uploadFile(fileInput) {
  if (!fileInput || !fileInput.files[0]) return "";
  const fd = new FormData();
  fd.append("image", fileInput.files[0]);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (res.status === 401) {
    showLogin();
    throw new Error("Authentication required");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || ("Upload failed with status " + res.status));
  }
  return data.url || "";
}

function renderEvents() {
  const box = document.getElementById("events-list");
  if (!box) return;
  if (!siteData.events.length) {
    box.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">No events yet. Add one below.</p>';
    return;
  }

  box.innerHTML = siteData.events.map((ev, i) => `
    <div class="item-row">
      ${ev.image
        ? `<img src="${ev.image}" class="img-thumb" alt="${ev.day}">`
        : `<div class="no-img"><i class="fas fa-calendar"></i></div>`}
      <div class="item-info">
        <strong style="color:${ev.themeColor || "#d4af37"}">${ev.day || "N/A"}</strong>
        <small>${ev.date || "No date"} · DJ ${ev.musicBy || "N/A"}</small>
        <small style="display:block; margin-top:4px; white-space:pre-line; opacity:0.7;">${ev.details || ""}</small>
      </div>
      <div class="item-actions">
        <button class="btn btn-edit" onclick="startEditEvent(${i})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger" onclick="deleteEvent(${i})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join("");
}

async function handleEventSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("ev-submit-btn");
  const origHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    const fileInput = document.getElementById("ev-img");
    let imageUrl = editingEventIndex > -1 ? (siteData.events[editingEventIndex].image || "") : "";
    if (fileInput && fileInput.files[0]) imageUrl = await uploadFile(fileInput);

    const eventData = {
      id: editingEventIndex > -1 ? siteData.events[editingEventIndex].id : "ev-" + Date.now(),
      image: imageUrl,
      day: (document.getElementById("ev-day").value || "").toUpperCase(),
      date: (document.getElementById("ev-date").value || "").toUpperCase(),
      details: document.getElementById("ev-details").value || "",
      musicBy: (document.getElementById("ev-music").value || "").toUpperCase(),
      themeColor: document.getElementById("ev-color").value || "#d4af37"
    };

    if (editingEventIndex > -1) {
      siteData.events[editingEventIndex] = eventData;
      editingEventIndex = -1;
    } else {
      siteData.events.push(eventData);
    }

    e.target.reset();
    document.getElementById("ev-color").value = "#d4af37";
    document.getElementById("ev-form-title").textContent = "Add New Event";
    btn.innerHTML = '<i class="fas fa-plus"></i> <span>Add Event</span>';
    renderEvents();
    await saveData();
  } catch (err) {
    alert("Error: " + err.message);
    btn.innerHTML = origHTML;
  }
}

function startEditEvent(i) {
  editingEventIndex = i;
  const ev = siteData.events[i];
  document.getElementById("ev-day").value = ev.day || "";
  document.getElementById("ev-date").value = ev.date || "";
  document.getElementById("ev-details").value = ev.details || "";
  document.getElementById("ev-music").value = ev.musicBy || "";
  document.getElementById("ev-color").value = ev.themeColor || "#d4af37";
  document.getElementById("ev-form-title").textContent = "Edit Event";
  document.getElementById("ev-submit-btn").innerHTML = '<i class="fas fa-save"></i> <span>Update Event</span>';
  document.getElementById("panel-events").scrollIntoView({ behavior: "smooth" });
}

async function deleteEvent(i) {
  if (confirm("Delete this event?")) {
    siteData.events.splice(i, 1);
    renderEvents();
    await saveData();
  }
}

function renderCarta() {
  const box = document.getElementById("carta-list");
  if (!box) return;
  if (!siteData.carta || !siteData.carta.drinks || !siteData.carta.drinks.length) {
    box.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">No carta items yet. Add one below.</p>';
    return;
  }

  box.innerHTML = siteData.carta.drinks.map((item, i) => `
    <div class="item-row">
      ${item.image
        ? `<img src="${item.image}" class="img-thumb-sq" alt="${item.name}">`
        : `<div class="no-img"><i class="fas fa-wine-glass"></i></div>`}
      <div class="item-info">
        <strong>${item.name || "N/A"}</strong>
        <small>${item.category || ""} ${item.price ? "· " + item.price : ""} ${item.tablePrice ? "· " + item.tablePrice : ""}</small>
      </div>
      <div class="item-actions">
        <button class="btn btn-edit" onclick="startEditCarta(${i})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger" onclick="deleteCarta(${i})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join("");
}

async function handleCartaSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("carta-submit-btn");
  const origHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    const fileInput = document.getElementById("crt-img");
    let imageUrl = editingCartaIndex > -1 ? (siteData.carta.drinks[editingCartaIndex].image || "") : "";
    if (fileInput && fileInput.files[0]) imageUrl = await uploadFile(fileInput);

    const item = {
      id: editingCartaIndex > -1 ? siteData.carta.drinks[editingCartaIndex].id : "crt-" + Date.now(),
      image: imageUrl,
      name: document.getElementById("crt-name").value,
      category: document.getElementById("crt-cat").value,
      price: document.getElementById("crt-price").value,
      tablePrice: document.getElementById("crt-table").value
    };

    if (editingCartaIndex > -1) {
      siteData.carta.drinks[editingCartaIndex] = item;
      editingCartaIndex = -1;
    } else {
      siteData.carta.drinks.push(item);
    }

    e.target.reset();
    document.getElementById("carta-form-title").textContent = "Add Drink / Bottle";
    btn.innerHTML = '<i class="fas fa-plus"></i> <span>Add to Carta</span>';
    renderCarta();
    await saveData();
  } catch (err) {
    alert("Error: " + err.message);
    btn.innerHTML = origHTML;
  }
}

function startEditCarta(i) {
  editingCartaIndex = i;
  const item = siteData.carta.drinks[i];
  document.getElementById("crt-name").value = item.name || "";
  document.getElementById("crt-cat").value = item.category || "Bières";
  document.getElementById("crt-price").value = item.price || "";
  document.getElementById("crt-table").value = item.tablePrice || "";
  document.getElementById("carta-form-title").textContent = "Edit Drink";
  document.getElementById("carta-submit-btn").innerHTML = '<i class="fas fa-save"></i> <span>Update Item</span>';
  document.getElementById("panel-carta").scrollIntoView({ behavior: "smooth" });
}

async function deleteCarta(i) {
  if (confirm("Delete this carta item?")) {
    siteData.carta.drinks.splice(i, 1);
    renderCarta();
    await saveData();
  }
}

function renderPhotos() {
  const box = document.getElementById("photos-list");
  if (!box) return;
  if (!siteData.photos.length) {
    box.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">No media uploaded yet.</p>';
    return;
  }

  box.innerHTML = siteData.photos.map((photo, i) => `
    <div class="item-row">
      ${photo.type === "image"
        ? `<img src="${photo.src}" class="img-thumb-sq" alt="${photo.alt || ""}">`
        : `<video src="${photo.src}" class="img-thumb-sq" muted></video>`}
      <div class="item-info">
        <strong>${photo.alt || "No caption"}</strong>
        <small>${photo.type || "image"} · ${photo.src}</small>
      </div>
      <div class="item-actions">
        <button class="btn btn-edit" onclick="startEditPhoto(${i})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger" onclick="deletePhoto(${i})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join("");
}

function startEditPhoto(i) {
  const photo = siteData.photos[i];
  const newCaption = prompt("Edit caption/description:", photo.alt || "");
  if (newCaption !== null) {
    siteData.photos[i].alt = newCaption;
    renderPhotos();
    saveData();
  }
}

async function handlePhotoSubmit(e) {
  e.preventDefault();
  const fileInput = document.getElementById("p-file");
  const alt = document.getElementById("p-alt").value;
  if (!fileInput.files[0]) {
    alert("Please select a file to upload.");
    return;
  }

  try {
    const fd = new FormData();
    fd.append("image", fileInput.files[0]);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.status === 401) {
      showLogin();
      throw new Error("Authentication required");
    }
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || ("Upload failed with status " + res.status));
    const isVideo = fileInput.files[0].type.startsWith("video");

    siteData.photos.push({ id: "p-" + Date.now(), type: isVideo ? "video" : "image", src: result.url, alt });
    fileInput.value = "";
    document.getElementById("p-alt").value = "";
    renderPhotos();
    await saveData();
  } catch (err) {
    alert("Upload failed: " + err.message);
  }
}

async function deletePhoto(i) {
  if (confirm("Delete this media item?")) {
    siteData.photos.splice(i, 1);
    renderPhotos();
    await saveData();
  }
}

async function handleSettingsSubmit(e) {
  e.preventDefault();
  if (!siteData.settings) siteData.settings = {};
  siteData.settings.tiktok = document.getElementById("set-tiktok").value;
  siteData.settings.instagram = document.getElementById("set-insta").value;
  siteData.settings.facebook = document.getElementById("set-fb").value;
  siteData.settings.whatsapp = document.getElementById("set-wa").value;
  siteData.settings.phone = document.getElementById("set-phone").value;
  await saveData();
}

async function saveData() {
  const btn = document.getElementById("save-all");
  const orig = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> &nbsp;SAVING...';
  btn.disabled = true;

  try {
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(siteData)
    });
    if (res.status === 401) {
      showLogin();
      throw new Error("Authentication required");
    }
    if (!res.ok) throw new Error("Server returned " + res.status);

    const toast = document.getElementById("toast");
    toast.textContent = "Saved successfully";
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, 3000);
  } catch (err) {
    alert("SAVE FAILED: " + err.message);
  } finally {
    btn.innerHTML = orig;
    btn.disabled = false;
  }
}
