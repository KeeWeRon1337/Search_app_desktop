const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const ACTIVATIONS_PATH = path.join(__dirname, 'activations.json');
const KEYS_PATH = path.join(__dirname, 'keys.txt');

// 🛠 Создание activations.json при отсутствии
function ensureActivationsFile() {
  if (!fs.existsSync(ACTIVATIONS_PATH)) {
    fs.writeFileSync(ACTIVATIONS_PATH, '{}', 'utf-8');
    console.log('📁 Файл activations.json создан.');
  }
}

function loadUsed() {
  ensureActivationsFile(); // 👈 добавлено
  return JSON.parse(fs.readFileSync(ACTIVATIONS_PATH));
}

function saveUsed(data) {
  fs.writeFileSync(ACTIVATIONS_PATH, JSON.stringify(data, null, 2));
}

app.post('/activate', (req, res) => {
  const { key, device } = req.body;
  console.log('🔑 Активация:', key, '📟 Устройство:', device);

  if (!key || !device) return res.json({ success: false });

  // Проверяем наличие keys.txt
  if (!fs.existsSync(KEYS_PATH)) {
    return res.json({ success: false, error: 'Keys file not found on server.' });
  }

  const allKeys = fs.readFileSync(KEYS_PATH, 'utf-8')
    .split('\n').map(k => k.trim()).filter(Boolean);

  const used = loadUsed();

  if (!allKeys.includes(key)) return res.json({ success: false, error: 'Key not found' });
  if (Object.values(used).includes(key)) return res.json({ success: false, error: 'Key already used' });

  used[device] = key;
  saveUsed(used);

  res.json({ success: true });
});

app.get('/', (req, res) => res.send('🟢 Server is running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  ensureActivationsFile();
  console.log(`🚀 Сервер слушает порт ${PORT}`);
});
