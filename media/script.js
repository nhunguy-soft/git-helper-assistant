/* ======================================================
 * KẾT NỐI VỚI VS CODE
 * ======================================================
 * Dòng này giúp trang web nhỏ này
 * có thể nói chuyện với VS Code Extension
 */
const vscode = acquireVsCodeApi();

/* ======================================================
 * LẤY CÁC THÀNH PHẦN TRÊN GIAO DIỆN
 * ======================================================
 * Giống như việc "đặt tên" cho từng nút, ô nhập, bảng
 * để lát nữa mình điều khiển chúng
 */
const ui = {
  tableBody: document.getElementById("tableBody"),
  pagination: document.getElementById("pagination"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  langToggle: document.getElementById("langToggle"),
  toast: document.getElementById("toast"),

  commitType: document.getElementById("commitType"),
  commitDesc: document.getElementById("commitDesc"),
  commitCopyBtn: document.getElementById("commitCopyBtn"),
};

/* ======================================================
 * TRẠNG THÁI HIỆN TẠI CỦA ỨNG DỤNG
 * ======================================================
 * Hiểu đơn giản: ứng dụng đang ở tình trạng nào
 */
let gitData = {}; // Danh sách lệnh Git
let commitTemplates = []; // Mẫu commit message
let currentLang = "en"; // Ngôn ngữ (en / vi)
let currentCategory = "all"; // Nhóm lệnh đang chọn
let searchKeyword = ""; // Từ khóa tìm kiếm
let currentPage = 1; // Trang hiện tại
const PAGE_SIZE = 10; // Mỗi trang 10 lệnh

/* ======================================================
 * NHẬN DỮ LIỆU TỪ EXTENSION GỬI SANG
 * ======================================================
 * Khi extension mở webview, nó sẽ gửi dữ liệu vào đây
 */
window.addEventListener("message", (event) => {
  if (event.data.type !== "init") return;

  gitData = event.data.gitData || {};
  commitTemplates = event.data.commitTemplates || [];

  renderGitTable(); // Vẽ bảng Git
  initCommitHelper(); // Khởi tạo phần commit
});

/* ======================================================
 * XỬ LÝ KHI NGƯỜI DÙNG TƯƠNG TÁC
 * ====================================================== */

// Khi người dùng gõ tìm kiếm
ui.searchInput.addEventListener("input", (e) => {
  searchKeyword = e.target.value.toLowerCase();
  currentPage = 1;
  renderGitTable();
});

// Khi đổi nhóm lệnh
ui.categoryFilter.addEventListener("change", (e) => {
  currentCategory = e.target.value;
  currentPage = 1;
  renderGitTable();
});

// Khi đổi ngôn ngữ EN / VI
ui.langToggle.addEventListener("change", (e) => {
  currentLang = e.target.checked ? "vi" : "en";
  currentPage = 1;
  renderGitTable();
  initCommitHelper();
});

/* ======================================================
 * HIỂN THỊ BẢNG LỆNH GIT
 * ======================================================
 * Hàm này chịu trách nhiệm:
 * - Lọc
 * - Tìm kiếm
 * - Phân trang
 * - Hiển thị dữ liệu ra bảng
 */
function renderGitTable() {
  ui.tableBody.innerHTML = "";
  ui.pagination.innerHTML = "";

  let list = gitData[currentLang] || [];

  // Lọc theo nhóm
  if (currentCategory !== "all") {
    list = list.filter((item) => item.category === currentCategory);
  }

  // Lọc theo từ khóa
  if (searchKeyword) {
    list = list.filter(
      (item) =>
        item.cmd.toLowerCase().includes(searchKeyword) ||
        item.desc.toLowerCase().includes(searchKeyword)
    );
  }

  // Chia trang
  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = list.slice(start, start + PAGE_SIZE);

  // Không có dữ liệu
  if (pageData.length === 0) {
    ui.tableBody.innerHTML = `<tr><td colspan="3">Không có dữ liệu</td></tr>`;
    return;
  }

  // Hiển thị từng lệnh
  pageData.forEach((item) => {
    ui.tableBody.innerHTML += `
      <tr>
        <td class="cmd-cell"
            data-usage="${item.usage || ""}"
            data-example="${item.example || ""}">
          <code>${item.cmd}</code>
        </td>
        <td>${item.desc}</td>
        <td>
          <button class="copy-btn" data-cmd="${item.cmd}">
            Copy
          </button>
        </td>
      </tr>
    `;
  });

  enableCopy();
  enableRunCommand();

  // Hiển thị phân trang
  renderPagination(totalPages);
}

/* ======================================================
 * COPY LỆNH GIT
 * ====================================================== */
function enableCopy() {
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.onclick = () => {
      navigator.clipboard.writeText(btn.dataset.cmd);
      showToast("Đã copy lệnh Git");
    };
  });
}

/* ======================================================
 * HIỆN THÔNG BÁO NHỎ (TOAST)
 * ====================================================== */
function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");

  setTimeout(() => {
    ui.toast.classList.remove("show");
  }, 1500);
}

/* ======================================================
 * HỖ TRỢ TẠO COMMIT MESSAGE
 * ====================================================== */
function initCommitHelper() {
  ui.commitType.innerHTML = "";

  // Đổ dữ liệu vào dropdown
  commitTemplates.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.type;
    opt.textContent = `${t.type} - ${t.desc[currentLang]}`;
    ui.commitType.appendChild(opt);
  });

  // Copy commit message
  ui.commitCopyBtn.onclick = () => {
    if (!ui.commitDesc.value.trim()) {
      showToast("Vui lòng nhập nội dung commit");
      return;
    }

    const msg = `${ui.commitType.value}: ${ui.commitDesc.value}`;
    navigator.clipboard.writeText(msg);
    showToast("Đã copy commit message");
  };
}

/* ======================================================
 * PHÂN TRANG
 * ====================================================== */
function renderPagination(total) {
  for (let i = 1; i <= total; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";

    btn.onclick = () => {
      currentPage = i;
      renderGitTable();
    };

    ui.pagination.appendChild(btn);
  }
}

function enableRunCommand() {
  document.querySelectorAll(".cmd-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      const command = cell.innerText.trim();

      vscode.postMessage({
        type: "run",
        command,
      });
    });
  });
}
