// --- Değişkenler ---
const prevDayBtn = document.getElementById('prev-day-btn');
const nextDayBtn = document.getElementById('next-day-btn');
const currentDateEl = document.getElementById('current-date');
const menuContentEl = document.getElementById('menu-content');
const skeletonLoader = document.getElementById('skeleton-loader');
const menuImageContainer = document.getElementById('menu-image-container');
const menuImage = document.getElementById('menu-image');
const actionButtons = document.getElementById('action-buttons');
const shareBtn = document.getElementById('share-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const dateListPopup = document.getElementById('date-list-popup');
const menuTypeButton = document.getElementById('menu-type-button');
const menuTypeButtonText = document.getElementById('menu-type-button-text');
const lunchHoursEl = document.getElementById('lunch-hours');
const dinnerHoursEl = document.getElementById('dinner-hours');

// Fiyat Popup
const priceToggleBtn = document.getElementById('price-toggle-btn');
const pricePopupOverlay = document.getElementById('price-popup-overlay');
const pricePopupCloseBtn = document.getElementById('price-popup-close');
const priceListBody = document.getElementById('price-list-body');

// Trileçe Popup
const trileceBtn = document.getElementById('trilece-btn');
const trilecePopupOverlay = document.getElementById('trilece-popup-overlay');
const trilecePopupCloseBtn = document.getElementById('trilece-popup-close');
const trileceResultContent = document.getElementById('trilece-result-content');

// --- JSON BAĞLANTILARI ESKİ HALİNE DÖNDÜ (GitHub Raw Linkleri) ---
const lunchJsonUrl = 'https://raw.githubusercontent.com/uniyemek/yemeklistesi/main/yemek.json';
const dinnerJsonUrl = 'https://raw.githubusercontent.com/uniyemek/yemeklistesi/main/yemek_aksam.json';

const priceData = [
    {"label": "Öğrenci (Öğle Yemeği)", "value": "₺40"},
    {"label": "Öğrenci (Akşam Yemeği)", "value": "₺80"},
    {"label": "Öğretim Üyesi (Prof, Doç, Dr. Öğr. Üyesi)", "value": "₺110"},
    {"label": "Diğer Akademik Personel (Arş. Gör, Öğr. Gör)", "value": "₺85"},
    {"label": "Memur, Hizmetli", "value": "₺60"},
    {"label": "İşçi, Sürekli İşçi", "value": "₺260,87"},
    {"label": "Misafir", "value": "₺261"}
];

let lunchMenuData = [];
let dinnerMenuData = [];
let currentMenuType = 'lunch';
let currentDate = new Date();
let displayDate = new Date();
let todayFormatted = '';
let menuStartDate = null;
let menuEndDate = null;
let currentMenuDataForShare = null;

// --- Tema ve Yardımcı Fonksiyonlar ---
const htmlElement = document.documentElement;
function applyTheme(theme) {
    const isDark = theme === 'dark';
    htmlElement.classList.toggle('dark', isDark);
    if (typeof lucide !== 'undefined') setTimeout(() => lucide.createIcons(), 50);
}
function initializeTheme() {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(storedTheme || (prefersDark ? 'dark' : 'light'));
}
function handleThemeToggle() {
    const isDark = htmlElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}
function formatDisplayDate(date) {
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const weekdayOptions = { weekday: 'long' };
    return `${date.toLocaleDateString('tr-TR', dateOptions)}<br><span class="text-sm font-normal">${date.toLocaleDateString('tr-TR', weekdayOptions)}</span>`;
}
function parseDateString(dateString) {
    if (!dateString || !/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) return null;
    const parts = dateString.split('.');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

// --- Menü Gösterim Fonksiyonu ---
function displayMenu(date) {
    displayDate = new Date(date);
    const formattedDate = formatDate(displayDate);
    currentDateEl.innerHTML = formatDisplayDate(displayDate);
    updateNavigationButtons();
    if (menuTypeButtonText) menuTypeButtonText.textContent = currentMenuType === 'lunch' ? 'Öğle Yemeği Menüsü' : 'Akşam Yemeği Menüsü';

    const dataToUse = currentMenuType === 'lunch' ? lunchMenuData : dinnerMenuData;
    const menu = dataToUse.find(item => item.tarih === formattedDate);
    
    currentMenuDataForShare = menu;

    lunchHoursEl.classList.toggle('hidden', currentMenuType !== 'lunch');
    dinnerHoursEl.classList.toggle('hidden', currentMenuType !== 'dinner');
    menuImageContainer.classList.add('hidden');
    actionButtons.classList.add('hidden');

    // Hafta Sonu Kontrolü
    if (currentMenuType === 'lunch' && isWeekend(displayDate)) {
        menuContentEl.innerHTML = `<div class="text-center p-4"><i data-lucide="calendar-off" class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-2"></i><h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">Hafta Sonu</h3><p class="text-gray-500 dark:text-gray-400 mt-1">Öğle yemeği için hafta sonu hizmeti verilmemektedir.</p></div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        const statusContainer = document.getElementById('status-container');
        if (statusContainer) statusContainer.classList.add('hidden');
        return;
    }

    if (menu) {
        actionButtons.classList.remove('hidden');
        
        const isSpecialDay = (menu.corba && (menu.corba.toLowerCase().includes('bayramı'))) || (menu.ana_yemek && menu.ana_yemek.toLowerCase() === "resmi tatil");

        if (isSpecialDay) {
            let emoji = '🎉';
            const corbaLower = (menu.corba || '').toLowerCase();
            if (corbaLower.includes('ramazan')) emoji = '🍬';
            else if (corbaLower.includes('kurban')) emoji = '🐑';
            else if (menu.ana_yemek === "Resmi Tatil" && (corbaLower.includes('mayıs') || corbaLower.includes('nisan'))) emoji = '🇹🇷';

            menuContentEl.innerHTML = `<div class="text-center p-4"><span class="text-4xl mb-2 inline-block">${emoji}</span><h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">${menu.corba || 'Tatil'}</h3><p class="text-gray-500 dark:text-gray-400 mt-1">${menu.yardimci_yemek || 'Mutlu Bayramlar!'}</p></div>`;
        } else {
            let menuHtml = `<ul class="space-y-2 text-left w-full text-gray-800 dark:text-gray-200">`;
            const items = [ 
                { key: 'corba', icon: 'soup', color: 'orange-500', label: 'Çorba' }, 
                { key: 'ana_yemek', icon: 'beef', color: 'red-600', label: 'Ana Yemek' }, 
                { key: 'yardimci_yemek', icon: 'salad', color: 'green-600', label: 'Yardımcı Yemek' }, 
                { key: 'ek', icon: 'cake-slice', color: 'purple-500', label: 'Ek' } 
            ];
            
            items.forEach(itemInfo => {
                const itemValue = menu[itemInfo.key] || '-';
                const textLower = itemValue.toString().toLowerCase();
                
                // VURGULAMA MANTIĞI (Trileçe, Lovebombing, Ghosting)
                let highlightClass = '';
                let extraEmoji = '';

                if (textLower.includes('trileçe')) {
                    highlightClass = 'trilece-highlight';
                } else if (textLower.includes('lovebombing')) {
                    highlightClass = 'lovebombing-highlight';
                    extraEmoji = ' <span class="text-red-500 text-lg">❤️</span>';
                } else if (textLower.includes('ghosting') || textLower.includes('gosting')) {
                    highlightClass = 'ghosting-highlight';
                    extraEmoji = ' <span class="text-gray-800 dark:text-gray-200 text-lg">🖤</span>';
                }

                menuHtml += `<li class="menu-item flex items-start ${highlightClass}"><i data-lucide="${itemInfo.icon}" class="text-${itemInfo.color} mr-2 mt-1 flex-shrink-0"></i><div class="flex-grow"><strong>${itemInfo.label}:</strong> ${itemValue}${extraEmoji}</div></li>`;
            });

            if (currentMenuType === 'lunch' && menu.toplam_kalori) {
                menuHtml += `<li class="menu-item flex items-start"><i data-lucide="flame" class="text-yellow-500 mr-2 mt-1 flex-shrink-0"></i><div class="flex-grow"><strong>Toplam Kalori:</strong> ${menu.toplam_kalori}</div></li>`;
            }
            menuHtml += `</ul>`;
            menuContentEl.innerHTML = menuHtml;

            // Görsel Gösterimi (Saat 09:00 sonrası)
            const currentHour = new Date().getHours();
            if (currentMenuType === 'lunch' && formattedDate === todayFormatted && currentHour >= 9 && currentHour < 23) {
                menuImage.src = "https://sksbasvuru.ankara.edu.tr/kayit/moduller/yemeklistesi/resim.php?v=" + new Date().getTime();
                menuImageContainer.classList.remove('hidden');
            }
        }
        updateStatus();
    } else {
        menuContentEl.innerHTML = `<div class="text-center p-4"><i data-lucide="search-slash" class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-2"></i><h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">Menü Bulunamadı</h3><p class="text-gray-500 dark:text-gray-400 mt-1">Bu tarih için liste mevcut değil.</p></div>`;
        const statusContainer = document.getElementById('status-container');
        if (statusContainer) statusContainer.classList.add('hidden');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- Durum Çubuğu ve Geri Sayım ---
function updateStatus() {
    const statusContainer = document.getElementById('status-container');
    const statusText = document.getElementById('status-text');
    const statusTimer = document.getElementById('status-timer');
    const statusBar = document.getElementById('status-bar');

    if (!statusContainer) return;

    if (formatDate(displayDate) !== todayFormatted) {
        statusContainer.classList.add('hidden');
        return;
    }

    statusContainer.classList.remove('hidden');
    
    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentTimeMinutes = currentH * 60 + currentM;

    const lunchStart = 11 * 60;      // 11:00
    const lunchEnd = 14 * 60;        // 14:00
    const dinnerStart = 18 * 60;     // 18:00
    const dinnerEnd = 20 * 60;       // 20:00

    let text = "";
    let timeStr = "";
    let percent = 0;
    let colorClass = "bg-indigo-600";

    if (currentTimeMinutes >= lunchStart && currentTimeMinutes < lunchEnd) {
        const totalDuration = lunchEnd - lunchStart;
        const elapsed = currentTimeMinutes - lunchStart;
        const remaining = lunchEnd - currentTimeMinutes;
        percent = (elapsed / totalDuration) * 100;
        text = "Öğle yemeği servisi devam ediyor";
        timeStr = `${Math.floor(remaining / 60)}s ${remaining % 60}dk kaldı`;
        colorClass = "bg-green-500";
    } 
    else if (currentTimeMinutes >= dinnerStart && currentTimeMinutes < dinnerEnd) {
        const totalDuration = dinnerEnd - dinnerStart;
        const elapsed = currentTimeMinutes - dinnerStart;
        const remaining = dinnerEnd - currentTimeMinutes;
        percent = (elapsed / totalDuration) * 100;
        text = "Akşam yemeği servisi devam ediyor";
        timeStr = `${Math.floor(remaining / 60)}s ${remaining % 60}dk kaldı`;
        colorClass = "bg-green-500";
    }
    else if (currentTimeMinutes < lunchStart) {
        const remaining = lunchStart - currentTimeMinutes;
        text = "Öğle yemeğinin başlamasına";
        timeStr = `${Math.floor(remaining / 60)}s ${remaining % 60}dk var`;
        percent = 0;
        colorClass = "bg-yellow-500";
    }
    else if (currentTimeMinutes >= lunchEnd && currentTimeMinutes < dinnerStart) {
        const remaining = dinnerStart - currentTimeMinutes;
        text = "Akşam yemeğinin başlamasına";
        timeStr = `${Math.floor(remaining / 60)}s ${remaining % 60}dk var`;
        percent = 0;
        colorClass = "bg-yellow-500";
    }
    else {
        text = "Yemek servisi kapandı";
        timeStr = "Yarın görüşmek üzere 👋";
        percent = 100;
        colorClass = "bg-gray-400";
    }

    statusText.textContent = text;
    statusTimer.textContent = timeStr;
    statusBar.style.width = `${percent}%`;
    statusBar.className = `h-2.5 rounded-full transition-all duration-1000 ease-linear ${colorClass}`;
}

// --- Diğer Fonksiyonlar ---
function showPreviousDay() {
    if (menuStartDate && displayDate <= menuStartDate) return;
    displayDate.setDate(displayDate.getDate() - 1);
    displayMenu(displayDate);
}
function showNextDay() {
    if (menuEndDate && displayDate >= menuEndDate) return;
    displayDate.setDate(displayDate.getDate() + 1);
    displayMenu(displayDate);
}
function updateNavigationButtons() {
    const start = lunchMenuData.length > 0 ? parseDateString(lunchMenuData[0].tarih) : null;
    const end = lunchMenuData.length > 0 ? parseDateString(lunchMenuData[lunchMenuData.length - 1].tarih) : null;
    prevDayBtn.disabled = (start && displayDate <= start);
    nextDayBtn.disabled = (end && displayDate >= end);
    if (menuTypeButton) menuTypeButton.disabled = false;
}
function shareMenu() {
    if (!currentMenuDataForShare) return;
    const dateStr = displayDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
    const typeStr = currentMenuType === 'lunch' ? 'Öğle' : 'Akşam';
    
    let text = `📅 *AÜ Yemek Listesi (${dateStr}) - ${typeStr}*\n\n`;
    text += `🍲 Çorba: ${currentMenuDataForShare.corba || '-'}\n`;
    text += `🍖 Ana Yemek: ${currentMenuDataForShare.ana_yemek || '-'}\n`;
    text += `🥗 Y. Yemek: ${currentMenuDataForShare.yardimci_yemek || '-'}\n`;
    text += `🍰 Ek: ${currentMenuDataForShare.ek || '-'}\n`;
    if(currentMenuDataForShare.toplam_kalori) text += `🔥 Kalori: ${currentMenuDataForShare.toplam_kalori}\n`;
    text += `\nAfiyet olsun!`;

    navigator.clipboard.writeText(text).then(() => {
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-green-500"></i> Kopyalandı!`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => { shareBtn.innerHTML = originalText; if (typeof lucide !== 'undefined') lucide.createIcons(); }, 2000);
    }).catch(err => console.error('Kopyalama hatası:', err));
}
function findNextTrilece() {
    const today = new Date();
    today.setHours(0,0,0,0);

    const findInMenu = (data) => {
        return data.find(item => {
            const date = parseDateString(item.tarih);
            const text = (item.ek || '') + (item.ana_yemek || '') + (item.yardimci_yemek || '');
            return date >= today && text.toLowerCase().includes('trileçe');
        });
    };

    const nextLunch = findInMenu(lunchMenuData);
    const nextDinner = findInMenu(dinnerMenuData);

    let html = '';
    html += '<div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700/50 mb-3">';
    html += '<h4 class="font-bold text-yellow-800 dark:text-yellow-400 mb-1">Öğle Yemeği</h4>';
    if (nextLunch) {
        html += `<p class="text-2xl font-bold text-gray-800 dark:text-gray-100">${nextLunch.tarih}</p>`;
        const dateObj = parseDateString(nextLunch.tarih);
        html += `<p class="text-sm text-gray-600 dark:text-gray-400">${dateObj.toLocaleDateString('tr-TR', {weekday:'long'})}</p>`;
    } else {
        html += '<p class="text-sm text-gray-500">Yakın zamanda listede yok.</p>';
    }
    html += '</div>';

    html += '<div class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-700/50">';
    html += '<h4 class="font-bold text-indigo-800 dark:text-indigo-400 mb-1">Akşam Yemeği</h4>';
    if (nextDinner) {
        html += `<p class="text-2xl font-bold text-gray-800 dark:text-gray-100">${nextDinner.tarih}</p>`;
        const dateObj = parseDateString(nextDinner.tarih);
        html += `<p class="text-sm text-gray-600 dark:text-gray-400">${dateObj.toLocaleDateString('tr-TR', {weekday:'long'})}</p>`;
    } else {
        html += '<p class="text-sm text-gray-500">Yakın zamanda listede yok.</p>';
    }
    html += '</div>';

    trileceResultContent.innerHTML = html;
    trilecePopupOverlay.classList.remove('hidden');
}

// --- Listeleme ve UI ---
function populateDateList() {
    const dataForList = lunchMenuData;
    if (!dataForList || dataForList.length === 0) {
       dateListPopup.innerHTML = '<div class="p-2 text-center text-sm text-gray-500 dark:text-gray-400">Tarih yok</div>';
       return;
   }
   let listHtml = '<ul class="py-1">';
   dataForList.forEach(item => {
       const dateObj = parseDateString(item.tarih);
       if (dateObj) {
           const formattedDisplay = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });
           const isToday = item.tarih === todayFormatted;
           listHtml += `<li><button data-date="${item.tarih}" class="date-list-item block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 ${isToday ? 'font-semibold' : ''}">${formattedDisplay} ${isToday ? '(*)' : ''}</button></li>`;
       }
   });
   listHtml += '</ul>';
   dateListPopup.innerHTML = listHtml;
   const dateItems = dateListPopup.querySelectorAll('.date-list-item');
   dateItems.forEach(item => {
       item.addEventListener('click', (event) => {
           const selectedDateStr = event.currentTarget.getAttribute('data-date');
           const selectedDate = parseDateString(selectedDateStr);
           if (selectedDate) { displayMenu(selectedDate); }
           dateListPopup.classList.add('hidden');
       });
   });
}
function toggleDateListPopup() {
    dateListPopup.classList.toggle('hidden');
    if (!dateListPopup.classList.contains('hidden')) {
        setTimeout(() => { document.addEventListener('click', closePopupOnClickOutside, { once: true }); }, 0);
    }
}
function closePopupOnClickOutside(event) {
    if (!dateListPopup.contains(event.target) && !currentDateEl.contains(event.target)) {
       dateListPopup.classList.add('hidden');
   } else {
        if (!dateListPopup.classList.contains('hidden')) { document.addEventListener('click', closePopupOnClickOutside, { once: true }); }
   }
}
function handleMenuTypeToggle() {
    currentMenuType = (currentMenuType === 'lunch') ? 'dinner' : 'lunch';
    if (menuTypeButton) menuTypeButton.classList.toggle('dinner-mode', currentMenuType === 'dinner');
    if (menuTypeButtonText) menuTypeButtonText.textContent = currentMenuType === 'lunch' ? '   Öğle Yemeği Menüsü' : 'Akşam Yemeği Menüsü';
    displayMenu(displayDate);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
function populatePriceList() {
    priceListBody.innerHTML = '';
    priceData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700';
        row.innerHTML = `<td class="px-4 py-3 text-gray-700 dark:text-gray-200">${item.label}</td><td class="px-4 py-3 font-medium text-gray-900 dark:text-white text-right">${item.value}</td>`;
        priceListBody.appendChild(row);
    });
}

// --- Başlangıç ---
async function initializeApp() {
    todayFormatted = formatDate(currentDate);

    skeletonLoader.classList.remove('hidden');
    menuContentEl.classList.add('hidden');

    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    if ((currentHour > 16 || (currentHour === 16 && currentMinute >= 30)) && currentHour < 21) {
        currentMenuType = 'dinner';
    } else {
        currentMenuType = 'lunch';
    }
    if (menuTypeButton) menuTypeButton.classList.toggle('dinner-mode', currentMenuType === 'dinner');

    try {
        const [lunchResponse, dinnerResponse] = await Promise.all([
            fetch(lunchJsonUrl).catch(e => null),
            fetch(dinnerJsonUrl).catch(e => null)
        ]);

        if (lunchResponse?.ok) lunchMenuData = await lunchResponse.json();
        if (dinnerResponse?.ok) dinnerMenuData = await dinnerResponse.json();
        else dinnerMenuData = [];

        skeletonLoader.classList.add('hidden');
        menuContentEl.classList.remove('hidden');

        if (lunchMenuData && lunchMenuData.length > 0) {
            menuStartDate = parseDateString(lunchMenuData[0].tarih);
            menuEndDate = parseDateString(lunchMenuData[lunchMenuData.length - 1].tarih);
            populateDateList();
            
            const todayMenuLunch = lunchMenuData.find(item => item.tarih === todayFormatted);
            const isTodayInRange = menuStartDate && menuEndDate && currentDate >= menuStartDate && currentDate <= menuEndDate;
            
            let initialDateToShow = menuStartDate;
            if (todayMenuLunch || isTodayInRange) initialDateToShow = currentDate;
            
            displayMenu(initialDateToShow);
        } else {
            menuContentEl.innerHTML = '<p class="text-red-500 dark:text-red-400">Veri bulunamadı.</p>';
        }
    } catch (error) {
        console.error(error);
        skeletonLoader.classList.add('hidden');
        menuContentEl.classList.remove('hidden');
        menuContentEl.innerHTML = `<p class="text-red-500">Liste yüklenemedi.</p>`;
    }

    populatePriceList();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    updateStatus();
    setInterval(updateStatus, 60000);
}

// --- Klavye Kısayolları ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        pricePopupOverlay.classList.add('hidden');
        trilecePopupOverlay.classList.add('hidden');
        dateListPopup.classList.add('hidden');
        return;
    }

    const isAnyPopupOpen = !pricePopupOverlay.classList.contains('hidden') || 
                           !trilecePopupOverlay.classList.contains('hidden') || 
                           !dateListPopup.classList.contains('hidden');

    if (!isAnyPopupOpen) {
        if (e.key === 'ArrowLeft') {
            showPreviousDay();
        } else if (e.key === 'ArrowRight') {
            showNextDay();
        } else if (e.key === 'ArrowUp') {
            if (currentMenuType === 'dinner') handleMenuTypeToggle();
        } else if (e.key === 'ArrowDown') {
            if (currentMenuType === 'lunch') handleMenuTypeToggle();
        }
    }
});

// --- Event Listeners ---
prevDayBtn.addEventListener('click', showPreviousDay);
nextDayBtn.addEventListener('click', showNextDay);
themeToggleBtn.addEventListener('click', handleThemeToggle);
currentDateEl.addEventListener('click', toggleDateListPopup);
if (menuTypeButton) menuTypeButton.addEventListener('click', handleMenuTypeToggle);
priceToggleBtn.addEventListener('click', () => { pricePopupOverlay.classList.remove('hidden'); });
pricePopupCloseBtn.addEventListener('click', () => { pricePopupOverlay.classList.add('hidden'); });
pricePopupOverlay.addEventListener('click', (e) => { if(e.target === pricePopupOverlay) pricePopupOverlay.classList.add('hidden'); });
trileceBtn.addEventListener('click', findNextTrilece);
trilecePopupCloseBtn.addEventListener('click', () => { trilecePopupOverlay.classList.add('hidden'); });
trilecePopupOverlay.addEventListener('click', (e) => { if(e.target === trilecePopupOverlay) trilecePopupOverlay.classList.add('hidden'); });
shareBtn.addEventListener('click', shareMenu);

initializeTheme();
document.addEventListener('DOMContentLoaded', initializeApp);
