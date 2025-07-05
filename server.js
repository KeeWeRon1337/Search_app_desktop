const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = './activations.json';

app.use(cors());
app.use(express.json());

let activations = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  : {};

app.post('/activate', (req, res) => {
  const { key, device } = req.body;

  if (!key || !device) {
    return res.status(400).json({ success: false, message: 'Отсутствует ключ или ID устройства' });
  }

  const existingDevice = activations[key];

  if (!existingDevice) {
    activations[key] = device;
    fs.writeFileSync(DB_FILE, JSON.stringify(activations, null, 2));
    return res.json({ success: true });
  }

  if (existingDevice === device) {
    return res.json({ success: true });
  }

  return res.status(403).json({ success: false, message: 'Ключ уже активирован на другом устройстве' });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер активации запущен на http://localhost:${PORT}`);
});
