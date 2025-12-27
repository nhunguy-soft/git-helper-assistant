/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
/* =========================================================
   IMPORT CÁC THƯ VIỆN CẦN THIẾT
   =========================================================
   - vscode : API để làm extension cho VS Code
   - fs     : đọc file trong máy (HTML, JSON)
   - path   : xử lý đường dẫn cho đúng trên mọi hệ điều hành
*/
const vscode = __importStar(__webpack_require__(1));
const fs = __importStar(__webpack_require__(2));
const path = __importStar(__webpack_require__(3));
/* =========================================================
   HÀM activate
   =========================================================
   👉 Được VS Code gọi khi extension được bật
*/
function activate(context) {
    /* =======================================================
       ĐĂNG KÝ LỆNH CHO EXTENSION
       =======================================================
       - Lệnh này trùng với command trong package.json
       - Khi người dùng bấm lệnh → hàm bên trong sẽ chạy
    */
    const disposable = vscode.commands.registerCommand("git-helper-assistant.showCommands", () => {
        /* ===================================================
           TẠO WEBVIEW (GIAO DIỆN)
           ===================================================
           - Webview giống như một trang web nhỏ trong VS Code
           - enableScripts: true → cho phép chạy JS
        */
        const panel = vscode.window.createWebviewPanel("gitHelper", // ID nội bộ
        "Git Helper Assistant", // Tiêu đề tab
        vscode.ViewColumn.One, // Mở ở cột bên phải
        { enableScripts: true });
        /* ===================================================
           XÁC ĐỊNH ĐƯỜNG DẪN CÁC FILE
           ===================================================
           - media: HTML, CSS, JS
           - data : JSON dữ liệu Git
        */
        const mediaPath = path.join(context.extensionPath, "media");
        const dataPath = path.join(context.extensionPath, "src", "data");
        /* ===================================================
           ĐỌC FILE HTML
           ===================================================
           - index.html là giao diện chính
        */
        let html = fs.readFileSync(path.join(mediaPath, "index.html"), "utf-8");
        /* ===================================================
           TẠO ĐƯỜNG DẪN AN TOÀN CHO CSS & JS
           ===================================================
           - VS Code không cho dùng đường dẫn file trực tiếp
           - Phải chuyển sang webview URI
        */
        const styleUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(mediaPath, "style.css")));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(mediaPath, "script.js")));
        /* ===================================================
           GẮN CSS & JS VÀO HTML
           =================================================== */
        html = html
            .replace("{{styleUri}}", styleUri.toString())
            .replace("{{scriptUri}}", scriptUri.toString());
        panel.webview.html = html;
        /* ===================================================
           ĐỌC DỮ LIỆU JSON
           ===================================================
           - gitCommands.json  : danh sách lệnh Git
           - commitTemplates  : mẫu commit message
        */
        const gitData = JSON.parse(fs.readFileSync(path.join(dataPath, "gitCommands.json"), "utf-8"));
        const commitTemplates = JSON.parse(fs.readFileSync(path.join(dataPath, "commitTemplates.json"), "utf-8"));
        /* ===================================================
           GỬI DỮ LIỆU SANG WEBVIEW
           ===================================================
           - Webview sẽ nhận bằng window.addEventListener("message")
        */
        panel.webview.postMessage({
            type: "init",
            gitData,
            commitTemplates,
        });
        /* ===================================================
           NHẬN MESSAGE TỪ WEBVIEW
           ===================================================
           - Dùng khi webview muốn gọi chức năng VS Code
           - Ví dụ: copy vào clipboard
        */
        panel.webview.onDidReceiveMessage((msg) => {
            // 📋 Copy vào clipboard
            if (msg.type === "copy") {
                vscode.env.clipboard.writeText(msg.text);
                vscode.window.showInformationMessage("✅ Đã copy");
            }
            // 📌 Dán lệnh vào Terminal (KHÔNG tự chạy)
            if (msg.type === "run") {
                let terminal = vscode.window.activeTerminal;
                if (!terminal) {
                    terminal = vscode.window.createTerminal("Git Helper");
                }
                terminal.show();
                // ✅ CHỈ DÁN – KHÔNG ENTER – KHÔNG AUTO RUN
                terminal.sendText(msg.command, false);
            }
        });
    });
    // 🔹 Hàm chạy Git trong Terminal (rất dễ hiểu)
    function runGitCommand(command) {
        let terminal = vscode.window.activeTerminal;
        if (!terminal) {
            terminal = vscode.window.createTerminal("Git Helper");
        }
        terminal.show();
        terminal.sendText(command);
    }
    /* =======================================================
       ĐĂNG KÝ LỆNH VÀO VÒNG ĐỜI EXTENSION
       ======================================================= */
    context.subscriptions.push(disposable);
}
/* =========================================================
   HÀM deactivate
   =========================================================
   - Được gọi khi extension bị tắt
   - Hiện tại không cần xử lý gì
*/
function deactivate() { }


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("path");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map