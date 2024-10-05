//-----------------------
// Results table building
//-----------------------

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
      const apiUrl = `https://xrzc-g8gr-8fko.n7d.xano.io/api:8V6arL6x/results`; //new workspace
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("Authentication token not available.");
        return;
      }
  
      fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch results: " + response.statusText);
          }
          return response.json();
        })
        .then((data) => {
          const tableBody = document.querySelector(".result-table_body");
          tableBody.innerHTML = "";
  
          const charityMap = new Map();
          data.related_charities.forEach((charity) => {
            if (!charityMap.has(charity.name)) {
              charityMap.set(charity.name, {
                ...charity,
                related_causes: new Set([charity.related_cause]),
              });
            } else {
              charityMap
                .get(charity.name)
                .related_causes.add(charity.related_cause);
            }
          });
  
          const sortedCharities = Array.from(charityMap.values()).sort((a, b) => {
            const aScore = a.logo && a.about ? 1 : 0;
            const bScore = b.logo && b.about ? 1 : 0;
            return bScore - aScore;
          });
  
          const rowsHtml = sortedCharities
            .map(
              (charity, index) => `
              <div class="result-table_row">
                  <div class="result-table_cell">
                      <div class="char_name-wrapper is-res">
                          <img src="${
                            charity.logo
                              ? charity.logo.url
                              : "https://uploads-ssl.webflow.com/65debf94c45187dc7c67abf2/6630bf08dad504d24be09767_charity_default.svg"
                          }" class="char_image" loading="lazy">
                          <a href="${
                            charity.url
                          }" target="_blank" class="char_link is-res w-inline-block">
                              <div xn-data="char_name">${charity.name}</div>
                              <div class="char_link-icon w-embed">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"></path><path d="M11 13l9 -9"></path><path d="M15 4h5v5"></path></svg>
                              </div>
                          </a>
                          <div class="char_icon-wrapper is-hidden">
                              <img src="https://assets-global.website-files.com/65debf94c45187dc7c67abf2/664366ba679054e9dafb8127_heart.svg" class="char_icon" loading="lazy">
                              <div xn-data="donated" class="char_amount">0</div>
                          </div>
                      </div>
                  </div>
                  <div class="result-table_cell">
                      <div class="category_wrapper">
                          ${Array.from(charity.related_causes)
                            .map(
                              (cause) =>
                                `<div xn-data="category" class="category_tag">${cause}</div>`
                            )
                            .join("")}
                      </div>
                  </div>
                  <div class="result-table_cell">
                      <div class="about_char-wrapper">
                          <p xn-data="about" class="text-style-2lines">${
                            charity.about || ""
                          }</p>
                          ${
                            charity.about
                              ? `<a id="readmoreBtn${index}" href="#" class="char_about-link">Show more</a>`
                              : ""
                          }
                      </div>
                  </div>
                  <div class="result-table_cell">
                      <div class="donate_wrapper">
                          <input class="form_input is-res" name="donation-amount" placeholder="Donation Amount">
                          <a href="#" class="button w-button">Confirm</a>
                      </div>
                  </div>
              </div>
          `
            )
            .join("");
          tableBody.innerHTML = rowsHtml;
  
          // Add event listeners for "Read more" buttons
          sortedCharities.forEach((charity, index) => {
            if (charity.about) {
              const readMoreBtn = document.getElementById(`readmoreBtn${index}`);
              const aboutParagraph = readMoreBtn.previousElementSibling;
              readMoreBtn.addEventListener("click", function (event) {
                event.preventDefault();
                aboutParagraph.classList.toggle("text-style-2lines");
                readMoreBtn.textContent = readMoreBtn.textContent.includes("more")
                  ? "Show less"
                  : "Show more";
              });
            }
          });
        })
        .catch((error) => {
          console.error("Error fetching results data:", error);
        });
    }, 100);
  });
  
  //--------------------
  //Donation processing
  //--------------------

  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("button")) {
      const row = event.target.closest(".result-table_row");
      const button = event.target;
      const inputElement = row.querySelector("input[name='donation-amount']");
      if (!inputElement) {
        console.error("Donation amount input not found.");
        return;
      }
  
      const donationAmount = parseFloat(inputElement.value);
      const currentBalance = parseFloat(
        document.querySelector('[xn-data="amount"]').textContent.replace("A$", "")
      );
      if (isNaN(donationAmount) || donationAmount <= 0) {
        alert("Please enter a valid donation amount.");
        return;
      } else if (donationAmount > currentBalance) {
        alert("Donation amount exceeds current balance.");
        return;
      }
  
      const logoImg = row.querySelector(".char_image").src;
  
      button.textContent = "Wait...";
      const token = localStorage.getItem("authToken");
  
      // Generate formatted date
      const date = new Date();
      const formattedDate = date.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');
  
      // Generate donation ID
      const donationId = `${Date.now()}`;
  
      const donationData = {
        donated_to: [
          {
            name: row.querySelector('[xn-data="char_name"]').textContent,
            link: row.querySelector(".char_link").href,
            category: Array.from(row.querySelectorAll('[xn-data="category"]'))
              .map((e) => e.textContent)
              .join(", "),
            about: row.querySelector('[xn-data="about"]').textContent,
            logo_url: logoImg,
            amount: donationAmount,
            donation_date: formattedDate, // Add the formatted donation date here
            donation_id: donationId // Add the donation ID here
          },
        ],
        donation_amount: donationAmount,
      };
  
      console.log("Donation Data:", donationData); // Log the data to check the format
  
      fetch("https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/member_donation", { //new workspace
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(donationData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          if (data.updatet_member && data.updatet_member.completed) {
            updateBalanceAndDeadline(); // Update the balance and deadline
            inputElement.value = ""; // Clear the input
            button.textContent = "Donated"; // Update button text temporarily
            setTimeout(() => (button.textContent = "Confirm"), 2000);
  
            // Call to update the UI immediately after the donation is processed
            fetchAndUpdateDonations(); 
          } else {
            throw new Error("Donation processing indicated failure");
          }
        })
        .catch((error) => {
          console.error("Error processing donation:", error);
          button.textContent = "Error";
          setTimeout(() => (button.textContent = "Confirm"), 2000);
          alert("Error with donation. Please try again.");
        });
    }
  });
  
  
  
  //Show heart and update donation
  document.addEventListener("DOMContentLoaded", function() {
    // Delay the execution to ensure all data has loaded
    setTimeout(() => {
      fetchAndUpdateDonations();
    }, 2000); // Adjust this delay based on your actual data load times
  });
  
  function fetchAndUpdateDonations() {
    const apiUrl = "https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/auth/me"; //new workspace
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("Authentication token not available.");
      return;
    }
  
    fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch due to response status: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log("Donation data fetched successfully:", data);
      updateDonationAmounts(data.donated_to);
    })
    .catch(error => {
      console.error("Failed to fetch donation data:", error);
    });
  }
  
  function updateDonationAmounts(donations) {
    const donationMap = new Map();
    
    donations.flat().forEach(donation => {
      if (donation && donation.name) {
        const trimmedName = donation.name.trim().toLowerCase(); 
        const amount = donationMap.get(trimmedName) || 0;
        donationMap.set(trimmedName, amount + (donation.amount || 0)); 
      }
    });
  
    console.log("Donation Map prepared:", donationMap);
  
    document.querySelectorAll('.result-table_row').forEach(row => {
      const charityNameElement = row.querySelector('[xn-data="char_name"]');
      if (charityNameElement && charityNameElement.textContent) {
        const charityName = charityNameElement.textContent.trim().toLowerCase(); 
        const donationAmount = donationMap.get(charityName);
        const donationDiv = row.querySelector('.char_icon-wrapper');
        const amountElement = donationDiv.querySelector('[xn-data="donated"]');
  
        console.log(`Updating UI for ${charityName}: Donation Amount = ${donationAmount}`);
  
        if (donationAmount !== undefined && donationAmount > 0) {
          amountElement.textContent = `$${donationAmount}`;
          donationDiv.classList.remove('is-hidden');
        } else {
          donationDiv.classList.add('is-hidden');
        }
      } else {
        console.log("Charity name element not found or empty for a row, skipping update for this row.");
      }
    });
  }
  
  //--------------------------------------
  // Fetch and update balance and deadline
  //--------------------------------------

  document.addEventListener("DOMContentLoaded", function () {
    updateBalanceAndDeadline();
  });
  
  function formatCountdownTime(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const remainingTime = deadlineDate - now;
  
    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  
    return `${days}d: ${hours}h: ${minutes}m`;
  }
  
  function updateBalanceAndDeadline() {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("No auth token found.");
      return;
    }
  
    fetch("https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/member_balance_date", { //new workspace
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch balance and deadline");
        }
        return response.json();
      })
      .then((data) => {
        const balanceElement = document.querySelector('[xn-data="amount"]');
        const expireElement = document.querySelector('[xn-data="expire"]');
        const now = new Date();
        const deadlineDate = new Date(data.deadline);
  
        // Update deadline countdown
        if (expireElement && data.deadline) {
          expireElement.textContent = formatCountdownTime(data.deadline);
        }
  
        // Check if deadline has passed
        if (now > deadlineDate) {
          showDeadlinePopup();
        }
  
        // Check balance regardless of deadline status
        if (balanceElement && data.balance !== undefined) {
          balanceElement.textContent = `A$${data.balance}`;
          console.log("Balance:", data.balance); // Log the balance
  
          if (parseFloat(data.balance) === 0) {
            console.log("Balance is zero"); // Log when balance is zero
  
            if (!localStorage.getItem("balancePopupShown")) {
              showPopup();
              localStorage.setItem("balancePopupShown", "true");
            }
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching balance and deadline data:", error);
      });
  }
  
  function showPopup() {
    const popupComponent = document.querySelector(".popup_component");
    if (popupComponent) {
      console.log("Showing popup component"); // Log when showing popup
      popupComponent.style.display = "flex";
      setTimeout(function() {
        window.location.href = "/profile";
      }, 3000);
    } else {
      console.error("Popup component not found");
    }
  }
  
  function showDeadlinePopup() {
    const deadlinePopup = document.querySelector(".popup_component-dl");
    if (deadlinePopup) {
      deadlinePopup.style.display = "flex";
    }
  }
  
  //------
  //Logout
  //------

  document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.querySelector("#logout");
    logoutButton.addEventListener("click", function () {
      localStorage.removeItem("authToken");
      localStorage.removeItem("company_identifier");
      window.location.href = "/team-login";
    });
  });