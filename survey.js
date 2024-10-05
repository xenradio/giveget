//---------------------
//Send survey responses
//---------------------

document.addEventListener("DOMContentLoaded", async function () {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("No auth token found.");
      }
  
      const companyIdentifier =
        localStorage.getItem("company_identifier") || "defaultCompany";
      const sessionData = await startSession(companyIdentifier);
      sessionStorage.setItem("session_id", sessionData.id);
  
      const form = document.getElementById("surveyForm");
      form.addEventListener("submit", submitFormHandler);
  
      await updateBalanceAndDeadline(authToken);
    } catch (error) {
      handleError(error);
    }
  });
  
  async function startSession(companyIdentifier) {
    const response = await fetchHelper(
      "https://xrzc-g8gr-8fko.n7d.xano.io/api:6QL-WByo/sessions", //new workspace
      "POST",
      {
        company_identifier: companyIdentifier,
        completed: false,
      }
    );
    return response.json();
  }
  
  async function submitFormHandler(event) {
    event.preventDefault();
    const authToken = localStorage.getItem("authToken");
    const session_id = sessionStorage.getItem("session_id");
    const data = {
      company_identifier:
        localStorage.getItem("company_identifier") || "defaultCompany",
      cause_responses: getFormResponses(this),
    };
    const responseData = await fetchHelper(
      "https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/survey_response", //new workspace 
      "POST",
      data,
      authToken
    );
    console.log("Survey responses sent successfully:", responseData);
    await updateSession(session_id, { completed: true, end_time: Date.now() });
    window.location.href = "/result";
  }
  
  function getFormResponses(form) {
    const formData = new FormData(form);
    const responses = [];
    const excludeCategories = ["Instructions", "Separator activities", "Separator donations"];
    
    for (let [name, value] of formData) {
      if (value === "Yes" || value === "No") {
        const [category, subcategory] = name.split("-");
        if (!excludeCategories.includes(category.trim())) {
          responses.push({
            category: category.trim(),
            subcategory: subcategory.trim(),
            response: `${subcategory.trim()} - ${value}`,
          });
        }
      }
    }
    return responses;
  }
  
  async function updateSession(session_id, updateData) {
    const response = await fetchHelper(
      `https://xrzc-g8gr-8fko.n7d.xano.io/api:6QL-WByo/sessions/${session_id}`, //new workspace
      "PATCH",
      updateData
    );
    console.log("Session marked as completed:", response.json());
  }
  
  //---------------------------
  //Update balance and deadline
  //---------------------------

  async function updateBalanceAndDeadline(authToken) {
    const data = await fetchHelper(
      "https://xrzc-g8gr-8fko.n7d.xano.io/api:wXyyqNPC/member_balance_date", //new workspace
      "GET",
      {},
      authToken
    );
  
    const jsonResponse = await data.json();
    const balanceElement = document.querySelector('[xn-data="amount"]');
    const expireElement = document.querySelector('[xn-data="expire"]');
    const popupComponent = document.querySelector('.popup_component-dl');
  
    // Update balance display
    if (balanceElement && jsonResponse.balance !== undefined) {
      balanceElement.textContent = `A$${jsonResponse.balance}`;
  
  // Check if the balance is zero and show the popup
      if (jsonResponse.balance === 0) {
        popupComponent.style.display = 'flex';
      } else {
        popupComponent.style.display = 'none'; 
      }
    }
  
  // Update deadline display and check if it has expired
    if (expireElement && jsonResponse.deadline) {
      const formattedTime = formatCountdownTime(jsonResponse.deadline);
      expireElement.textContent = formattedTime;
  
      if (isDeadlineExpired(jsonResponse.deadline)) {
        popupComponent.style.display = 'flex'; 
      } else if (jsonResponse.balance !== 0) {
        popupComponent.style.display = 'none';
      }
    }
  }
  
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
  
  function isDeadlineExpired(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return now > deadlineDate;
  }
  
  async function fetchHelper(url, method, body = {}, authToken = "") {
    const headers = { "Content-Type": "application/json" };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
  
    const fetchOptions = {
      method: method,
      headers: headers,
    };
  
    if (method !== "GET" && method !== "HEAD") {
      fetchOptions.body = JSON.stringify(body);
    }
  
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`Network response was not ok from ${url}`);
    }
    return response;
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
  