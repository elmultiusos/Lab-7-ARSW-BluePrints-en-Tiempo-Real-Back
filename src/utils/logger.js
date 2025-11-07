export const log = {
  info: (msg, data = {}) => console.log(`ℹ️  [INFO] ${msg}`, data),
  success: (msg, data = {}) => console.log(`✅ [SUCCESS] ${msg}`, data),
  error: (msg, data = {}) => console.error(`❌ [ERROR] ${msg}`, data),
  warn: (msg, data = {}) => console.warn(`⚠️  [WARN] ${msg}`, data),
  debug: (msg, data = {}) => console.log(`🔍 [DEBUG] ${msg}`, data),
  socket: (msg, data = {}) => console.log(`🔌 [SOCKET] ${msg}`, data),
  api: (method, path, status, data = {}) => console.log(`📡 [API] ${method} ${path} → ${status}`, data)
};
