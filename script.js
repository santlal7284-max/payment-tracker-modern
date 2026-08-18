// LocalStorage Global Data Struct
let appData = JSON.parse(localStorage.getItem('smartFinanceData')) || {
  creditCards: [],
  sips: [],
  schoolFees: [],
  recharges: [],
  history: []
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  renderAllTables();
  calculateDashboard();
  checkDueDatesAndNotify();

  // Handle Enable Notification Button
  const notifBtn = document.getElementById('enableNotificationsBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', requestNotificationPermission);
  }
});

// Register Service Worker for PWA & Offline Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker Registered Successfully', reg))
      .catch(err => console.log('Service Worker Registration Failed', err));
  });
}

// Request Push Notification Permission
function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("यह ब्राउज़र ऑटोमैटिक पुश नोटिफिकेशन को सपोर्ट नहीं करता है।");
    return;
  }

  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      alert('🔔 App Notifications Enabled! अब ड्यू डेट पास आने पर ऐप अलर्ट भेजेगा।');
      checkDueDatesAndNotify();
    } else {
      alert('Notification Permission Denied');
    }
  });
}

// Tab Switcher
function openTab(evt, tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  evt.currentTarget.classList.add('active');
}

// Save Data and Refresh UI
function saveData() {
  localStorage.setItem('smartFinanceData', JSON.stringify(appData));
  renderAllTables();
  calculateDashboard();
}

// Check Due Dates and Trigger Pure Push Notifications
function checkDueDatesAndNotify() {
  if (Notification.permission !== 'granted') return;

  const today = new Date().toISOString().split('T')[0];

  const checkItems = (items, categoryName) => {
    items.forEach(item => {
      if (item.status !== 'Paid' && item.dueDate) {
        const diffDays = Math.ceil((new Date(item.dueDate) - new Date(today)) / (1000 * 60 * 60 * 24));

        // Trigger Alert if due today or in the next 2 days
        if (diffDays <= 2 && diffDays >= 0) {
          const titleText = `⏰ Payment Due Alert!`;
          const bodyText = `${item.name || item.type || categoryName} का ₹${item.fullDue || item.amount} बकाया है (Due: ${item.dueDate})`;

          new Notification(titleText, {
            body: bodyText,
            icon: 'https://cdn-icons-png.flaticon.com/512/2838/2838838.png'
          });
        }
      }
    });
  };

  checkItems(appData.creditCards, 'Credit Card');
  checkItems(appData.sips, 'SIP');
  checkItems(appData.schoolFees, 'School Fee');
  checkItems(appData.recharges, 'Recharge');
}

// Form Event Listeners
document.getElementById('creditCardForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  appData.creditCards.push({
    id: Date.now(),
    name: document.getElementById('cardName').value,
    lastDigits: document.getElementById('cardLastDigits').value,
    minDue: Number(document.getElementById('minDue').value),
    fullDue: Number(document.getElementById('fullDue').value),
    dueDate: document.getElementById('cardDueDate').value,
    status: 'Pending'
  });
  saveData();
  e.target.reset();
});

document.getElementById('sipForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  appData.sips.push({
    id: Date.now(),
    name: document.getElementById('sipFundName').value,
    folio: document.getElementById('folioNumber').value,
    amount: Number(document.getElementById('sipAmount').value),
    dueDate: document.getElementById('sipDueDate').value,
    frequency: document.getElementById('sipFrequency').value,
    status: 'Pending'
  });
  saveData();
  e.target.reset();
});

document.getElementById('schoolFeeForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  appData.schoolFees.push({
    id: Date.now(),
    childName: document.getElementById('childName').value,
    schoolName: document.getElementById('schoolName').value,
    amount: Number(document.getElementById('feeAmount').value),
    dueDate: document.getElementById('feeDueDate').value,
    status: 'Pending'
  });
  saveData();
  e.target.reset();
});

document.getElementById('rechargeForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  appData.recharges.push({
    id: Date.now(),
    type: document.getElementById('rechargeType').value,
    provider: document.getElementById('serviceProvider').value,
    amount: Number(document.getElementById('rechargeAmount').value),
    dueDate: document.getElementById('rechargeDueDate').value,
    status: 'Pending'
  });
  saveData();
  e.target.reset();
});

document.getElementById('manualPaymentForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  appData.history.push({
    id: Date.now(),
    title: document.getElementById('paymentTitle').value,
    amount: Number(document.getElementById('paidAmount').value),
    date: document.getElementById('paymentDate').value,
    notes: document.getElementById('paymentNotes').value
  });
  saveData();
  e.target.reset();
});

// Render Dynamic Tables
function renderAllTables() {
  const today = new Date().toISOString().split('T')[0];

  // Credit Card Table
  const ccBody = document.getElementById('creditCardBody');
  if (ccBody) {
    ccBody.innerHTML = '';
    appData.creditCards.forEach((card, index) => {
      let rowClass = card.status === 'Paid' ? 'status-paid' : (card.dueDate < today ? 'status-overdue' : 'status-upcoming');
      ccBody.innerHTML += `
        <tr class="${rowClass}">
          <td>${card.name}</td>
          <td>**** ${card.lastDigits}</td>
          <td>₹${card.minDue}</td>
          <td>₹${card.fullDue}</td>
          <td>${card.dueDate}</td>
          <td>${card.status}</td>
          <td>
            <button class="btn-action-paid" onclick="markPaid('creditCards', ${index})">Paid</button>
            <button class="btn-action-delete" onclick="deleteItem('creditCards', ${index})">❌</button>
          </td>
        </tr>`;
    });
  }

  // SIP Table
  const sipBody = document.getElementById('sipBody');
  if (sipBody) {
    sipBody.innerHTML = '';
    appData.sips.forEach((sip, index) => {
      let rowClass = sip.status === 'Paid' ? 'status-paid' : (sip.dueDate < today ? 'status-overdue' : 'status-upcoming');
      sipBody.innerHTML += `
        <tr class="${rowClass}">
          <td>${sip.name}</td>
          <td>${sip.folio || 'N/A'}</td>
          <td>₹${sip.amount}</td>
          <td>${sip.dueDate}</td>
          <td>${sip.frequency}</td>
          <td>${sip.status}</td>
          <td>
            <button class="btn-action-paid" onclick="markPaid('sips', ${index})">Paid</button>
            <button class="btn-action-delete" onclick="deleteItem('sips', ${index})">❌</button>
          </td>
        </tr>`;
    });
  }

  // School Fee Table
  const schoolBody = document.getElementById('schoolFeeBody');
  if (schoolBody) {
    schoolBody.innerHTML = '';
    appData.schoolFees.forEach((fee, index) => {
      let rowClass = fee.status === 'Paid' ? 'status-paid' : (fee.dueDate < today ? 'status-overdue' : 'status-upcoming');
      schoolBody.innerHTML += `
        <tr class="${rowClass}">
          <td>${fee.childName}</td>
          <td>${fee.schoolName || 'N/A'}</td>
          <td>₹${fee.amount}</td>
          <td>${fee.dueDate}</td>
          <td>${fee.status}</td>
          <td>
            <button class="btn-action-paid" onclick="markPaid('schoolFees', ${index})">Paid</button>
            <button class="btn-action-delete" onclick="deleteItem('schoolFees', ${index})">❌</button>
          </td>
        </tr>`;
    });
  }

  // Recharge Table
  const rechargeBody = document.getElementById('rechargeBody');
  if (rechargeBody) {
    rechargeBody.innerHTML = '';
    appData.recharges.forEach((item, index) => {
      let rowClass = item.status === 'Paid' ? 'status-paid' : (item.dueDate < today ? 'status-overdue' : 'status-upcoming');
      rechargeBody.innerHTML += `
        <tr class="${rowClass}">
          <td>${item.type}</td>
          <td>${item.provider}</td>
          <td>₹${item.amount}</td>
          <td>${item.dueDate}</td>
          <td>${item.status}</td>
          <td>
            <button class="btn-action-paid" onclick="markPaid('recharges', ${index})">Paid</button>
            <button class="btn-action-delete" onclick="deleteItem('recharges', ${index})">❌</button>
          </td>
        </tr>`;
    });
  }

  // History Table
  const historyBody = document.getElementById('historyBody');
  if (historyBody) {
    historyBody.innerHTML = '';
    appData.history.forEach((hist, index) => {
      historyBody.innerHTML += `
        <tr>
          <td>${hist.title}</td>
          <td>₹${hist.amount}</td>
          <td>${hist.date}</td>
          <td>${hist.notes || '-'}</td>
          <td>
            <button class="btn-action-delete" onclick="deleteItem('history', ${index})">❌</button>
          </td>
        </tr>`;
    });
  }
}

// Helper Functions
function markPaid(category, index) {
  const item = appData[category][index];
  item.status = 'Paid';
  appData.history.push({
    title: item.name || item.childName || item.type || category,
    amount: item.fullDue || item.amount,
    date: new Date().toISOString().split('T')[0],
    notes: 'Marked Paid'
  });
  saveData();
}

function deleteItem(category, index) {
  appData[category].splice(index, 1);
  saveData();
}

function calculateDashboard() {
  let minDue = appData.creditCards.reduce((acc, cur) => cur.status !== 'Paid' ? acc + cur.minDue : acc, 0);
  let fullDue = appData.creditCards.reduce((acc, cur) => cur.status !== 'Paid' ? acc + cur.fullDue : acc, 0);
  let sipTotal = appData.sips.reduce((acc, cur) => cur.status !== 'Paid' ? acc + cur.amount : acc, 0);
  let paidTotal = appData.history.reduce((acc, cur) => acc + cur.amount, 0);

  document.getElementById('totalMinDue').innerText = `₹${minDue}`;
  document.getElementById('totalFullDue').innerText = `₹${fullDue}`;
  document.getElementById('totalSip').innerText = `₹${sipTotal}`;
  document.getElementById('totalPaid').innerText = `₹${paidTotal}`;
}

// Data Import / Export
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `finance_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importData(event) {
  const reader = new FileReader();
  reader.onload = (e) => {
    appData = JSON.parse(e.target.result);
    saveData();
    alert('Data imported successfully!');
  };
  reader.readAsText(event.target.files[0]);
}