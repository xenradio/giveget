function getPaymentId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('payment_id');
  }
  
  async function fetchDonationDetails(paymentId) {
    const response = await fetch(`https://xrzc-g8gr-8fko.n7d.xano.io/api:uoqATYAX/donations?payment_id=${paymentId}`); //new workspace
    const data = await response.json();
    return data.result1[0];
  }
  
  // Function to format the date
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  
  // Function to update the HTML with fetched data
  function updateDonationDetails(data) {
    // Update donation date
    const donationDateElement = document.getElementById('donationDate');
    donationDateElement.textContent = formatDate(data.payment_date);
  
    // Update company identifier
    const donationCompanyElement = document.getElementById('donationCompany');
    donationCompanyElement.textContent = data.company_identifier;
  
    // Update user email
    const donationEmailElement = document.getElementById('donationEmail');
    donationEmailElement.textContent = data.user_email;
  
    // Update table with charity names and donation amounts
    const tableBody = document.querySelector('.details-table_body');
    tableBody.innerHTML = ''; // Clear existing rows
  
    let totalAmount = 0;
  
    for (const charity in data) {
      if (charity !== 'payment_id' && charity !== 'payment_date' && charity !== 'total_amount' && charity !== 'user_email' && charity !== 'company_identifier' && charity !== 'donation_ids') {
        const amount = parseFloat(data[charity].replace('A$', ''));
        totalAmount += amount;
  
        const row = document.createElement('tr');
        row.classList.add('char-table_row');
  
        const nameCell = document.createElement('td');
        nameCell.classList.add('char-table_cell');
        nameCell.textContent = charity;
  
        const amountCell = document.createElement('td');
        amountCell.classList.add('char-table_cell', 'is-right');
        amountCell.textContent = `A$${amount.toFixed(2)}`;
  
        row.appendChild(nameCell);
        row.appendChild(amountCell);
        tableBody.appendChild(row);
      }
    }
  
    // Update total amount
    const totalAmountElement = document.getElementById('totalAmount');
    totalAmountElement.textContent = `A$${totalAmount.toFixed(2)}`;
  }
  
  async function init() {
    const paymentId = getPaymentId();
    if (paymentId) {
      const donationDetails = await fetchDonationDetails(paymentId);
      updateDonationDetails(donationDetails);
    } else {
      console.error('Payment ID not found in the URL');
    }
  }
  
  document.addEventListener('DOMContentLoaded', init);
  