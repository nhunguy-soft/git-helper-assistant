/* =========================================================
   IMPORT CÁC THƯ VIỆN CẦN THIẾT
   =========================================================
   - vscode : API để làm extension cho VS Code
   - fs     : đọc file trong máy (HTML, JSON)
   - path   : xử lý đường dẫn cho đúng trên mọi hệ điều hành
*/
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/* =========================================================
   HÀM activate
   =========================================================
   👉 Được VS Code gọi khi extension được bật
*/
export function activate(context: vscode.ExtensionContext) {
  /* =======================================================
     ĐĂNG KÝ LỆNH CHO EXTENSION
     =======================================================
     - Lệnh này trùng với command trong package.json
     - Khi người dùng bấm lệnh → hàm bên trong sẽ chạy
  */
  const disposable = vscode.commands.registerCommand(
    "git-helper-assistant.showCommands",
    () => {
      /* ===================================================
         TẠO WEBVIEW (GIAO DIỆN)
         ===================================================
         - Webview giống như một trang web nhỏ trong VS Code
         - enableScripts: true → cho phép chạy JS
      */
      const panel = vscode.window.createWebviewPanel(
        "gitHelper", // ID nội bộ
        "Git Helper Assistant", // Tiêu đề tab
        vscode.ViewColumn.One, // Mở ở cột bên phải
        { enableScripts: true }
      );

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
      const styleUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(mediaPath, "style.css"))
      );

      const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(mediaPath, "script.js"))
      );

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
      const gitData = JSON.parse(
        fs.readFileSync(path.join(dataPath, "gitCommands.json"), "utf-8")
      );

      const commitTemplates = JSON.parse(
        fs.readFileSync(path.join(dataPath, "commitTemplates.json"), "utf-8")
      );

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
    }
  );

  // 🔹 Hàm chạy Git trong Terminal (rất dễ hiểu)
  function runGitCommand(command: string) {
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
export function deactivate() {}
