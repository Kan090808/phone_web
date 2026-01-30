const specFields = [
  { key: "release", label: "上市時間" },
  { key: "chipset", label: "處理器" },
  { key: "display", label: "螢幕" },
  { key: "battery", label: "電池" },
  { key: "ram", label: "記憶體" },
  { key: "storage", label: "儲存" },
  { key: "camera", label: "相機" },
  { key: "os", label: "作業系統" },
];

const state = {
  models: [],
  filters: {
    query: "",
    visibleFields: new Set(specFields.map((field) => field.key)),
  },
};

const elements = {
  toggles: document.getElementById("specToggles"),
  tableHead: document.querySelector("#specTable thead"),
  tableBody: document.querySelector("#specTable tbody"),
  resultCount: document.getElementById("resultCount"),
  updatedAt: document.getElementById("updatedAt"),
  searchInput: document.getElementById("searchInput"),
};

const storageKey = "phone-spec-fields";

const loadConfig = () => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      state.filters.visibleFields = new Set(parsed);
    }
  } catch (error) {
    console.warn("Failed to parse config", error);
  }
};

const saveConfig = () => {
  localStorage.setItem(
    storageKey,
    JSON.stringify(Array.from(state.filters.visibleFields))
  );
};

const formatUpdatedAt = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `最後更新：${date.toLocaleString("zh-Hant")}`;
};

const normalize = (value) => value.toLowerCase();

const renderToggles = () => {
  elements.toggles.innerHTML = "";
  specFields.forEach((field) => {
    const label = document.createElement("label");
    label.className = "toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.filters.visibleFields.has(field.key);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.filters.visibleFields.add(field.key);
      } else {
        state.filters.visibleFields.delete(field.key);
      }
      saveConfig();
      renderTable();
    });

    const text = document.createElement("span");
    text.textContent = field.label;

    label.appendChild(checkbox);
    label.appendChild(text);
    elements.toggles.appendChild(label);
  });
};

const renderTable = () => {
  const query = normalize(state.filters.query);
  const visibleFields = specFields.filter((field) =>
    state.filters.visibleFields.has(field.key)
  );

  const filtered = state.models.filter((model) => {
    const target = `${model.brand} ${model.model}`.toLowerCase();
    return target.includes(query);
  });

  elements.resultCount.textContent = `共 ${filtered.length} 款手機`;

  const headerCells = [
    "<tr>",
    "<th>機型</th>",
    ...visibleFields.map((field) => `<th>${field.label}</th>`),
    "</tr>",
  ].join("");

  elements.tableHead.innerHTML = headerCells;

  elements.tableBody.innerHTML = filtered
    .map((model) => {
      const cells = visibleFields
        .map((field) => `<td>${model[field.key] ?? "-"}</td>`)
        .join("");
      return `
        <tr>
          <td>
            <div class="model">${model.model}</div>
            <div class="badge">${model.brand}</div>
          </td>
          ${cells}
        </tr>
      `;
    })
    .join("");
};

const loadData = async () => {
  const response = await fetch("data/specs.json", { cache: "no-store" });
  const payload = await response.json();
  const unique = new Map();
  payload.models.forEach((item) => {
    const key = item.model.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  });
  state.models = Array.from(unique.values());
  elements.updatedAt.textContent = formatUpdatedAt(payload.updatedAt);
  renderTable();
};

const init = () => {
  loadConfig();
  renderToggles();
  loadData();

  elements.searchInput.addEventListener("input", (event) => {
    state.filters.query = event.target.value.trim();
    renderTable();
  });
};

init();
