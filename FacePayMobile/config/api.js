// API Configuration
// Update this based on your setup:
// - For Android Emulator: use 10.0.2.2
// - For Physical Device on same WiFi: use your machine's IP (run 'ipconfig' in terminal)
// - For iOS Simulator: use localhost or 127.0.0.1

const API_CONFIG = {
  // Change this to match your setup
  USE_EMULATOR: false, // Set to false if using physical device
  
  // For physical device, update this with your machine's actual IP
  PHYSICAL_DEVICE_IP: '192.168.1.52',
  
  // Port where backend is running
  PORT: 3000
};

// Automatically select the correct URL
const API_URL = API_CONFIG.USE_EMULATOR 
  ? `http://10.0.2.2:${API_CONFIG.PORT}/api`
  : `http://${API_CONFIG.PHYSICAL_DEVICE_IP}:${API_CONFIG.PORT}/api`;

export default API_URL;
