// js/analytics.js

let activeAnalyticsTab = 'day';

function switchAnalyticsTab(tab) {
    activeAnalyticsTab = tab;
    const dayPanel = document.getElementById('dayAnalyticsPanel');
    const monthlyPanel = document.getElementById('monthlyAnalyticsPanel');
    const yearlyPanel = document.getElementById('yearlyAnalyticsPanel');

    const dayBtn = document.getElementById('tabDayBtn');
    const monthBtn = document.getElementById('tabMonthlyBtn');
    const yearBtn = document.getElementById('tabYearlyBtn');

    dayPanel.style.display = 'none';
    monthlyPanel.style.display = 'none';
    yearlyPanel.style.display = 'none';
    dayBtn.className = 'btn btn-outline';
    monthBtn.className = 'btn btn-outline';
    yearBtn.className = 'btn btn-outline';

    if (tab === 'day') {
        dayPanel.style.display = 'block';
        dayBtn.className = 'btn';
        renderDayChart();
    } else if (tab === 'monthly') {
        monthlyPanel.style.display = 'block';
        monthBtn.className = 'btn';
        renderMonthlyChart();
    } else {
        yearlyPanel.style.display = 'block';
        yearBtn.className = 'btn';
        initYearPicker();
    }
}

function initAnalyticsView() {
    const today = new Date().toISOString().split('T')[0];
    const analyticsDayPicker = document.getElementById('analyticsDayPicker');
    if (analyticsDayPicker && !analyticsDayPicker.value) analyticsDayPicker.value = today;

    const monthPicker = document.getElementById('monthPicker');
    if (monthPicker && !monthPicker.value) monthPicker.value = today.substring(0, 7);

    switchAnalyticsTab(activeAnalyticsTab);
}

async function renderDayChart() {
    const container = document.getElementById('dayChartContainer');
    container.innerHTML = '';

    const selectedDate = document.getElementById('analyticsDayPicker').value;
    const profile = await getCurrentUserFamilyProfile();
    if (!profile?.family_id) return;

    const { data: expenses } = await _supabase
        .from('expenses')
        .select('*')
        .eq('family_id', profile.family_id)
        .eq('date', selectedDate);

    if (!expenses || expenses.length === 0) {
        renderTotalSpentBadge(container, 0, `Total Spent on ${selectedDate}`);
        container.insertAdjacentHTML('beforeend', `<p style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No family expenses recorded for ${selectedDate}.</p>`);
        return;
    }

    const categoryData = {};
    let totalAmount = 0;
    expenses.forEach(exp => {
        const amt = parseFloat(exp.amount || 0);
        categoryData[exp.category] = (categoryData[exp.category] || 0) + amt;
        totalAmount += amt;
    });

    // Insert Total Spent display at top
    renderTotalSpentBadge(container, totalAmount, `Total Spent on ${selectedDate}`);

    const maxVal = Math.max(...Object.values(categoryData), 1);
    Object.keys(categoryData).sort().forEach(cat => {
        const val = categoryData[cat];
        const barWidthPercent = (val / maxVal) * 100;
        const percentOfTotal = totalAmount > 0 ? ((val / totalAmount) * 100).toFixed(1) : '0.0';
        appendBar(container, cat, val, barWidthPercent, percentOfTotal);
    });
}

async function renderMonthlyChart() {
    const container = document.getElementById('monthlyChartContainer');
    container.innerHTML = '';

    const selectedMonth = document.getElementById('monthPicker').value; // e.g. "2026-07"
    const profile = await getCurrentUserFamilyProfile();
    if (!profile?.family_id) return;

    // Calculate end of month dynamically
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const lastDay = new Date(year, month, 0).getDate();

    const { data: expenses } = await _supabase
        .from('expenses')
        .select('*')
        .eq('family_id', profile.family_id)
        .gte('date', `${selectedMonth}-01`)
        .lte('date', `${selectedMonth}-${lastDay}`);

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    const labelText = `Total Spent in ${monthName} ${year}`;

    if (!expenses || expenses.length === 0) {
        renderTotalSpentBadge(container, 0, labelText);
        container.insertAdjacentHTML('beforeend', `<p style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No family expenses found for ${monthName} ${year}.</p>`);
        return;
    }

    const categoryData = {};
    let totalAmount = 0;
    expenses.forEach(exp => {
        const amt = parseFloat(exp.amount || 0);
        categoryData[exp.category] = (categoryData[exp.category] || 0) + amt;
        totalAmount += amt;
    });

    // Insert Total Spent display at top
    renderTotalSpentBadge(container, totalAmount, labelText);

    const maxVal = Math.max(...Object.values(categoryData), 1);
    Object.keys(categoryData).sort().forEach(cat => {
        const val = categoryData[cat];
        const barWidthPercent = (val / maxVal) * 100;
        const percentOfTotal = totalAmount > 0 ? ((val / totalAmount) * 100).toFixed(1) : '0.0';
        const catExpenses = expenses.filter(e => e.category === cat);
        appendMonthlyBar(container, cat, val, barWidthPercent, percentOfTotal, catExpenses);
    });
}

async function initYearPicker() {
    const yearPicker = document.getElementById('yearPicker');
    const profile = await getCurrentUserFamilyProfile();
    if (!profile?.family_id) return;

    const { data: expenses } = await _supabase.from('expenses').select('date').eq('family_id', profile.family_id);

    const years = new Set();
    const currentYearStr = new Date().getFullYear().toString();
    years.add(currentYearStr);

    if (expenses) {
        expenses.forEach(exp => {
            if (exp.date) years.add(exp.date.substring(0, 4));
        });
    }

    const sortedYears = Array.from(years).sort().reverse();
    yearPicker.innerHTML = '';
    sortedYears.forEach(year => {
        const opt = document.createElement('option');
        opt.value = year;
        opt.textContent = year;
        yearPicker.appendChild(opt);
    });
    yearPicker.value = currentYearStr;

    renderYearlyChart();
}

async function renderYearlyChart() {
    const container = document.getElementById('yearlyChartContainer');
    container.innerHTML = '';

    const selectedYear = document.getElementById('yearPicker').value || new Date().getFullYear().toString();
    const profile = await getCurrentUserFamilyProfile();
    if (!profile?.family_id) return;

    const { data: expenses } = await _supabase
        .from('expenses')
        .select('*')
        .eq('family_id', profile.family_id)
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);

    const labelText = `Total Spent in ${selectedYear}`;

    if (!expenses || expenses.length === 0) {
        renderTotalSpentBadge(container, 0, labelText);
        container.insertAdjacentHTML('beforeend', `<p style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No family expenses found for ${selectedYear}.</p>`);
        return;
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTotals = Array(12).fill(0);
    let totalAmount = 0;

    expenses.forEach(exp => {
        const amt = parseFloat(exp.amount || 0);
        const monthIndex = parseInt(exp.date.substring(5, 7), 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            monthlyTotals[monthIndex] += amt;
            totalAmount += amt;
        }
    });

    // Insert Total Spent display at top
    renderTotalSpentBadge(container, totalAmount, labelText);

    const maxVal = Math.max(...monthlyTotals, 1);
    monthlyTotals.forEach((val, index) => {
        const label = `${monthNames[index]} ${selectedYear}`;
        const barWidthPercent = (val / maxVal) * 100;
        const percentOfTotal = totalAmount > 0 ? ((val / totalAmount) * 100).toFixed(1) : '0.0';
        appendBar(container, label, val, barWidthPercent, percentOfTotal);
    });
}

// Helper to append a prominent Total Spent Card at top of analytics panels
function renderTotalSpentBadge(container, totalVal, label) {
    const badge = document.createElement('div');
    badge.style.cssText = `
        background: rgba(16, 185, 129, 0.1); 
        border: 1px solid var(--emerald); 
        padding: 1rem 1.25rem; 
        border-radius: 0.5rem; 
        text-align: center; 
        margin-bottom: 1.5rem;
    `;
    badge.innerHTML = `
        <span style="font-size: 0.875rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">${label}</span>
        <span style="font-size: 1.75rem; font-weight: 800; color: var(--emerald);">
            Total Spent: Rs. ${totalVal.toFixed(2)}
        </span>
    `;
    container.appendChild(badge);
}

function appendBar(container, label, value, barWidthPercent, percentOfTotal) {
    const wrapper = document.createElement('div');
    wrapper.className = 'bar-wrapper';
    wrapper.innerHTML = `
        <div class="bar-label">
            <span>${label}</span>
            <span>Rs. ${value.toFixed(2)} (${percentOfTotal}%)</span>
        </div>
        <div class="bar-track">
            <div class="bar-fill" style="width: ${barWidthPercent}%;"></div>
        </div>
    `;
    container.appendChild(wrapper);
}

function appendMonthlyBar(container, label, value, barWidthPercent, percentOfTotal, catExpenses) {
    const wrapper = document.createElement('div');
    wrapper.className = 'monthly-bar-wrapper';

    const dropdownId = 'dropdown-' + label.replace(/\s+/g, '-').toLowerCase();

    const sortedEntries = catExpenses
        .filter(e => e.date)
        .sort((a, b) => a.date.localeCompare(b.date));

    let entriesHtml = '';
    if (sortedEntries.length > 0) {
        entriesHtml = sortedEntries.map(exp => {
            const dateStr = new Date(exp.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const desc = exp.description ? `<span class="monthly-entry-desc">${exp.description}</span>` : '';
            return `
                <div class="monthly-entry-row">
                    <span class="monthly-entry-date">${dateStr}</span>
                    ${desc}
                    <span class="monthly-entry-amount">Rs. ${parseFloat(exp.amount || 0).toFixed(2)}</span>
                </div>`;
        }).join('');
    }

    wrapper.innerHTML = `
        <div class="monthly-bar-header bar-label" onclick="toggleMonthlyDropdown('${dropdownId}', this)">
            <span>${label}</span>
            <span style="display:flex;align-items:center;">
                Rs. ${value.toFixed(2)} (${percentOfTotal}%)
                <span class="chevron">&#9660;</span>
            </span>
        </div>
        <div class="bar-track">
            <div class="bar-fill" style="width: ${barWidthPercent}%;"></div>
        </div>
        <div class="monthly-entries-dropdown" id="${dropdownId}">
            ${entriesHtml || '<p style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:0.25rem 0;">No entries</p>'}
        </div>
    `;
    container.appendChild(wrapper);
}

function toggleMonthlyDropdown(dropdownId, headerEl) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    dropdown.classList.toggle('open');
    headerEl.classList.toggle('open');
}

window.switchAnalyticsTab = switchAnalyticsTab;
window.renderDayChart = renderDayChart;
window.renderMonthlyChart = renderMonthlyChart;
window.renderYearlyChart = renderYearlyChart;
window.toggleMonthlyDropdown = toggleMonthlyDropdown;