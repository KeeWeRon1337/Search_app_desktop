const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const ACTIVATIONS_PATH = path.join(__dirname, 'activations.json');
const KEYS_PATH = path.join(__dirname, 'keys.txt');

// Загружаем использованные ключи
function loadUsed() {
  if (fs.existsSync(ACTIVATIONS_PATH)) {
    return JSON.parse(fs.readFileSync(ACTIVATIONS_PATH));
  }
  return {};
}

function saveUsed(data) {
  fs.writeFileSync(ACTIVATIONS_PATH, JSON.stringify(data, null, 2));
}

// 📌 ЭТО ГЛАВНЫЙ РАУТ, который ожидает Electron-приложение
app.post('/activate', (req, res) => {
  const { key, device } = req.body;
  console.log('🔑 Запрос активации:', key, '📟', device);

  if (!key || !device) return res.json({ success: false });

  const allKeys = fs.readFileSync(KEYS_PATH, 'utf-8')
    .split('\n').map(k => k.trim()).filter(Boolean);

  const used = loadUsed();

  if (!allKeys.includes(key)) return res.json({ success: false });
  if (Object.values(used).includes(key)) return res.json({ success: false });

  used[device] = key;
  saveUsed(used);

  res.json({ success: true });
});

// Для теста GET /
app.get('/', (req, res) => res.send('🟢 Server is running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер слушает порт ${PORT}`));
