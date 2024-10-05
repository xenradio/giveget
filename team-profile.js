//--------------
//Update profile
//--------------

document.addEventListener("DOMContentLoaded", function () {
    const updateButton = document.getElementById("updateProfileBtn");
  
    updateButton.addEventListener("click", function (event) {
      event.preventDefault();
  
      const name = document.getElementById("userName").value;
      const email = document.getElementById("userEmail").value;
      const authToken = localStorage.getItem("authToken");
  
      const data = { name, email };
  
      fetch("https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/edit_members", { //new workspace
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Success:", data);
          updateButton.textContent = "Profile updated";
          setTimeout(() => {
            updateButton.textContent = "Update profile";
          }, 2000);
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred while updating the profile.");
        });
    });
  });
  
  //Fetch donation and profile data
  document.addEventListener("DOMContentLoaded", function () {
    const authToken = localStorage.getItem("authToken");
  
    if (!authToken) {
      console.error("Auth token not found in local storage.");
      return;
    }
  
    fetch("https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/auth/me", { // new workspace
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        // Populate user profile information
        document.querySelector('[xn-data="name"]').value = data.name;
        document.querySelector('[xn-data="email"]').value = data.email;
        document.querySelector('[xn-data="company"]').value =
          data.company_identifier;
  
        // Populate balance and deadline
        document.querySelector(
          '[xn-data="amount"]'
        ).textContent = `A$${data.balance}`;
        document.querySelector('[xn-data="expire"]').textContent =
          formatCountdownTime(data.deadline);
  
        // Populate the table with charity data
        const tbody = document.querySelector(".user-donation_body");
        tbody.innerHTML = "";
  
        const donationMap = new Map();
  
        data.donated_to.flat().forEach((charity) => {
          if (charity.name && charity.logo_url) {
            const charityName = charity.name;
  
            if (donationMap.has(charityName)) {
              const existingCharity = donationMap.get(charityName);
              existingCharity.amount += charity.amount;
            } else {
              donationMap.set(charityName, {
                ...charity,
                amount: charity.amount,
              });
            }
          }
        });
  
        // Create table rows from the Map
        donationMap.forEach((charity, charityName) => {
          const hasAboutInfo = charity.about && charity.about.trim() !== "";
          const row = document.createElement("tr");
          row.className = "user-donation_row";
          row.innerHTML = `
          <td class="user-donation_cell">
              <div class="char_name-wrapper is-res">
                  <img src="${charity.logo_url}" class="char_image">
                  <a href="${
                    charity.link
                  }" target="_blank" class="char_link is-res w-inline-block">
                      <div><div>${charityName}</div></div>
                      <div class="char_link-icon w-embed">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                              <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"/>
                              <path d="M11 13l9 -9"/>
                              <path d="M15 4h5v5"/>
                          </svg>
                      </div>
                  </a>
              </div>
          </td>
          <td class="user-donation_cell">
              <div class="category_wrapper">
                  <div class="category_tag">${charity.category}</div>
              </div>
          </td>
          <td class="user-donation_cell">
              <div class="about_char-wrapper">
                  <p class="${hasAboutInfo ? "text-style-2lines" : ""}">${
            charity.about
          }</p>
                  ${
                    hasAboutInfo
                      ? '<a href="#" class="char_about-link">Show more</a>'
                      : ""
                  }
              </div>
          </td>
          <td class="user-donation_cell is-last">
              <div class="amount_display">$${charity.amount}</div>
          </td>
      `;
          tbody.appendChild(row);
        });
  
        // Show more/less about text
        document.querySelectorAll(".char_about-link").forEach((button) => {
          button.addEventListener("click", function (event) {
            const aboutText = event.target.previousElementSibling;
            aboutText.classList.toggle("text-style-2lines");
            event.target.textContent = aboutText.classList.contains(
              "text-style-2lines"
            )
              ? "Show more"
              : "Show less";
            event.preventDefault();
          });
        });
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  });
  
  //----------------------
  // Countdown time format
  //----------------------

  function formatCountdownTime(deadline) {
    const now = new Date();
    const remainingTime = new Date(deadline) - now;
  
    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d: ${hours}h: ${minutes}m`;
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
  