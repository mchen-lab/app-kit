// Global constants injected via Vite
declare const __APP_VERSION__: string;
declare const __COMMIT_HASH__: string;

// Application version info interface
interface VersionInfo {
  version: string;
  commit: string;
  buildDate: string;
}

// Application status interface
interface StatusInfo {
  status: string;
  uptime: number;
  timestamp: string;
  port?: number | string;
}

// Format uptime in human-readable format
function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
}

// Fetch service status from API
async function fetchStatus(): Promise<StatusInfo | null> {
  try {
    const response = await fetch("/api/status");
    return await response.json();
  } catch {
    return null;
  }
}

// Fetch version info from API
async function fetchVersion(): Promise<VersionInfo | null> {
  try {
    const response = await fetch("/api/version");
    return await response.json();
  } catch {
    return null;
  }
}

// Update UI with status info
function updateStatus(statusEl: Element, uptimeEl: Element, status: StatusInfo | null) {
  if (status) {
    statusEl.textContent = status.status || "Online";
    statusEl.className = "status-value online";
    uptimeEl.textContent = formatUptime(status.uptime);
  } else {
    statusEl.textContent = "Offline";
    statusEl.className = "status-value offline";
  }
}

// Update UI with version info
function updateVersion(versionEl: Element, version: VersionInfo | null) {
  if (version) {
    let text = `${version.version}`;
    if (version.commit) {
      text += ` · ${version.commit.substring(0, 7)}`;
    }
    versionEl.textContent = text;
  } else {
    versionEl.textContent = "Version unavailable";
  }
}

// Initialize the application
export function initApp(container: HTMLElement) {
  container.innerHTML = `
    <div class="app">
      <header class="header">
        <h1>{{PROJECT_NAME_TITLE}}</h1>
        <p class="subtitle">Powered by app-kit</p>
      </header>
      
      <main class="main">
        <div class="status-card">
          <h2>Service Status</h2>
          <div class="status-item">
            <span class="status-label">Status:</span>
            <span id="service-status" class="status-value loading">Loading...</span>
          </div>
          <div class="status-item">
            <span class="status-label">Uptime:</span>
            <span id="service-uptime" class="status-value">-</span>
          </div>
        </div>
        
        <div class="info-card">
          <h2>Quick Links</h2>
          <ul class="links">
            <li><a href="/api/status" target="_blank">API Status</a></li>
            <li><a href="/api/version" target="_blank">Version Info</a></li>
            <li><a href="#" id="open-about">About</a></li>
            <li><a href="/api/settings" target="_blank">Settings</a></li>
          </ul>
        </div>
      </main>
      
      <footer class="footer">
        <div id="version-info" class="version">Loading version...</div>
      </footer>
    </div>
  `;

  // Get elements
  const statusEl = document.getElementById("service-status")!;
  const uptimeEl = document.getElementById("service-uptime")!;
  const versionEl = document.getElementById("version-info")!;

  // Initial fetch
  fetchStatus().then((status) => updateStatus(statusEl, uptimeEl, status));
  fetchVersion().then((version) => updateVersion(versionEl, version));

  // Refresh status every 30 seconds
  setInterval(async () => {
    const status = await fetchStatus();
    updateStatus(statusEl, uptimeEl, status);
  }, 30000);

  // Modal Logic
  const modal = document.getElementById("about-dialog") as HTMLDialogElement;
  const openBtn = document.getElementById("open-about-btn");
  const closeBtn = document.getElementById("close-about");
  const closeBtnFooter = document.getElementById("close-about-btn");
  const modalVersion = document.getElementById("modal-version");
  const modalCommit = document.getElementById("modal-commit");
  const modalPort = document.getElementById("modal-port");
  const modalStatus = document.getElementById("modal-status");

  if (modal && openBtn && closeBtn && closeBtnFooter && modalVersion && modalCommit) {
    // Inject build-time version info
    modalVersion.textContent = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'Local Dev';
    modalCommit.textContent = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'Unknown';

    openBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      
      // Refresh status info when opening modal
      const status = await fetchStatus();
      if (status && modalPort && modalStatus) {
        modalPort.textContent = String(status.port || "unknown");
        modalStatus.textContent = status.status || "ok";
      }

      modal.showModal();
    });

    const closeModal = () => modal.close();
    closeBtn.addEventListener("click", closeModal);
    closeBtnFooter.addEventListener("click", closeModal);

    // Close on backdrop click
    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        modal.close();
      }
    });
  }
}
