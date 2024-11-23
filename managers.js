//Save company name in local storage
function setCompanyIdentifier() {
  const maxAttempts = 5;
  let attempts = 0;

  function attemptToSet() {
    const companyIdentifier = document.getElementById("company-name").value;
    if (companyIdentifier) {
      localStorage.setItem("company_identifier", companyIdentifier);
      console.log("Company identifier saved:", companyIdentifier);
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(attemptToSet, 1000);
      console.log("Retrying to find company identifier...");
    } else {
      console.log("Failed to find company identifier after several attempts.");
    }
  }

  attemptToSet();
}
setCompanyIdentifier();

//Generate modal table and Show total amount
document.addEventListener("DOMContentLoaded", function () {
  const donationTotalElement = document.getElementById("donationTotal");
  const donationTableButton = document.getElementById("donationTable");
  const donationTotal2Element = document.getElementById("donationCalc");
  const donationCheckLink = document.getElementById("donationCheck");
  const updateButton = document.getElementById("updateButton");

  donationTotal2Element.textContent = "A$0"; // Initialize to 0

  function fetchDataAndUpdateTotal(totalElement, retries = 5, interval = 1000) {
    const companyIdentifier = localStorage.getItem("company_identifier");
    if (companyIdentifier) {
      const encodedIdentifier = encodeURIComponent(companyIdentifier);
      const membersApiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/members?company_identifier=${encodedIdentifier}`; //new workspace
      const managersApiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:uoqATYAX/managers?company_identifier=${encodedIdentifier}`; //new workspace

      Promise.all([fetch(membersApiUrl), fetch(managersApiUrl)])
        .then((responses) => Promise.all(responses.map((response) => response.json())))
        .then(([membersData, managersData]) => processData(membersData, managersData, totalElement))
        .catch((error) => console.error("Error fetching data: ", error));
    } else if (retries > 0) {
      setTimeout(() => fetchDataAndUpdateTotal(totalElement, retries - 1, interval), interval);
    } else {
      console.error("Failed to retrieve company_identifier from local storage after multiple retries.");
    }
  }

  function processData(membersData, managersData, totalElement) {
    const paidDonationIds = new Set();
    managersData.forEach((manager) => {
      if (manager.payment_status === "paid") {
        manager.donations.forEach((donation) => {
          const ids = donation.donation_ids.split(',').map(id => id.trim());
          ids.forEach(id => paidDonationIds.add(id));
        });
      }
    });

    const charityMap = {};
    let globalTotalDonation = 0;

    membersData.forEach((member) => {
      (member.donated_to || []).flat().forEach((charity) => {
        if (charity && charity.name && charity.amount && !paidDonationIds.has(charity.donation_id)) {
          if (!charityMap[charity.name]) {
            charityMap[charity.name] = {
              donations: [],
              totalDonation: 0,
            };
          }
          charityMap[charity.name].donations.push({
            email: member.email,
            amount: charity.amount,
            donation_id: charity.donation_id // Add donation_id here
          });
          charityMap[charity.name].totalDonation += charity.amount;
          globalTotalDonation += charity.amount;
        }
      });
    });

    if (totalElement === donationTotalElement) {
      totalElement.textContent = `A$${globalTotalDonation}`;
    }

    if (totalElement === donationTotal2Element) {
      updateUI(charityMap);
    }
  }

  function updateUI(charityMap) {
    const donationInfo = document.querySelector(".donation_info");
    donationInfo.innerHTML = ""; // Clear existing content

    Object.entries(charityMap).forEach(([charName, charity]) => {
      const donationRow = document.createElement("div");
      donationRow.classList.add("donation_row");

      let userDonations = charity.donations
        .map((donation) => `${donation.email} - A$${donation.amount} <span class="donation_id">${donation.donation_id}</span>`)
        .join("<br>");

      donationRow.innerHTML = `
        <input type="checkbox" class="donation_checkbox" data-amount="${charity.totalDonation}">
        <div class="donation_char">${charName}</div>
        <div class="donation_user">${userDonations}</div>
        <div class="char_donation-amount">
          <div class="char_donation-number">A$${charity.totalDonation}</div>
          <div class="char_donation-text">Total amount donated</div>
        </div>`;

      donationInfo.appendChild(donationRow);

      donationRow.addEventListener("click", (event) => {
        if (!event.target.classList.contains("donation_checkbox")) {
          const checkbox = donationRow.querySelector(".donation_checkbox");
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event("change")); 
        }
      });
    });

    const checkboxes = donationInfo.querySelectorAll(".donation_checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", updateTotalAmount);
      checkbox.addEventListener("change", function () {
        const modalError = document.querySelector(".modal_error");
        if (document.querySelectorAll(".donation_checkbox:checked").length > 0) {
          modalError.style.display = "none";
        }
      });
    });
  }

  function updateTotalAmount() {
    const donationInfo = document.querySelector(".donation_info");
    const checkboxes = donationInfo.querySelectorAll(".donation_checkbox");
    let totalDonation = 0;

    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        totalDonation += parseFloat(checkbox.dataset.amount);
      }
    });

    donationTotal2Element.textContent = `A$${totalDonation}`;

    const allChecked = Array.from(checkboxes).every(
      (checkbox) => checkbox.checked
    );
    const someChecked = Array.from(checkboxes).some(
      (checkbox) => checkbox.checked
    );

    donationCheckLink.textContent = someChecked ? "Uncheck all" : "Check all";
  }

  function toggleCheckboxes() {
    const donationInfo = document.querySelector(".donation_info");
    const checkboxes = donationInfo.querySelectorAll(".donation_checkbox");
    const someChecked = Array.from(checkboxes).some(
      (checkbox) => checkbox.checked
    );

    checkboxes.forEach((checkbox) => {
      checkbox.checked = someChecked ? false : true;
      checkbox.dispatchEvent(new Event("change"));
    });

    updateTotalAmount();
  }

  fetchDataAndUpdateTotal(donationTotalElement);

  donationTableButton.addEventListener("click", function () {
    fetchDataAndUpdateTotal(donationTotal2Element);
  });

  donationCheckLink.addEventListener("click", toggleCheckboxes);

  updateButton.addEventListener("click", function () {
    fetchDataAndUpdateTotal(donationTotalElement);
    fetchDataAndUpdateTotal(donationTotal2Element);
  });
});

//Charity Table 
document.addEventListener("DOMContentLoaded", function () {
  const updateButton = document.getElementById("updateButton");

  async function fetchData(retries = 5, interval = 1000) {
    const companyIdentifier = localStorage.getItem("company_identifier");
    if (companyIdentifier) {
      const encodedIdentifier = encodeURIComponent(companyIdentifier);
      const membersApiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/members?company_identifier=${encodedIdentifier}`; //new workspcase
      const managersApiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:uoqATYAX/managers?company_identifier=${encodedIdentifier}`; //new workspace

      try {
        const [membersResponse, managersResponse] = await Promise.all([
          fetch(membersApiUrl),
          fetch(managersApiUrl)
        ]);
        const membersData = await membersResponse.json();
        const managersData = await managersResponse.json();

        const paidDonationIds = new Set();

        // Collect all paid donation IDs
        managersData.forEach(manager => {
          if (manager.payment_status === "paid") {
            manager.donations.forEach(donation => {
              const ids = donation.donation_ids.split(',').map(id => id.trim());
              ids.forEach(id => paidDonationIds.add(id));
            });
          }
        });

        processUnpaidDonations(membersData, paidDonationIds);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    } else if (retries > 0) {
      setTimeout(() => fetchData(retries - 1, interval), interval);
    } else {
      console.error("Failed to retrieve company_identifier from local storage after multiple retries.");
    }
  }

  function processUnpaidDonations(membersData, paidDonationIds) {
    const charityMap = {};

    membersData.forEach(member => {
      (member.donated_to || []).flat().forEach(charity => {
        if (charity && charity.name && charity.amount) {
          if (!charityMap[charity.name]) {
            charityMap[charity.name] = {
              link: charity.link || "#",
              logo: charity.logo_url || "https://assets-global.website-files.com/65debf94c45187dc7c67abf2/6630bf08dad504d24be09767_charity_default.svg",
              donations: [],
              totalDonation: 0
            };
          }
          charityMap[charity.name].donations.push({
            name: member.name,
            email: member.email,
            amount: charity.amount,
            donation_id: charity.donation_id
          });
        }
      });
    });

    updateUnpaidUI(charityMap, paidDonationIds);
  }

  function updateUnpaidUI(charityMap, paidDonationIds) {
    const charTable = document.getElementById("charTable");
    charTable.innerHTML = '';

    Object.entries(charityMap).forEach(([charName, charity]) => {
      const unpaidDonations = charity.donations.filter(donation => !paidDonationIds.has(donation.donation_id));
      const currentTotalDonation = unpaidDonations.reduce((total, donation) => total + donation.amount, 0);

      if (unpaidDonations.length > 0) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("char_table-wrapper");
        wrapper.innerHTML = `
          <div class="char_name-wrapper">
            <img loading="lazy" src="${charity.logo}" alt="" class="char_image">
            <a href="${charity.link}" class="char_link w-inline-block" target="_blank">
              <div>${charName}</div>
              <div class="char_link-icon w-embed">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                  <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"></path>
                  <path d="M11 13l9 -9"></path>
                  <path d="M15 4h5v5"></path>
                </svg>
              </div>
            </a>
          </div>
          <table class="char-table_component">
            <thead class="char-table_head">
              <tr class="char-table_row is-ua">
                <th class="char-table_header">Team member name</th>
                <th class="char-table_header">Team member email</th>
                <th class="char-table_header">Amount donated</th>
              </tr>
            </thead>
            <tbody class="char-table_body">
              ${unpaidDonations.map(
                donation => `<tr class="char-table_row is-ua">
                  <td class="char-table_cell">${donation.name} <span class="donation_id">${donation.donation_id}</span></td>
                  <td class="char-table_cell"><a href="mailto:${donation.email}">${donation.email}</a></td>
                  <td class="char-table_cell">A$${donation.amount}</td>
                </tr>`
              ).join("")}
            </tbody>
          </table>
          <div class="char_donation-wrapper">
            <div class="char_donation-amount">
              <div class="char_donation-number">A$${currentTotalDonation}</div>
              <div>Total amount donated</div>
            </div>
            <a href="#" class="button is-managers w-button" style="display: none;">Donate</a>
          </div>`;
        charTable.appendChild(wrapper);
      }
    });
  }

  fetchData();
  updateButton.addEventListener("click", function () {
    fetchData();
  });
});

//History table 
/*document.addEventListener("DOMContentLoaded", function () {
  const updateButton = document.getElementById("updateButton");

  async function fetchData(retries = 5, interval = 1000) {
    let companyIdentifier = localStorage.getItem("company_identifier");
    let attempts = 0;

    while (!companyIdentifier && attempts < retries) {
      await new Promise(resolve => setTimeout(resolve, interval)); // Wait for the interval before retrying
      companyIdentifier = localStorage.getItem("company_identifier");
      attempts++;
    }

    if (companyIdentifier) {
      const encodedIdentifier = encodeURIComponent(companyIdentifier);
      const membersApiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/members?company_identifier=${encodedIdentifier}`; //new workspace
      const managersApiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:uoqATYAX/managers?company_identifier=${encodedIdentifier}`; //new workspace

      try {
        const [membersResponse, managersResponse] = await Promise.all([
          fetch(membersApiUrl),
          fetch(managersApiUrl),
        ]);

        const membersData = await membersResponse.json();
        const managersData = await managersResponse.json();

        processPaidDonations(membersData, managersData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    } else {
      console.error("Failed to retrieve company_identifier from local storage after multiple retries.");
    }
  }

  function processPaidDonations(membersData, managersData) {
    const paidDonationIds = new Set();
    const donationDates = {}; // Store donation dates by donation ID

    // Iterate through each manager to gather paid donation IDs and their corresponding dates
    managersData.forEach(manager => {
      if (manager.payment_status === "paid") {
        manager.donations.forEach(donation => {
          const ids = donation.donation_ids.split(',').map(id => id.trim());
          ids.forEach(id => {
            paidDonationIds.add(id);
            donationDates[id] = donation.payment_date; // Store the payment date by donation ID
          });
        });
      }
    });

    const charityMap = {};

    membersData.forEach(member => {
      (member.donated_to || []).flat().forEach(charity => {
        if (paidDonationIds.has(charity.donation_id)) {
          if (!charityMap[charity.name]) {
            charityMap[charity.name] = {
              donations: [],
              totalDonation: 0,
              logo: charity.logo_url || "https://assets-global.website-files.com/65debf94c45187dc7c67abf2/6630bf08dad504d24be09767_charity_default.svg",
            };
          }
          charityMap[charity.name].donations.push({
            name: member.name,
            email: member.email,
            amount: charity.amount,
            donation_id: charity.donation_id,
            payment_date: donationDates[charity.donation_id] || '', // Use the stored date or empty string if not found
          });
          charityMap[charity.name].totalDonation += charity.amount;
        }
      });
    });

    updatePaidUI(charityMap);
  }

  function updatePaidUI(charityMap) {
    const donatedTable = document.getElementById("donatedTable");
    donatedTable.innerHTML = '';

    Object.entries(charityMap).forEach(([charName, charity]) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("char_table-wrapper");
      wrapper.innerHTML = `
        <div class="char_name-wrapper">
          <img loading="lazy" src="${charity.logo}" alt="" class="char_image">
          <a href="#" class="char_link w-inline-block" target="_blank">
            <div>${charName}</div>
            <div class="char_link-icon w-embed">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"></path>
                <path d="M11 13l9 -9"></path>
                <path d="M15 4h5v5"></path>
              </svg>
            </div>
          </a>
        </div>
        <table class="char-table_component">
          <thead class="char-table_head">
            <tr class="char-table_row is-ua">
              <th class="char-table_header">Team member name</th>
              <th class="char-table_header">Team member email</th>
              <th class="char-table_header">Amount donated</th>
            </tr>
          </thead>
          <tbody class="char-table_body">
            ${charity.donations.map(
              donation => `<tr class="char-table_row is-ua">
                <td class="char-table_cell">${donation.name} <span class="donation_id">${donation.donation_id}</span></td>
                <td class="char-table_cell"><a href="mailto:${donation.email}">${donation.email}</a></td>
                <td class="char-table_cell">A$${donation.amount}</td>
              </tr>`
            ).join("")}
          </tbody>
        </table>
        <div class="char_donation-wrapper">
          <div class="donation_details">
            <img loading="lazy" src="https://cdn.prod.website-files.com/65debf94c45187dc7c67abf2/664366ba679054e9dafb8127_heart.svg" alt="" class="donated_icon">
            <div>Donated<br>at <span id="donationDate">${charity.donations[0]?.payment_date || ''}</span></div>
          </div>
          <div class="char_donation-amount">
            <div class="char_donation-number">A$${charity.totalDonation}</div>
            <div>Total amount donated</div>
          </div>
        </div>`;
      donatedTable.appendChild(wrapper);
    });

    if (Object.keys(charityMap).length > 0) {
      document.getElementById("donationHistory").style.display = "flex";
    } else {
      document.getElementById("donationHistory").style.display = "none";
    }
  }

  fetchData();
  updateButton.addEventListener("click", function () {
    fetchData();
  });
});*/
document.addEventListener("DOMContentLoaded", function () {
  const updateButton = document.getElementById("updateButton");

  async function fetchData(retries = 5, interval = 1000) {
    let companyIdentifier = localStorage.getItem("company_identifier");
    let attempts = 0;

    while (!companyIdentifier && attempts < retries) {
      await new Promise((resolve) => setTimeout(resolve, interval)); // Wait for the interval before retrying
      companyIdentifier = localStorage.getItem("company_identifier");
      attempts++;
    }

    if (companyIdentifier) {
      const encodedIdentifier = encodeURIComponent(companyIdentifier);
      const membersApiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/members?company_identifier=${encodedIdentifier}`; //new workspace
      const managersApiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:uoqATYAX/managers?company_identifier=${encodedIdentifier}`; //new workspace

      try {
        const [membersResponse, managersResponse] = await Promise.all([
          fetch(membersApiUrl),
          fetch(managersApiUrl),
        ]);

        const membersData = await membersResponse.json();
        const managersData = await managersResponse.json();

        processPaidDonations(membersData, managersData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    } else {
      console.error(
        "Failed to retrieve company_identifier from local storage after multiple retries."
      );
    }
  }

  function processPaidDonations(membersData, managersData) {
    const paidDonationIds = new Set();
    const donationDates = {}; // Store donation dates by donation ID
    const donationInfo = {}; // Store additional donation info by donation ID

    // Iterate through each manager to gather paid donation IDs and their corresponding dates
    managersData.forEach((manager) => {
      manager.donations.forEach((donation) => {
        const ids = donation.donation_ids.split(",").map((id) => id.trim());
        ids.forEach((id) => {
          if (manager.payment_status === "paid") {
            paidDonationIds.add(id);
          }
          donationDates[id] = donation.payment_date; // Store the payment date by donation ID
          donationInfo[id] = {
            payment_id: donation.payment_id,
            bank_transfer_status: donation.bank_transfer_status,
          };
        });
      });
    });

    const charityMap = {};

    membersData.forEach((member) => {
      (member.donated_to || [])
        .flat()
        .forEach((charity) => {
          if (paidDonationIds.has(charity.donation_id)) {
            if (!charityMap[charity.name]) {
              charityMap[charity.name] = {
                donations: [],
                totalDonation: 0,
                logo:
                  charity.logo_url ||
                  "https://assets-global.website-files.com/65debf94c45187dc7c67abf2/6630bf08dad504d24be09767_charity_default.svg",
              };
            }
            charityMap[charity.name].donations.push({
              name: member.name,
              email: member.email,
              amount: charity.amount,
              donation_id: charity.donation_id,
              payment_date: donationDates[charity.donation_id] || "", // Use the stored date or empty string if not found
              payment_id:
                donationInfo[charity.donation_id]?.payment_id || "",
              bank_transfer_status:
                donationInfo[charity.donation_id]?.bank_transfer_status || "",
            });
            charityMap[charity.name].totalDonation += charity.amount;
          }
        });
    });

    updatePaidUI(charityMap);
  }

  function updatePaidUI(charityMap) {
    const donatedTable = document.getElementById("donatedTable");
    donatedTable.innerHTML = "";

    Object.entries(charityMap).forEach(([charName, charity]) => {
      const showBTPending = charity.donations.some(
        (donation) =>
          donation.payment_id.startsWith("bt") &&
          donation.bank_transfer_status === "pending"
      );

      const wrapper = document.createElement("div");
      wrapper.classList.add("char_table-wrapper");
      wrapper.innerHTML = `
        <div class="char_name-wrapper">
          <img loading="lazy" src="${charity.logo}" alt="" class="char_image">
          <a href="#" class="char_link w-inline-block" target="_blank">
            <div>${charName}</div>
            <div class="char_link-icon w-embed">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v -6"></path>
                <path d="M11 13l9 -9"></path>
                <path d="M15 4h5v5"></path>
              </svg>
            </div>
          </a>
        </div>
        <table class="char-table_component">
          <thead class="char-table_head">
            <tr class="char-table_row is-ua">
              <th class="char-table_header">Team member name</th>
              <th class="char-table_header">Team member email</th>
              <th class="char-table_header">Amount donated</th>
            </tr>
          </thead>
          <tbody class="char-table_body">
            ${charity.donations
              .map(
                (donation) => `<tr class="char-table_row is-ua">
                  <td class="char-table_cell">${donation.name} <span class="donation_id">${donation.donation_id}</span></td>
                  <td class="char-table_cell"><a href="mailto:${donation.email}">${donation.email}</a></td>
                  <td class="char-table_cell">A$${donation.amount}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div class="char_donation-wrapper">
          <div class="donation_details">
            <img loading="lazy" src="https://cdn.prod.website-files.com/65debf94c45187dc7c67abf2/664366ba679054e9dafb8127_heart.svg" alt="" class="donated_icon">
            <div>Donated<br>at <span id="donationDate">${
              charity.donations[0]?.payment_date || ""
            }</span></div>
          </div>
          <div class="char_donation-amount">
            <div class="bt_pending"${
              showBTPending ? '' : ' style="display:none;"'
            }>Pending bank transfer</div>
            <div class="char_donation-number">A$${
              charity.totalDonation
            }</div>
            <div>Total amount donated</div>
          </div>
        </div>`;
      donatedTable.appendChild(wrapper);
    });

    if (Object.keys(charityMap).length > 0) {
      document.getElementById("donationHistory").style.display = "flex";
    } else {
      document.getElementById("donationHistory").style.display = "none";
    }
  }

  fetchData();
  updateButton.addEventListener("click", function () {
    fetchData();
  });
});

//Stripe checkout 
document.addEventListener("DOMContentLoaded", function () {
  const donateButton = document.getElementById("donateButton");
  const modalError = document.querySelector(".modal_error");

  donateButton.addEventListener("click", function (event) {
    event.preventDefault();

    const amountText = document.getElementById("donationCalc").textContent;
    const amount = parseInt(amountText.replace("A$", "")) * 100;

    const checkedCheckboxes = document.querySelectorAll(".donation_checkbox:checked");
    if (checkedCheckboxes.length === 0) {
      modalError.style.display = "block";
      return;
    }

    let description = "Donation from: ";
    const donationDetails = {};
    let totalAmount = 0;
    const donationIds = [];

    const companyIdentifier = localStorage.getItem("company_identifier");
    const emailElement = document.getElementById("wf-user-account-email");
    if (!emailElement) {
      console.error("Error: Email field not found");
      return;
    }
    const email = emailElement.value.trim();
    if (!email) {
      console.error("Error: Email is empty");
      return;
    }

    description += `${companyIdentifier} (${email})`;

    checkedCheckboxes.forEach((checkbox) => {
      const row = checkbox.closest(".donation_row");
      const charity = row.querySelector(".donation_char").textContent.trim();
      const donationAmountText = row.querySelector(".char_donation-number").textContent.trim();
      const donationAmount = parseFloat(donationAmountText.replace("A$", ""));
      const donationIdElements = row.querySelectorAll(".donation_id"); // Get all donation ID elements

      donationDetails[charity] = donationAmountText;
      totalAmount += donationAmount;

      donationIdElements.forEach((donationIdElement) => {
        const donationId = donationIdElement.textContent.trim();
        donationIds.push(donationId); // Collect all donation IDs for the selected charity
      });
    });

    const paymentDate = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const uniquePaymentId = Date.now().toString(); // Generate a unique payment ID
    donationDetails.payment_date = paymentDate;
    donationDetails.payment_id = uniquePaymentId;
    donationDetails.total_amount = `A$${totalAmount.toFixed(2)}`; // Add total amount to donation details
    donationDetails.user_email = email; // Add user email to donation details
    donationDetails.company_identifier = companyIdentifier; // Add company identifier to donation details
    donationDetails.donation_ids = donationIds.join(","); // Concatenate all donation IDs into a single string

    const requestData = {
      success_url: "https://haveyoursay.givenget.org/success",
      cancel_url: "https://haveyoursay.givenget.org/fail",
      line_items: [
        {
          price_data: {
            currency: "aud",
            product: "prod_QcLX67ceT7Mxuq",
            unit_amount: amount,
          },
          quantity: 1,
          description: description.trim(),
        },
      ],
      metadata: {
        "Donation details": `https://haveyoursay.givenget.org/donation-details?payment_id=${uniquePaymentId}`
      },
      donation_details: donationDetails,
      email: email,
      payment_id: uniquePaymentId
    };

    fetch("https://xrzc-g8gr-8fko.n7d.xano.io/api:UQuTJ3vx/sessions", { //new ws
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.result && data.result.url) {
          const paymentIntent = data.result.payment_intent;
          // Make the GET request to retrieve the payment intent details
          fetch(`https://xrzc-g8gr-8fko.n7d.xano.io/api:UQuTJ3vx/payment_Intent?payment_intent=${paymentIntent}`, { //new ws
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((response) => response.json())
            .then(() => {
              // Redirect to the Stripe checkout session
              window.location.href = data.result.url;
            })
            .catch((error) => {
              console.error("Error retrieving payment intent details:", error);
            });
        } else {
          console.error("Failed to create Stripe session:", data);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  document.querySelectorAll(".donation_checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      if (document.querySelectorAll(".donation_checkbox:checked").length > 0) {
        modalError.style.display = "none";
      }
    });
  });
});

// Add company to the link
document.addEventListener("DOMContentLoaded", function() {
  function attemptSetLink(retryCount = 0) {
    var companyId = localStorage.getItem("company_identifier");
    if (companyId) {
      var surveyUrl = "https://haveyoursay.givenget.org/team-signup?company=" + encodeURIComponent(companyId);
      var surveyLinkElement = document.getElementById("surveyLink");
      if (surveyLinkElement) {
        surveyLinkElement.textContent = surveyUrl;
      }
    } else if (retryCount < 10) {  
      setTimeout(function() {
        attemptSetLink(retryCount + 1);
      }, 1500);
    } else {
      console.error('Failed to load company identifier from local storage.');
    }
  }
  attemptSetLink(); 
});

//Show company name next to the logo
function loadCompanyName() {
  var retries = 0;
  var maxRetries = 10; 
  var retryInterval = 1000; 
  var companyNameInterval = setInterval(function() {
      var companyIdentifier = localStorage.getItem('company_identifier');
      if (companyIdentifier !== null) {
          document.getElementById('companyName').textContent = companyIdentifier;
          clearInterval(companyNameInterval);
      } else if (retries >= maxRetries) {
          console.log('Failed to load company identifier from local storage after ' + maxRetries + ' retries.');
          clearInterval(companyNameInterval);
      }
      retries++;
  }, retryInterval);
}
loadCompanyName();

//Logo upload
document.getElementById('uploadLogoBtn').addEventListener('click', function() {
  let input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png, image/jpeg';

  input.onchange = e => {
      let file = e.target.files[0];
      
      if (!file || (file.size > 102400) || (file.type !== 'image/png' && file.type !== 'image/jpeg')) {
          alert('File must be PNG or JPEG and no more than 100KB.');
          return;
      }

      let formData = new FormData();
      formData.append('logo', file);
      formData.append('company_identifier', localStorage.getItem('company_identifier'));

      fetch('https://xrzc-g8gr-8fko.n7d.xano.io/api:uoqATYAX/managers_logo', { //new workspace
          method: 'POST',
          body: formData
      })
      .then(response => response.json())
      .then(data => {
          console.log('Upload successful', data);
          fetchAndDisplayImage(); 
      })
      .catch(error => {
          console.error('Error uploading image:', error);
      });
  };

  input.click();
});

//Show logo
function fetchAndDisplayImage(companyIdentifier = localStorage.getItem('company_identifier')) {
  fetch(`https://xrzc-g8gr-8fko.n7d.xano.io/api:uoqATYAX/managers?company_identifier=${companyIdentifier}`) //new workspace
    .then(response => response.json())
    .then(data => {
      let companyData = data.find(company => company.company_identifier === companyIdentifier);
      if (companyData && companyData.company_logo && companyData.company_logo.url) {
        document.querySelectorAll('[xn-data="company-logo"]').forEach(element => {
          element.src = companyData.company_logo.url;
        });
      }
    })
    .catch(error => {
      console.error('Error fetching image:', error);
    });
}
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(fetchAndDisplayImage, 1000);
});

/*----------- DETAILS TAB -----------*/
//Team table
document.addEventListener("DOMContentLoaded", function () {
  const updateButton = document.getElementById("updateButton");

  // Function to fetch data from the API
function fetchData(retries = 5, interval = 1000) {
  const companyIdentifier = localStorage.getItem("company_identifier");
  if (companyIdentifier) {
    const encodedIdentifier = encodeURIComponent(companyIdentifier);
    const apiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/members?company_identifier=${encodedIdentifier}`; //new ws
    fetch(apiUrl)
      .then((response) => response.json())
      .then(processData)
      .catch((error) => console.error("Error fetching data: ", error));
  } else if (retries > 0) {
    setTimeout(() => fetchData(retries - 1, interval), interval);
  } else {
    console.error("Failed to retrieve company_identifier from local storage after multiple retries.");
  }
}


  // Process the fetched data
  function processData(data) {
    const sortedData = data.sort((a, b) => b.completed - a.completed);
    const tableBody = document.querySelector(".tm-table_body");
    tableBody.innerHTML = ''; // Clear the table body to refresh the data
    sortedData.forEach((member) => {
      const row = document.createElement("tr");
      row.classList.add("tm-table_row");
      
      // Formatting date
      const date = new Date(member.created_at);
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const safeDonatedTo = Array.isArray(member.donated_to) ? member.donated_to : [];
      const safeYesResponses = Array.isArray(member.yes_responses) ? member.yes_responses : [];

      const donatedToString = safeDonatedTo
        .filter((group) => Array.isArray(group) && group.length > 0)
        .map((group) => group.map((charity) => `${charity.name} - A$${charity.amount}`).join("<br>"))
        .join("<br>");

      const activities = safeYesResponses
        .filter((response) => response.category === "Activities")
        .map((response) => response.subcategory)
        .join(", ");

      const donationMethods = safeYesResponses
        .filter((response) => response.category === "Donation method")
        .map((response) => response.subcategory)
        .join(", ");

      const causes = safeYesResponses
        .filter((response) => response.category !== "Activities" && response.category !== "Donation method")
        .map((response) => response.subcategory)
        .join(", ");

      row.innerHTML = `
              <td class="tm-table_cell member-name">${member.name},<br><a href="mailto:${member.email}">${member.email}</a></td>
              <td class="tm-table_cell member-status ${member.completed ? "status-completed" : "status-not-completed"}">
                ${member.completed ? '<div class="complete_tag">Completed</div>' : '<div class="notcomplete_tag">Not completed</div>'}
              </td>
              <td class="tm-table_cell member-date">${formattedDate || "N/A"}</td>
              <td class="tm-table_cell member-causes">${causes}</td>
              <td class="tm-table_cell member-donation-methods">${donationMethods}</td>
              <td class="tm-table_cell member-activities">${activities}</td>
              <td class="tm-table_cell member-donated-to">${donatedToString}</td>
              <td class="tm-table_cell member-amount-donated">A$${member.donation_amount || 0}</td>
          `;

      tableBody.appendChild(row);
    });
  }
  fetchData();

  updateButton.addEventListener("click", function() {
    fetchData();
  });
});

//Team table sort
document.addEventListener("DOMContentLoaded", function () {
  const sortSelect = document.getElementById("sort");

  sortSelect.addEventListener("change", function () {
    const criterion = this.value;
    sortTable(criterion);
  });

  function sortTable(criterion) {
    let rows, switching, i, x, y, shouldSwitch;
    const table = document.querySelector(".tm-table_component");
    switching = true;

    while (switching) {
      switching = false;
      rows = table.rows;

      for (i = 1; i < rows.length - 1; i++) {
        shouldSwitch = false;
        switch (criterion) {
          case "Name":
            x = rows[i].querySelector(".member-name").textContent.toLowerCase();
            y = rows[i + 1]
              .querySelector(".member-name")
              .textContent.toLowerCase();
            if (x > y) {
              shouldSwitch = true;
              break;
            }
            break;
          case "Amount":
            x = parseInt(
              rows[i]
                .querySelector(".member-amount-donated")
                .textContent.replace(/[^0-9]/g, "")
            );
            y = parseInt(
              rows[i + 1]
                .querySelector(".member-amount-donated")
                .textContent.replace(/[^0-9]/g, "")
            );
            if (x < y) {
              shouldSwitch = true;
              break;
            }
            break;
          case "Completed":
            x = rows[i]
              .querySelector(".member-status")
              .textContent.includes("Completed");
            y = rows[i + 1]
              .querySelector(".member-status")
              .textContent.includes("Completed");
            if (!x && y) {
              shouldSwitch = true;
              break;
            }
            break;
        }
        if (shouldSwitch) {
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          switching = true;
          break;
        }
      }
    }
  }
});

/*----------- TAB STATS -----------*/
//Top metrics
document.addEventListener("DOMContentLoaded", function () {
  const updateButton = document.getElementById("updateButton");

  function fetchData(retries = 5, interval = 1000) {
    const companyIdentifier = localStorage.getItem("company_identifier");
    if (companyIdentifier) {
      const apiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:6QL-WByo/metrics?company_identifier=${encodeURIComponent(companyIdentifier)}`; //new ws

      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          document.getElementById("totalMembers").textContent = data.sessions_count;
          document.getElementById("totalSessions").textContent = data.sessions_completed;

          const participationRate = (data.sessions_completed / data.sessions_count) * 100;
          const nonParticipationRate = 100 - participationRate;

          const averageTimeElement = document.getElementById("averageTime");
          if (averageTimeElement) {
            averageTimeElement.textContent = data.sessions_average.averageSessionDuration.toFixed(1);
          } else {
            console.error("Average time element not found");
          }

          const totalAmountElement = document.getElementById("totalAmount");
          if (totalAmountElement) {
            totalAmountElement.textContent = `A$${data.donation_amount.toFixed(2)}`;
          } else {
            console.error("Total amount element not found");
          }

          drawEngagementChart(participationRate, nonParticipationRate);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    } else if (retries > 0) {
      setTimeout(() => fetchData(retries - 1, interval), interval);
    } else {
      console.error("Failed to retrieve company_identifier from local storage after multiple retries.");
    }
  }

  fetchData();
  updateButton.addEventListener("click", function() {
    fetchData();
  });
});

// Data Fetching for Causes, Activities and Donations
document.addEventListener("DOMContentLoaded", function () {
  const fetchData = () => {
    const companyIdentifier = localStorage.getItem("company_identifier");
    if (!companyIdentifier) {
      console.error("Company identifier not found in local storage, retrying...");
      setTimeout(fetchData, 1000);
      return;
    }

    const apiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/popular_responses?company_identifier=${encodeURIComponent(companyIdentifier)}`; //new ws
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        updateCausesChart(data);
        updateActivitiesChart(data);
        updateDonationChart(data);
      })
      .catch((error) => console.error("Error fetching data:", error));
  };

  setTimeout(fetchData, 1000); // Initial data fetch on page load

  const updateButton = document.getElementById("updateButton");
  updateButton.addEventListener("click", fetchData); // Update data on button click
});

// Engagment chart
var engagementChartInstance = null;
function drawEngagementChart(participationRate, nonParticipationRate) {
  var ctx = document.getElementById("engagementChart").getContext("2d");

  if (engagementChartInstance) {
    engagementChartInstance.destroy(); 
  }

  engagementChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Participated", "Not Participated"],
      datasets: [
        {
          data: [participationRate, nonParticipationRate],
          backgroundColor: ["rgba(46, 204, 113, 1)", "rgba(232, 76, 61, 1)"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "rgba(255, 255, 255, 0.8)",
          },
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
              var label = context.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed !== null) {
                label += Math.round(context.parsed * 100) / 100 + "%";
              }
              return label;
            },
          },
        },
      },
    },
  });

  return engagementChartInstance; 
}

// Causes chart
var causesChartInstance = null;
function updateCausesChart(data) {
  var subcategories = data.popular_causes.topSubcategories;
  var labels = subcategories.map(function(item) { return item.subcategory; });
  var total = subcategories.reduce(function(sum, item) { return sum + item.count; }, 0);
  var percentages = subcategories.map(function(item) { return (item.count / total) * 100; });

  var ctx = document.getElementById("causesChart").getContext("2d");

  if (causesChartInstance) {
    causesChartInstance.destroy();
  }

  causesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Percentage',
        data: percentages,
        backgroundColor: 'rgba(243, 115, 36, 0.6)',
        borderColor: 'rgba(243, 115, 36, 1)',
        borderWidth: 1,
        borderRadius: {
          topLeft: 4,
          topRight: 4,
          bottomLeft: 0,
          bottomRight: 0
        },
        barThickness: 16,
        barPercentage: 0.8,
        categoryPercentage: 0.8
      }]
    },
    options: {
      scales: {
        x: {
          ticks: { color: 'rgba(255, 255, 255, 0.8)' },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            callback: function(value) { return Math.round(value) + '%'; }
          },
          grid: { color: 'rgba(255, 255, 255, 0.2)' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(tooltipItem) {
              return tooltipItem.dataset.label + ": " + Math.round(tooltipItem.raw) + "%";
            }
          }
        }
      },
      responsive: true
    }
  });
}

// Activities chart
var activitiesChartInstance = null;
function updateActivitiesChart(data) {
  var activities = data.popular_activities.popularActivities,
      labels = activities.map(function(activity) { return activity.subcategory; }),
      total = activities.reduce(function(sum, activity) { return sum + activity.count; }, 0),
      percentages = activities.map(function(activity) { return (activity.count / total) * 100; }),
      ctx = document.getElementById("activitiesChart").getContext("2d");

  if (activitiesChartInstance) {
    activitiesChartInstance.destroy();
  }

  activitiesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Engagement',
        data: percentages,
        backgroundColor: 'rgba(243, 115, 36, 0.6)',
        borderColor: 'rgba(243, 115, 36, 1)',
        borderWidth: 1,
        borderRadius: {
          topLeft: 4,
          topRight: 4,
          bottomLeft: 0,
          bottomRight: 0
        },
        barThickness: 16,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      }]
    },
    options: {
      scales: {
        x: {
          ticks: { color: 'rgba(255, 255, 255, 0.8)' },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            callback: function(value) { return Math.round(value) + '%'; }
          },
          grid: { color: 'rgba(255, 255, 255, 0.2)' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(tooltipItem) {
              return tooltipItem.dataset.label + ': ' + tooltipItem.raw.toFixed(2) + '%';
            }
          }
        }
      },
      responsive: true
    }
  });
}

// Donation chart
var donationChartInstance = null;
function updateDonationChart(data) {
  var methods = data.popular_donation_methods.popularActivities,
      labels = methods.map(function(method) { return method.subcategory; }),
      total = methods.reduce(function(sum, method) { return sum + method.count; }, 0),
      percentages = methods.map(function(method) { return (method.count / total) * 100; }),
      ctx = document.getElementById("donationChart").getContext("2d");

  if (donationChartInstance) {
    donationChartInstance.destroy();
  }

  donationChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: percentages,
        backgroundColor: [
          'rgba(46, 204, 113, 1)',
          'rgba(232, 76, 61, 1)',
          'rgba(155, 89, 182, 1)',
          'rgba(52, 152, 219, 1)',
          'rgba(241, 196, 15, 1)'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: 'rgba(255, 255, 255, 0.8)' }
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(tooltipItem) {
              var label = tooltipItem.label || '';
              if (label) {
                label += ': ';
              }
              label += tooltipItem.raw.toFixed(2) + '%';
              return label;
            }
          }
        }
      }
    }
  });
}

//Mamber donations chart
var donatedChartInstance = null;
function fetchMemberData(retries = 5, delay = 2000) {
  const companyIdentifier = localStorage.getItem('company_identifier');

  if (!companyIdentifier && retries > 0) {
    console.warn(`Company identifier not found in localStorage. Retrying in ${delay}ms. Retries left: ${retries}`);
    setTimeout(() => fetchMemberData(retries - 1, delay), delay);
    return; 
  } else if (!companyIdentifier) {
    console.error("No company identifier found in localStorage after retries.");
    alert('Failed to load company identifier. Please refresh the page or check back later.');
    return; 
  }

// Proceed with fetch if the company identifier is found
const encodedIdentifier = encodeURIComponent(companyIdentifier);
fetch(`https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/members?company_identifier=${encodedIdentifier}`) //new ws
  .then(response => response.json())
  .then(data => {
    let donated = 0;
    let notDonated = 0;
    data.forEach(member => {
      if (member.completed) { // Only count members who have completed survey
        if (member.donation_amount > 0) {
          donated++;
        } else {
          notDonated++;
        }
      }
    });
    console.log("Drawing chart with data:", donated, notDonated);
    drawDonationChart(donated, notDonated);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
    alert('Failed to fetch data. Check the console for more details.');
  });

}

function drawDonationChart(donated, notDonated) {
  var ctx = document.getElementById("donatedChart").getContext("2d");
  if (donatedChartInstance) {
    donatedChartInstance.destroy();
  }

  donatedChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Donated", "Not Donated"],
      datasets: [
        {
          data: [donated, notDonated],
          backgroundColor: ["rgba(46, 204, 113, 1)", "rgba(232, 76, 61, 1)"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "rgba(255, 255, 255, 0.8)",
          },
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
              var label = context.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed !== null) {
                label += Math.round(context.parsed * 100) / 100 + "%";
              }
              return label;
            },
          },
        },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed");
  fetchMemberData();

  const updateButton = document.getElementById("updateButton");
  updateButton.addEventListener("click", function() {
    fetchMemberData(); // Reset retries to default when manually triggering
  });
});


// Show/Hide tables
document.addEventListener("DOMContentLoaded", function () {
  var selectElement = document.getElementById("show");
  var tmTableComponent = document.querySelector(".tm-table_component");

  function toggleVisibility() {
    var value = selectElement.value;
    var teamTable = document.getElementById("teamTable");
    var charTable = document.getElementById("charTable");
    var sortTable = document.getElementById("sortTable");

    if (value === "Team members") {
      teamTable.style.display = "block"; 
      sortTable.style.display = "flex"; 
      charTable.style.display = "none"; 
      tmTableComponent.style.opacity = 1; 
    } else if (value === "Charities") {
      teamTable.style.display = "none"; 
      sortTable.style.display = "none"; 
      charTable.style.display = "block"; 
      tmTableComponent.style.opacity = 0; 
    }
  }

  selectElement.addEventListener("change", toggleVisibility);

  // Set the default visible table to Charities on page load
  selectElement.value = "Charities";
  toggleVisibility();
});

//Logout
const logoutButton = document.querySelector('.logout_button');
logoutButton.addEventListener('click', function() {
    localStorage.clear(); 
});


//---------------------------
//Update amount and countdown
//---------------------------

document.addEventListener("DOMContentLoaded", function () {
  // Delay the execution of the script by 1000 milliseconds (1 second)
  setTimeout(function () {
    const confirmBtn = document.getElementById("confirmBtn");
    const amountSpan = document.querySelector('span[xn-data="amount"]');
    const expireSpan = document.querySelector('span[xn-data="expire"]');
    let interval;

    function formatDate(dateStr) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[0]}-${parts[1]}`;
      }
      return null;
    }

    function fetchData(retryCount = 0) {
      const companyIdentifier = localStorage.getItem("company_identifier");
      if (!companyIdentifier) {
        if (retryCount < 5) {  // Retry up to 5 times
          console.log("Retrying to fetch company identifier...");
          setTimeout(() => fetchData(retryCount + 1), 1000);  // Wait 1 second before retrying
        } else {
          console.error("Company identifier not available in local storage after several retries.");
        }
        return;
      }

      fetch(
        `https://xrzc-g8gr-8fko.n7d.xano.io/api:uoqATYAX/amount_time?company_identifier=${encodeURIComponent( //new ws
          companyIdentifier
        )}`,
        {
          headers: { "Cache-Control": "no-cache" },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          //console.log("Fetched data:", data);
          if (data.length > 0 && data[0].amount !== undefined) {
            amountSpan.textContent = `A$${data[0].amount}`;
            if (data[0].deadline) {
              updateCountdown(data[0].deadline);
            } else {
              expireSpan.textContent = "No deadline set";
            }
          } else {
            amountSpan.textContent = "A$0";
            expireSpan.textContent = "0:0:0";
          }
        })
        .catch((error) => {
          console.error("Fetch error:", error);
        });
    }

    function updateCountdown(deadline) {
      clearInterval(interval);
      const deadlineDate = new Date(deadline + "T00:00:00Z");
      console.log("Parsed Deadline Date:", deadlineDate.toISOString());

      const update = () => {
        const now = new Date();
        const timeLeft = deadlineDate.getTime() - now.getTime();
        if (timeLeft > 0) {
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          expireSpan.textContent = `${days}d : ${hours}h : ${minutes}m`;
        } else {
          expireSpan.textContent = "Expired";
          clearInterval(interval);
        }
      };

      interval = setInterval(update, 60000);
      update();
    }

    function sendFormData() {
      const amount = document.getElementById("teamAmount").value;
      const deadline = document.getElementById("teamDate").value
        ? formatDate(document.getElementById("teamDate").value)
        : null;

      if (!deadline) {
        alert("Invalid date format. Please use MM-DD-YYYY.");
        return;
      }

      const data = {
        company_identifier: localStorage.getItem("company_identifier"),
        amount: amount,
        deadline: deadline,
      };

      console.log("Data being sent for update:", data);

      fetch("https://xrzc-g8gr-8fko.n7d.xano.io/api:uoqATYAX/edit_manager", { //new ws
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Response after POST:", data);
          fetchData();
        })
        .catch((error) => {
          console.error("Error submitting form:", error);
        });
    }

    confirmBtn.addEventListener("click", function (event) {
      event.preventDefault();
      sendFormData();
    });

    fetchData();

  }, 1000); // Adjust the delay time (in milliseconds) as needed
});


//Send amount and expiration date-create manager
document.addEventListener("DOMContentLoaded", function () {
  const confirmBtn = document.getElementById("confirmBtn");
  let isProcessing = false; // Flag to prevent multiple submissions

  confirmBtn.addEventListener("click", function (event) {
    event.preventDefault(); // Prevents the default behavior

    if (isProcessing) {
      console.log("Submission in progress, skipping this click.");
      return; // Prevent multiple clicks
    }

    isProcessing = true;
    console.log("Confirm button clicked");
    sendFormData();
  });

  function sendFormData() {
    console.log("sendFormData called");

    var amount = document.getElementById("teamAmount").value;
    var deadline = document.getElementById("teamDate").value
      ? formatDate(document.getElementById("teamDate").value)
      : null;
    var companyNameElement = document.getElementById("company-name");
    var companyIdentifier = companyNameElement
      ? companyNameElement.value
      : "Default Company";
    var nameElement = document.getElementById("wf-user-account-name");
    var emailElement = document.getElementById("wf-user-account-email");

    console.log("Name element:", nameElement);
    console.log("Email element:", emailElement);

    var name = nameElement ? nameElement.value : null;
    var email = emailElement ? emailElement.value : null;

    console.log("Name value:", name);
    console.log("Email value:", email);

    var data = {
      company_identifier: companyIdentifier,
      name: name,
      email: email,
    };

    if (amount) {
      data.amount = amount;
    }

    if (deadline) {
      data.deadline = deadline;
    }

    console.log("Form data to be sent:", data);

    confirmBtn.disabled = true; // Disable the button to prevent multiple clicks
    console.log("Button disabled");

    fetch("https://xrzc-g8gr-8fko.n7d.xano.io/api:uoqATYAX/create_manager", { //new ws
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        console.log("Response received:", response);
        return response.json();
      })
      .then((data) => {
        console.log("Data received:", data);
        confirmBtn.textContent = "Wallets updated";
        setTimeout(() => {
          confirmBtn.textContent = "Confirm";
          confirmBtn.disabled = false; // Re-enable the button
          console.log("Button re-enabled");
          isProcessing = false; // Reset the processing flag
        }, 2000);
        document.getElementById("teamAmount").value = "";
        document.getElementById("teamDate").value = "";
      })
      .catch((error) => {
        console.error("Error occurred:", error);
        confirmBtn.textContent = "Failed to Send";
        setTimeout(() => {
          confirmBtn.textContent = "Confirm";
          confirmBtn.disabled = false; // Re-enable the button
          console.log("Button re-enabled after error");
          isProcessing = false; // Reset the processing flag
        }, 2000);
      });
  }

  function formatDate(dateStr) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[0]}-${parts[1]}`;
    } else {
      return dateStr;
    }
  }
});
