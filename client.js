/**
 * dsh-backup-btn — client entry (standalone version)
 * 
 * Features:
 * - Floating backup button (bottom-right FAB)
 * - Built-in GitHub Gist API (no dshmarket dependency)
 * - First-run setup wizard (gist ID + token configuration)
 * - Status toast notifications
 * 
 * Config storage: localStorage (configurable via future .credentials.yaml)
 */
window.__ModuleLoader__.load({
  id: 'dsh-backup-btn',
  factory: (require) => {
    const FAB_ID = 'dsh-backup-fab'
    const MODAL_ID = 'dsh-backup-modal'
    const STORAGE_KEY = 'dsh-backup-config'
    
    const DEFAULT_CONFIG = {
      gistId: '',
      token: '',
      autoBackup: false,
    }

    // ============ STYLES ============
    const CSS = `
@keyframes dshBackupPulse {
  0%,100% { box-shadow: 0 4px 16px rgba(79,110,247,0.35); }
  50%       { box-shadow: 0 4px 24px rgba(79,110,247,0.6); }
}
#${FAB_ID} {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg,#4f6ef7 0%,#6d7ff5 50%,#7c3aed 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(79,110,247,0.35);
  transition: transform 0.15s, box-shadow 0.15s;
  animation: dshBackupPulse 3s ease-in-out infinite;
}
#${FAB_ID}:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 22px rgba(79,110,247,0.55);
}
#${FAB_ID}:active { transform: scale(0.95); }
#${FAB_ID}.running {
  background: linear-gradient(135deg,#6d7ff5,#7c3aed);
  animation: none;
}
#${FAB_ID}.ok {
  background: linear-gradient(135deg,#16a34a,#22c55e);
  animation: none;
}
#${FAB_ID} svg { width:22px; height:22px; pointer-events: none; }
@keyframes dshBackupSpin {
  to { transform: rotate(360deg); }
}
.spin { animation: dshBackupSpin 0.7s linear infinite; }

/* Modal styles */
#${MODAL_ID} {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
#${MODAL_ID} .modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
#${MODAL_ID} h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #1f2328;
}
#${MODAL_ID} .field {
  margin-bottom: 16px;
}
#${MODAL_ID} label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #57606a;
  margin-bottom: 6px;
}
#${MODAL_ID} input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  font-size: 14px;
  font-family: -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;
  box-sizing: border-box;
}
#${MODAL_ID} input:focus {
  outline: none;
  border-color: #4f6ef7;
  box-shadow: 0 0 0 3px rgba(79,110,247,0.15);
}
#${MODAL_ID} .hint {
  font-size: 12px;
  color: #8b949e;
  margin-top: 4px;
}
#${MODAL_ID} .actions {
  display: flex;
  gap: 8px;
  margin-top: 20px;
}
#${MODAL_ID} button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
#${MODAL_ID} .btn-cancel {
  background: #f6f8fa;
  color: #57606a;
}
#${MODAL_ID} .btn-cancel:hover {
  background: #f3f4f6;
}
#${MODAL_ID} .btn-save {
  background: #4f6ef7;
  color: #fff;
}
#${MODAL_ID} .btn-save:hover {
  background: #3b5bdb;
}
#${MODAL_ID} .btn-save:disabled {
  background: #a0a0a0;
  cursor: not-allowed;
}
`

    // ============ HELPERS ============
    function loadConfig() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
      } catch (e) {
        console.error('[dsh-backup-btn] Failed to load config:', e)
      }
      return { ...DEFAULT_CONFIG }
    }

    function saveConfig(cfg) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
      } catch (e) {
        console.error('[dsh-backup-btn] Failed to save config:', e)
      }
    }

    function renderSVG() {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="16,16 12,12 8,16"/>
  <line x1="12" y1="12" x2="12" y2="21"/>
  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
</svg>`
    }

    function renderSpinnerSVG() {
      return `<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
  <circle cx="12" cy="12" r="10" opacity="0.3"/>
  <path d="M12 2a10 10 0 0 1 10 10"/>
</svg>`
    }

    function renderCheckSVG() {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20,6 9,17 4,12"/>
</svg>`
    }

    function showToast(msg, duration = 3000) {
      const existing = document.getElementById('dsh-backup-toast')
      if (existing) existing.remove()

      const toast = document.createElement('div')
      toast.id = 'dsh-backup-toast'
      Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '99999',
        background: 'rgba(31,35,40,0.95)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '10px',
        fontSize: '13px',
        fontFamily: '-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
      })
      toast.textContent = msg
      document.body.appendChild(toast)
      setTimeout(() => {
        toast.style.opacity = '0'
        setTimeout(() => toast.remove(), 300)
      }, duration)
    }

    // ============ MODAL ============
    function showSetupModal(cfg, onSave, onCancel) {
      if (document.getElementById(MODAL_ID)) return

      const style = document.createElement('style')
      style.textContent = CSS
      document.head.appendChild(style)

      const modal = document.createElement('div')
      modal.id = MODAL_ID
      modal.innerHTML = `
        <div class="modal-content">
          <h3>🔧 配置 DSH 备份</h3>
          <div class="field">
            <label>GitHub Gist ID</label>
            <input type="text" id="dsh-backup-gist-id" placeholder="留空则新建 Gist" value="${cfg.gistId || ''}">
            <div class="hint">留空自动创建新 Gist，或填写已有 Gist ID</div>
          </div>
          <div class="field">
            <label>GitHub Personal Access Token</label>
            <input type="password" id="dsh-backup-token" placeholder="ghp_xxxx..." value="${cfg.token || ''}">
            <div class="hint">需要 gist 权限，<a href="https://github.com/settings/tokens/new?scopes=gist&description=DSH%20Backup" target="_blank">点击创建</a></div>
          </div>
          <div class="actions">
            <button class="btn-cancel">取消</button>
            <button class="btn-save">保存</button>
          </div>
        </div>
      `
      document.body.appendChild(modal)

      const gistInput = modal.querySelector('#dsh-backup-gist-id')
      const tokenInput = modal.querySelector('#dsh-backup-token')
      const cancelBtn = modal.querySelector('.btn-cancel')
      const saveBtn = modal.querySelector('.btn-save')

      cancelBtn.addEventListener('click', () => {
        modal.remove()
        if (onCancel) onCancel()
      })

      saveBtn.addEventListener('click', () => {
        const newCfg = {
          ...cfg,
          gistId: gistInput.value.trim(),
          token: tokenInput.value.trim(),
        }
        if (!newCfg.token) {
          showToast('❌ Token 不能为空')
          return
        }
        saveConfig(newCfg)
        modal.remove()
        if (onSave) onSave(newCfg)
      })
    }

    // ============ GITHUB API ============
    async function createGist(token, content) {
      const resp = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'DSH Backup - ' + new Date().toISOString().split('T')[0],
          public: false,
          files: {
            'dsh-backup.json': {
              content: JSON.stringify(content, null, 2),
            },
          },
        }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.message || `HTTP ${resp.status}`)
      }
      const data = await resp.json()
      return data.id
    }

    async function updateGist(gistId, token, content) {
      const resp = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'dsh-backup.json': {
              content: JSON.stringify(content, null, 2),
            },
          },
        }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.message || `HTTP ${resp.status}`)
      }
    }

    // ============ BACKUP ============
    async function collectBackupData() {
      // Collect from DSH internal APIs (sessions, settings, etc.)
      // For now, collect localStorage + basic metadata
      const data = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        localStorage: {},
      }
      
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          // Skip sensitive keys
          if (key.includes('token') || key.includes('secret') || key.includes('key')) continue
          data.localStorage[key] = localStorage.getItem(key)
        }
      } catch (e) {
        console.error('[dsh-backup-btn] Failed to collect localStorage:', e)
      }
      
      return data
    }

    async function handleBackup() {
      const btn = document.getElementById(FAB_ID)
      if (!btn || btn.classList.contains('running')) return

      let cfg = loadConfig()
      
      // Show setup modal if not configured
      if (!cfg.token) {
        showSetupModal(cfg, (newCfg) => {
          cfg = newCfg
          // Retry backup after configuration
          setTimeout(() => handleBackup(), 100)
        })
        return
      }

      btn.className = 'running'
      btn.innerHTML = renderSpinnerSVG()
      btn.disabled = true

      try {
        const data = await collectBackupData()
        
        let gistId = cfg.gistId
        if (!gistId) {
          // Create new gist
          gistId = await createGist(cfg.token, data)
          // Save gistId for future use
          cfg.gistId = gistId
          saveConfig(cfg)
          showToast(`✅ 已创建新 Gist: ${gistId}`)
        } else {
          // Update existing gist
          await updateGist(gistId, cfg.token, data)
        }

        btn.className = 'ok'
        btn.innerHTML = renderCheckSVG()
        btn.title = '备份成功！'
        showToast(`✅ 备份成功！Gist: ${gistId}`)
        setTimeout(resetBtn, 3000)
      } catch (e) {
        btn.className = ''
        btn.innerHTML = renderSVG()
        showToast('❌ 备份失败: ' + String(e && e.message ? e.message : e))
        setTimeout(resetBtn, 4000)
      }
    }

    function resetBtn() {
      const btn = document.getElementById(FAB_ID)
      if (!btn) return
      btn.className = ''
      btn.innerHTML = renderSVG()
      btn.title = '备份到 GitHub Gist'
      btn.disabled = false
    }

    // ============ MOUNT ============
    function mountFAB() {
      if (document.getElementById(FAB_ID)) return
      if (!document.body) { document.addEventListener('DOMContentLoaded', mountFAB); return }

      const style = document.createElement('style')
      style.textContent = CSS
      document.head.appendChild(style)

      const btn = document.createElement('button')
      btn.id = FAB_ID
      btn.title = '备份到 GitHub Gist'
      btn.innerHTML = renderSVG()
      btn.setAttribute('aria-label', '备份')
      document.body.appendChild(btn)

      btn.addEventListener('click', handleBackup)
    }

    // Mount when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountFAB)
    } else {
      mountFAB()
    }

    // Re-mount if DSH replaces the body (navigation / session switch)
    const observer = new MutationObserver(() => {
      if (!document.getElementById(FAB_ID)) mountFAB()
    })
    if (document.body) observer.observe(document.body, { childList: true, subtree: false })

    const exports = {}
    exports.name = 'dsh-backup-btn'
    exports.apply = () => {}
    return exports
  },
})
