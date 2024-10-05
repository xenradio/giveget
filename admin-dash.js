document.addEventListener('DOMContentLoaded', function() {
    const fetchBtn = document.getElementById('fetchBtn');
    fetchBtn.addEventListener('click', async function() {
        const timeFrame = document.getElementById('selectTimeFrame').value;
        const endpoint = 'https://xrzc-g8gr-8fko.n7d.xano.io/api:L5hdWhbB/download'; //new workspace
        const data = await fetchData(endpoint, timeFrame);
        globalData = data; // Store fetched data globally for CSV download
        updateTable(data);
    });

    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.addEventListener('click', function() {
        const csvContent = convertToCSV(globalData);
        downloadCSV(csvContent, 'data_download.csv');
    });
});

async function fetchData(endpoint, timeFrame) {
    try {
        const response = await fetch(`${endpoint}?Date=${encodeURIComponent(timeFrame)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function updateTable(data) {
    const tableBody = document.querySelector('.table_body');
    tableBody.innerHTML = ''; // Clear current table rows

    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'table_row';
        const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        row.innerHTML = `
            <td class="table_cell">${new Date(item.created_at).toLocaleDateString('en-US', dateOptions)}</td>
            <td class="table_cell">${item.company_identifier}</td>
            <td class="table_cell">${item.session_count}</td>
            <td class="table_cell">${item.sessions_completed}</td>
            <td class="table_cell">${formatArray(item.popular_causes)}</td>
            <td class="table_cell">${formatArray(item.popular_activities)}</td>
            <td class="table_cell">${formatCharities(item.suggested_charities)}</td>
            <td class="table_cell">${formatArray(item.popular_donation_methods)}</td>
            <td class="table_cell">A$${item.donation_amount}</td>
        `;
        tableBody.appendChild(row);
    });
}

function formatArray(array) {
    if (!Array.isArray(array) || array.length === 0) {
        console.log('Expected a non-empty array, received:', array);
        return 'N/A';
    }
    return array.map(item => `${item.subcategory} - ${item.count}`).join(', ');
}

function formatCharities(charities) {
    if (!Array.isArray(charities) || charities.length === 0) {
        console.log('Expected a non-empty array of charities, received:', charities);
        return 'N/A';
    }
    return charities.map(charity => `<a href="${charity.url}" target="_blank">${charity.name} - ${charity.count}</a>`).join(', ');
}


function convertToCSV(data) {
    const headers = "Date,Company,Total Sessions,Completed Sessions,Popular Causes,Popular Activities,Suggested Charities,Donation Methods,Donation Amount\n";
    const rows = data.map(item => [
        `"${new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}"`,
        `"${item.company_identifier}"`,
        `"${item.session_count}"`,
        `"${item.sessions_completed}"`,
        `"${formatArrayForCSV(item.popular_causes)}"`,
        `"${formatArrayForCSV(item.popular_activities)}"`,
        `"${formatCharitiesForCSV(item.suggested_charities)}"`,
        `"${formatArrayForCSV(item.popular_donation_methods)}"`,
        `"A$${item.donation_amount}"`
    ].join(',')).join('\n');

    return headers + rows;
}

function formatArrayForCSV(array) {
    if (!Array.isArray(array)) {
        console.error('Expected an array for CSV formatting, received:', array);
        return '';
    }
    return array.map(item => `${item.subcategory} - ${item.count}`).join('; ');
}

function formatCharitiesForCSV(charities) {
    if (!Array.isArray(charities)) {
        console.error('Expected an array of charities for CSV formatting, received:', charities);
        return '';
    }
    return charities.map(charity => `${charity.name} - ${charity.count} [${charity.url}]`).join('; ');
}


function downloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { 
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

//------
//Logout
//------

    const logoutButton = document.querySelector('.logout_button');
    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('company_identifier'); 
    });