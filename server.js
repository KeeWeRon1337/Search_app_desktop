const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Путь к файлу, где будут храниться активации
const ACTIVATION_FILE = path.join(__dirname, 'activations.json');

// Загрузка ключей из файла keys.txt
const KEY_FILE = path.join(__dirname, 'keys.txt');

let validKeys = [];

function loadKeys() {
  try {
    const raw = fs.readFileSync(KEY_FILE, 'utf-8');
    validKeys = raw
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    console.log(`🔑 Загружено ключей: ${validKeys.length}`);
  } catch (err) {
    console.error('❌ Не удалось загрузить keys.txt:', err.message);
    validKeys = [];
  }
}

// Первичная загрузка
loadKeys();

// Автообновление ключей при изменении файла
fs.watchFile(KEY_FILE, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log('🔄 Обнаружено изменение keys.txt, перезагружаем ключи...');
    loadKeys();
  }
});


// Загружаем при старте
loadKeys();


// Загрузка или создание файла активаций
let activations = {};
if (fs.existsSync(ACTIVATION_FILE)) {
  try {
    activations = JSON.parse(fs.readFileSync(ACTIVATION_FILE, 'utf-8'));
  } catch (err) {
    console.error('Ошибка чтения activations.json:', err.message);
  }
}

// Сохраняем активации в файл
function saveActivations() {
  fs.writeFileSync(ACTIVATION_FILE, JSON.stringify(activations, null, 2), 'utf-8');
}

// 🌐 Корневой маршрут — чтобы проверить, что сервер жив
app.get('/', (req, res) => {
  res.send('🔐 Сервер активации работает!');
});

// 📋 Список всех активаций (удалить после отладки!)
app.get('/debug/activations', (req, res) => {
  res.json(activations);
});

// 🚀 Активация ключа
app.post('/activate', (req, res) => {
  const { key, device } = req.body;

  if (!key || !device) {
    return res.status(400).json({ success: false, message: 'Отсутствует ключ или ID устройства' });
  }

  if (!validKeys.includes(key)) {
    return res.status(403).json({ success: false, message: 'Неверный ключ' });
  }

  // Проверка: уже ли активирован этот ключ на другом устройстве
  const alreadyUsedOnAnotherDevice = Object.entries(activations).some(
    ([id, usedKey]) => usedKey === key && id !== device
  );

  if (alreadyUsedOnAnotherDevice) {
    return res.status(403).json({ success: false, message: 'Ключ уже используется на другом устройстве' });
  }

  // Если уже активирован этим устройством — считаем успешным
  if (activations[device] === key) {
    return res.json({ success: true, message: 'Ключ уже активирован на этом устройстве' });
  }

  // ✅ Привязываем ключ к устройству
  activations[device] = key;
  saveActivations();

  console.log(`✅ Ключ ${key} активирован для устройства ${device}`);
  return res.json({ success: true, message: 'Активация успешна' });
});

// 🛠 Запуск сервера
app.listen(PORT, () => {
  console.log(`🔧 Сервер запущен на порту ${PORT}`);
});
