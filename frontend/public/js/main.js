const socket = io();
let currentProcess = null;
let currentView = 'chart';
let chartUpdateInterval;
const UPDATE_INTERVAL = 1000;
let dial;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dial
    dial = new Dial('dialCanvas');
    
    // Set Run Chart as default view
    switchView('chart');
    
    // Start generator by default
    const generatorToggle = document.getElementById('generatorToggle');
    generatorToggle.checked = true;
    toggleGenerator();

    // Select Process A by default
    selectProcess('Process A');
});

function selectProcess(processName) {
    console.log('Selecting process:', processName); // Debug log
    
    // Stop existing updates
    if (chartUpdateInterval) {
        clearInterval(chartUpdateInterval);
    }

    // Update current process
    currentProcess = processName;
    
    // Update UI elements
    document.getElementById('currentProcess').textContent = processName;
    
    // Clear existing data
    document.getElementById('measurementsBody').innerHTML = '';
    document.getElementById('chart').src = '';
    resetStatistics();
    
    // Update tab styling
    const processTabs = document.querySelectorAll('.process-tabs .tab-btn');
    processTabs.forEach(tab => {
        if (tab.textContent === processName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Start new updates
    updateData();
    chartUpdateInterval = setInterval(updateData, UPDATE_INTERVAL);
}

// Add error handling utility
function handleFetchError(error, context) {
    console.error(`Error in ${context}:`, error);
    // You could add UI feedback here
}

async function updateData() {
    if (!currentProcess) {
        console.log('No process selected');
        return;
    }
    
    console.log('Updating data for:', currentProcess);
    
    try {
        // Fetch latest measurements
        const measurementsResponse = await fetch(
            `http://localhost:5000/api/measurements/${encodeURIComponent(currentProcess)}`
        );
        if (!measurementsResponse.ok) {
            throw new Error(`HTTP error! status: ${measurementsResponse.status}`);
        }
        const measurementsData = await measurementsResponse.json();
        
        if (measurementsData.status === 'success') {
            console.log('Received measurements:', measurementsData.data);
            updateMeasurementsTable(measurementsData.data);
            updateStatistics(measurementsData.data);
            
            // Update dial if it's the current view
            if (currentView === 'dial' && measurementsData.data.length > 0) {
                const latest = measurementsData.data[measurementsData.data.length - 1];
                dial.draw(
                    latest.measurement_value,
                    latest.specification_lower,
                    latest.specification_upper
                );
            }
        }
        
        // Update chart if it's the current view
        if (currentView === 'chart') {
            const chartResponse = await fetch(
                `http://localhost:5000/api/charts/control/${encodeURIComponent(currentProcess)}`
            );
            if (!chartResponse.ok) {
                throw new Error(`HTTP error! status: ${chartResponse.status}`);
            }
            const chartData = await chartResponse.json();
            
            if (chartData.status === 'success' && chartData.data.chart) {
                document.getElementById('chart').src = 'data:image/png;base64,' + chartData.data.chart;
            }
        }
    } catch (error) {
        handleFetchError(error, 'updateData');
    }
}

function switchView(view) {
    currentView = view;
    
    // Update view visibility
    document.getElementById('dialView').classList.toggle('active', view === 'dial');
    document.getElementById('chartView').classList.toggle('active', view === 'chart');
    
    // Update tab styling
    document.querySelectorAll('.viz-tabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(view));
    });
    
    // Update data for the current view
    updateData();
}

async function toggleGenerator() {
    const toggle = document.getElementById('generatorToggle');
    const statusText = document.getElementById('generatorStatus');
    
    try {
        const action = toggle.checked ? 'start' : 'stop';
        console.log(`Attempting to ${action} generator`);
        
        const response = await fetch(`http://localhost:5000/api/generator/${action}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Generator response:', data);
        
        if (data.status === 'success') {
            statusText.textContent = `Generator: ${toggle.checked ? 'On' : 'Off'}`;
        } else {
            console.error('Generator toggle failed:', data);
            toggle.checked = !toggle.checked;
            statusText.textContent = `Generator: ${toggle.checked ? 'On' : 'Off'}`;
        }
    } catch (error) {
        handleFetchError(error, 'toggleGenerator');
        toggle.checked = !toggle.checked;
        statusText.textContent = `Generator: ${toggle.checked ? 'On' : 'Off'}`;
    }
}

function updateMeasurementsTable(measurements) {
    const tbody = document.getElementById('measurementsBody');
    tbody.innerHTML = '';
    
    measurements.slice(-10).reverse().forEach(m => {
        const row = document.createElement('tr');
        const timestamp = new Date(m.timestamp).toLocaleTimeString();
        const status = evaluateStatus(m.measurement_value, m.specification_lower, m.specification_upper);
        
        row.innerHTML = `
            <td>${timestamp}</td>
            <td>${m.measurement_value.toFixed(2)}</td>
            <td>${m.specification_lower.toFixed(2)}</td>
            <td>${m.specification_upper.toFixed(2)}</td>
            <td class="${status}">${status.toUpperCase()}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateStatistics(measurements) {
    if (measurements.length === 0) {
        resetStatistics();
        return;
    }

    const values = measurements.map(m => m.measurement_value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    
    const latest = measurements[measurements.length - 1];
    const range = latest.specification_upper - latest.specification_lower;
    const cp = range / (6 * stdDev);
    const cpk = Math.min(
        (latest.specification_upper - mean) / (3 * stdDev),
        (mean - latest.specification_lower) / (3 * stdDev)
    );

    document.getElementById('statMean').textContent = mean.toFixed(2);
    document.getElementById('statStdDev').textContent = stdDev.toFixed(2);
    document.getElementById('statCp').textContent = cp.toFixed(2);
    document.getElementById('statCpk').textContent = cpk.toFixed(2);
    
    updateStatisticColors(mean, stdDev, cp, cpk);
}

function evaluateStatus(value, lower, upper) {
    if (value < lower) return 'critical';
    if (value > upper) return 'critical';
    
    const range = upper - lower;
    const target = (upper + lower) / 2;
    const deviation = Math.abs(value - target);
    const ratio = deviation / (range / 2);
    
    if (ratio <= 0.5) return 'good';
    if (ratio <= 0.75) return 'warning';
    return 'critical';
}

function resetStatistics() {
    document.getElementById('statMean').textContent = '-';
    document.getElementById('statStdDev').textContent = '-';
    document.getElementById('statCp').textContent = '-';
    document.getElementById('statCpk').textContent = '-';
}

function updateStatisticColors(mean, stdDev, cp, cpk) {
    const meanElement = document.getElementById('statMean');
    const stdDevElement = document.getElementById('statStdDev');
    const cpElement = document.getElementById('statCp');
    const cpkElement = document.getElementById('statCpk');
    
    // Mean: Green if within ±1%, Yellow if within ±2%, Red otherwise
    const meanStatus = evaluateStatus(mean, 98, 102);
    meanElement.className = `stat-value ${meanStatus}`;
    setTextColor(meanElement, meanStatus);

    // StdDev: Green if < 3, Yellow if < 4, Red otherwise
    let stdDevStatus = 'good';
    if (stdDev > 4) stdDevStatus = 'critical';
    else if (stdDev > 3) stdDevStatus = 'warning';
    stdDevElement.className = `stat-value ${stdDevStatus}`;
    setTextColor(stdDevElement, stdDevStatus);

    // Cp and Cpk: Green if > 1.33, Yellow if > 1, Red otherwise
    const cpStatus = evaluateCapabilityIndex(cp);
    const cpkStatus = evaluateCapabilityIndex(cpk);
    
    cpElement.className = `stat-value ${cpStatus}`;
    cpkElement.className = `stat-value ${cpkStatus}`;
    
    setTextColor(cpElement, cpStatus);
    setTextColor(cpkElement, cpkStatus);
}

function setTextColor(element, status) {
    switch(status) {
        case 'good':
            element.style.backgroundColor = '#4CAF50';
            element.style.color = '#fff';
            break;
        case 'warning':
            element.style.backgroundColor = '#FFA500';
            element.style.color = '#000';
            break;
        case 'critical':
            element.style.backgroundColor = '#FF0000';
            element.style.color = '#fff';
            break;
        default:
            element.style.backgroundColor = '';
            element.style.color = '';
    }
}

function evaluateCapabilityIndex(value) {
    if (value >= 1.33) return 'good';
    if (value >= 1.0) return 'warning';
    return 'critical';
}