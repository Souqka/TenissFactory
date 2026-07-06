import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { v4 as uuidv4 } from "uuid";

const initialData = {
  supplies: {
    tape: { yellow: 50, transparent: 50 },
    stretch: 30,
    hooks: 100,
    whitePlastic: 20,
    boxes: 40,
    primer: 15,
    frames: { black: 25, white: 25 },
    plexiglass: 10,
    boards: 30,
  },
  production: {
    cutPlastic: 0,
    primerDrying: 0,
    glueDrying: 0,
    readyFrames: { withPlastic: 0, withLogo: 0 },
    curved: 0,
  },
  assembly: {
    unchecked: { black: 0, white: 0 },
    checked: { black: 0, white: 0 },
    packed: { black: 0, white: 0 },
    shipped: { black: 0, white: 0 },
  },
};

const limits = {
  tape: { min: 10, max: 200 },
  stretch: { min: 5, max: 100 },
  hooks: { min: 20, max: 500 },
  whitePlastic: { min: 5, max: 100 },
  boxes: { min: 10, max: 200 },
  primer: { min: 3, max: 50 },
  frames: { min: 5, max: 100 },
  plexiglass: { min: 3, max: 50 },
  boards: { min: 5, max: 100 },
  cutPlastic: { min: 0, max: 100 },
  primerDrying: { min: 0, max: 50 },
  glueDrying: { min: 0, max: 50 },
  readyFrames: { min: 0, max: 100 },
  curved: { min: 0, max: 50 },
  unchecked: { min: 0, max: 200 },
  checked: { min: 0, max: 200 },
  packed: { min: 0, max: 200 },
  shipped: { min: 0, max: 500 },
};

const predefinedUsers = ["Алексей", "Мария", "Дмитрий", "Елена", "Сергей"];

function App() {
  const [user, setUser] = useState(null);
  const [loginInput, setLoginInput] = useState("");
  const [data, setData] = useState(initialData);
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");

  useEffect(() => {
    const savedUser = localStorage.getItem("productionUser");
    const savedData = localStorage.getItem("productionData");
    const savedHistory = localStorage.getItem("productionHistory");
    const savedDarkMode = localStorage.getItem("darkMode");

    if (savedUser) setUser(savedUser);
    if (savedData) setData(JSON.parse(savedData));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("productionUser", user);
      localStorage.setItem("productionData", JSON.stringify(data));
      localStorage.setItem("productionHistory", JSON.stringify(history));
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [user, data, history, darkMode]);

  const addHistory = (item, oldValue, newValue, action) => {
    const record = {
      id: uuidv4(),
      user,
      item,
      oldValue,
      newValue,
      action,
      timestamp: new Date().toLocaleString("ru-RU"),
    };
    setHistory((prev) => [record, ...prev.slice(0, 99)]);
  };

  const checkLimits = (item, value) => {
    const itemLimits = limits[item];
    if (itemLimits) {
      if (value <= itemLimits.min) {
        toast.warning(`⚠️ ${item}: критически низкий запас (${value} ед.)`);
      } else if (value >= itemLimits.max) {
        toast.warning(
          `⚠️ ${item}: достигнут максимальный лимит (${value} ед.)`
        );
      }
    }
  };

  const updateValue = (path, newValue) => {
    setData((prevData) => {
      const newData = { ...prevData };
      const keys = path.split(".");
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      const oldValue = current[keys[keys.length - 1]];
      current[keys[keys.length - 1]] = Math.max(0, newValue);

      addHistory(path, oldValue, newValue, "изменение");
      checkLimits(path, newValue);

      return newData;
    });
  };

  const getValue = (path) => {
    const keys = path.split(".");
    let current = data;
    for (const key of keys) {
      current = current[key];
    }
    return current;
  };

  const handleLogin = () => {
    if (loginInput.trim()) {
      setUser(loginInput.trim());
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginInput("");
  };

  const getCriticalItems = () => {
    const critical = [];
    Object.keys(limits).forEach((key) => {
      const value = getValue(key);
      if (value <= limits[key].min) {
        critical.push({ item: key, value });
      }
    });
    return critical;
  };

  const ItemControl = ({ path, label, isSubItem = false }) => {
    const value = getValue(path);
    const itemLimits = limits[path] || { min: 0, max: Infinity };
    const isCritical = value <= itemLimits.min;
    const isMaxed = value >= itemLimits.max;

    return (
      <div className={isSubItem ? "sub-item" : "item"}>
        <div className="item-name">
          {label}:{" "}
          <span
            className={
              isCritical ? "critical-low" : isMaxed ? "critical-warning" : ""
            }
          >
            {value}
          </span>
        </div>
        <div className="item-controls">
          <button
            className="btn btn-minus"
            onClick={() => updateValue(path, value - 1)}
          >
            -1
          </button>
          <button
            className="btn btn-minus"
            onClick={() => updateValue(path, value - 10)}
          >
            -10
          </button>
          <input
            type="number"
            className="quantity-input"
            value={value}
            onChange={(e) => updateValue(path, parseInt(e.target.value) || 0)}
            min={0}
          />
          <button
            className="btn btn-plus"
            onClick={() => updateValue(path, value + 1)}
          >
            +1
          </button>
          <button
            className="btn btn-plus"
            onClick={() => updateValue(path, value + 10)}
          >
            +10
          </button>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="login-container" data-theme={darkMode ? "dark" : "light"}>
        <div className="login-card">
          <h1>🏭 Управление производством</h1>
          <input
            type="text"
            className="login-input"
            placeholder="Введите ваше имя..."
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
          />
          <button className="login-btn" onClick={handleLogin}>
            Войти
          </button>

          <div className="existing-users">
            <h3>Или выберите пользователя:</h3>
            <div className="user-chips">
              {predefinedUsers.map((name) => (
                <div
                  key={name}
                  className="user-chip"
                  onClick={() => {
                    setLoginInput(name);
                    setUser(name);
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const criticalItems = getCriticalItems();

  return (
    <div className="app-container" data-theme={darkMode ? "dark" : "light"}>
      <ToastContainer theme={darkMode ? "dark" : "light"} />

      <header className="header">
        <h1>🏭 Система управления производством</h1>
        <div className="header-controls">
          <div className="notification-badge">
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? "☀️ Светлая" : "🌙 Темная"} тема
            </button>
            {criticalItems.length > 0 && (
              <span className="badge">{criticalItems.length}</span>
            )}
          </div>
          <span>{user}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          📦 Запасы и производство
        </button>
        <button
          className={`tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          📋 История изменений
        </button>
        <button
          className={`tab ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          📊 Статистика
        </button>
      </div>

      {activeTab === "inventory" && (
        <>
          <div className="sections-container">
            <div className="section">
              <h2 className="section-title">📦 Отдел 1: Запасы расходников</h2>

              <h3>Скотч</h3>
              <ItemControl
                path="supplies.tape.yellow"
                label="Желтый скотч"
                isSubItem={true}
              />
              <ItemControl
                path="supplies.tape.transparent"
                label="Прозрачный скотч"
                isSubItem={true}
              />

              <ItemControl path="supplies.stretch" label="Стрэйтч" />
              <ItemControl path="supplies.hooks" label="Крючки" />
              <ItemControl
                path="supplies.whitePlastic"
                label="Пластик белый (листы)"
              />
              <ItemControl path="supplies.boxes" label="Коробки" />
              <ItemControl path="supplies.primer" label="Грунт (мешки)" />

              <h3>Рамки</h3>
              <ItemControl
                path="supplies.frames.black"
                label="Черные рамки"
                isSubItem={true}
              />
              <ItemControl
                path="supplies.frames.white"
                label="Белые рамки"
                isSubItem={true}
              />

              <ItemControl path="supplies.plexiglass" label="Оргстекло" />
              <ItemControl path="supplies.boards" label="Доски" />
            </div>

            <div className="section">
              <h2 className="section-title">⚙️ Отдел 2: Производство</h2>
              <ItemControl
                path="production.cutPlastic"
                label="Пластик нарезанный"
              />
              <ItemControl
                path="production.primerDrying"
                label="Сушка грунта"
              />
              <ItemControl
                path="production.glueDrying"
                label="Сушка полей (клей)"
              />
              <ItemControl
                path="production.readyFrames"
                label="Готовые к сборке рамки"
              />
              <ItemControl
                path="production.curved"
                label="Кривые (под давлением)"
              />
            </div>

            <div className="section">
              <h2 className="section-title">
                🔧 Отдел 3: Сборка готовой рамки
              </h2>

              <h3>Собранные непроверенные</h3>
              <ItemControl
                path="assembly.unchecked.black"
                label="Черные"
                isSubItem={true}
              />
              <ItemControl
                path="assembly.unchecked.white"
                label="Белые"
                isSubItem={true}
              />

              <h3>Собранные проверенные</h3>
              <ItemControl
                path="assembly.checked.black"
                label="Черные"
                isSubItem={true}
              />
              <ItemControl
                path="assembly.checked.white"
                label="Белые"
                isSubItem={true}
              />

              <h3>Упакованные с штрих кодом</h3>
              <ItemControl
                path="assembly.packed.black"
                label="Черные"
                isSubItem={true}
              />
              <ItemControl
                path="assembly.packed.white"
                label="Белые"
                isSubItem={true}
              />

              <h3>Отдано</h3>
              <ItemControl
                path="assembly.shipped.black"
                label="Черные"
                isSubItem={true}
              />
              <ItemControl
                path="assembly.shipped.white"
                label="Белые"
                isSubItem={true}
              />
            </div>
          </div>

          {criticalItems.length > 0 && (
            <div
              className="section"
              style={{ borderColor: "var(--danger-red)" }}
            >
              <h3 style={{ color: "var(--danger-red)" }}>
                ⚠️ Критические запасы:
              </h3>
              {criticalItems.map((item) => (
                <div key={item.item} className="critical-low">
                  {item.item}: {item.value} ед. (минимум:{" "}
                  {limits[item.item].min})
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "history" && (
        <div className="history-section">
          <h2 className="section-title">📋 История изменений</h2>
          <div className="history-list">
            {history.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>История пуста</p>
            ) : (
              history.map((record) => (
                <div key={record.id} className="history-item">
                  <strong>{record.timestamp}</strong> - {record.user} изменил(а)
                  "{record.item}":
                  {record.oldValue} → {record.newValue} ({record.action})
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="stats-section">
          <h2 className="section-title">📊 Общая статистика</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Всего рамок в производстве</h4>
              <div className="stat-value">
                {data.assembly.unchecked.black +
                  data.assembly.unchecked.white +
                  data.assembly.checked.black +
                  data.assembly.checked.white +
                  data.assembly.packed.black +
                  data.assembly.packed.white}
              </div>
            </div>

            <div className="stat-card">
              <h4>Отгружено рамок</h4>
              <div className="stat-value">
                {data.assembly.shipped.black + data.assembly.shipped.white}
              </div>
            </div>

            <div className="stat-card">
              <h4>Остаток скотча</h4>
              <div className="stat-value">
                {data.supplies.tape.yellow + data.supplies.tape.transparent}
              </div>
            </div>

            <div className="stat-card">
              <h4>Критических позиций</h4>
              <div
                className="stat-value"
                style={{ color: "var(--danger-red)" }}
              >
                {criticalItems.length}
              </div>
            </div>

            <div className="stat-card">
              <h4>Изменений за сессию</h4>
              <div className="stat-value">{history.length}</div>
            </div>

            <div className="stat-card">
              <h4>Пользователей в системе</h4>
              <div className="stat-value">{predefinedUsers.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
