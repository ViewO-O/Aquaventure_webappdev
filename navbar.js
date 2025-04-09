document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded event triggered");

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const jwtToken = localStorage.getItem("jwtToken");
  console.log("isLoggedIn:", isLoggedIn);

  let username = "ชื่อผู้ใช้";
  let role = "";
  const navbar = document.getElementById("navbarContainer");
  console.log("navbar element:", navbar);

  async function fetchUserProfile() {
      try {
          if (!jwtToken) {
              console.log("No JWT token found, showing public navbar.");
              renderPublicNavbar();
              return;
          }

          console.log("Token from localStorage:", jwtToken);
          const response = await fetch('http://localhost:5000/user/profile', {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${jwtToken}`
              }
          });
          console.log("Response status:", response.status);

          if (!response.ok) {
              console.error("Failed to fetch user data:", response.statusText);
              renderPublicNavbar(); // 
              return;
          }

          const data = await response.json();
          console.log("User data:", data);
          username = data.username;
          role = data.role;
          console.log("Fetched username:", username);
          console.log("Fetched role:", role);
          renderLoggedInNavbar(username);
      } catch (error) {
          console.error("Error fetching user data:", error);
          renderPublicNavbar(); 
      }
  }

  function renderLoggedInNavbar(username) {

    const dashboardLink = role === "provider" ? "provider-dashboard.html" : "customer-dashboard.html";

    navbar.innerHTML = `
        <div class="navbar">
            <h1 class="logo">Aquaventure</h1>
            <div class="menu-toggle" id="menuToggle">
                <span></span><span></span><span></span>
            </div>
            <nav class="nav-links" id="navLinks">
                <a href="index.html" id="navHome">หน้าแรก</a>
                <a href="activity.html" id="navActivities">กิจกรรม</a>
                <div class="profile-dropdown">
                    <button id="profileBtn">${username} ▾</button>
                    <div class="dropdown-content">
                        <a href="${dashboardLink}" id="navProfile">โปรไฟล์</a>
                        <button id="logoutBtn">ออกจากระบบ</button>
                    </div>
                </div>
                <button id="langSwitch" class="lang-btn">EN</button>
            </nav>
        </div>
    `;

    const logoutButton = document.getElementById("logoutBtn");
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
  
    const profileBtn = document.getElementById("profileBtn");
    const dropdownContent = document.querySelector(".dropdown-content");
    if (profileBtn && dropdownContent) {
        profileBtn.addEventListener("click", () => {
            dropdownContent.classList.toggle("show");
        });
        document.addEventListener("click", (e) => {
            if (!profileBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
                dropdownContent.classList.remove("show");
            }
        });
    }
  

    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
  
    setupLanguageSwitch();
  }
  
  function renderPublicNavbar() {
    navbar.innerHTML = `
        <div class="navbar">
            <h1 class="logo">Aquaventure</h1>
            <div class="menu-toggle" id="menuToggle">
                <span></span><span></span><span></span>
            </div>
            <nav class="nav-links" id="navLinks">
                <a href="index.html" id="navHome">หน้าแรก</a>
                <a href="activity.html" id="navActivities">กิจกรรม</a>
                <a href="auth.html" id="navAuth">เข้าสู่ระบบ / สมัครสมาชิก</a>
            </nav>
        </div>
    `;
  
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    console.log(currentLang)
    setLanguage(currentLang);

    setupLanguageSwitch();
  }
  
  

  if (isLoggedIn) {
      fetchUserProfile();
  } else {
      console.log("User is not logged in, showing public navbar");
      renderPublicNavbar();
  }
});

function logout() {
  console.log("Logging out...");
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("username");
  localStorage.setItem("isLoggedIn", "false");
  console.log("User logged out");
  alert("ออกจากระบบเรียบร้อยแล้ว");
  location.href = "auth.html";
}
