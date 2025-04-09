document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
  
    // สมัครสมาชิก
    if (registerForm) {
      registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
  
        const username = document.getElementById("reg-username").value;
        const password = document.getElementById("reg-password").value;
        const confirmPassword = document.getElementById("reg-confirm").value;
  
        console.log("Registration form submitted");
        console.log("Username:", username);
        console.log("Password:", password);
        console.log("Confirm Password:", confirmPassword);
  
        if (password !== confirmPassword) {
          alert("รหัสผ่านไม่ตรงกัน");
          return;
        }
  
        try {
          const response = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, confirmPassword }),
          });
  
          const data = await response.json();
          console.log("Register response:", data);
  
          if (response.ok) {
            alert("สมัครสมาชิกสำเร็จ!");
            toggleForm("login");
          } else {
            alert(data.error || "เกิดข้อผิดพลาด");
          }
        } catch (err) {
          alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
          console.error(err);
        }
      });
    }
  
    // ล็อกอิน
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
  
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;
  
        console.log("Login form submitted");
        console.log("Username:", username);
        console.log("Password:", password);
  
        try {
          const response = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
  
          const data = await response.json();
          console.log("Login response:", data);
  
          if (response.ok) {
            localStorage.setItem("jwtToken", data.token);
            localStorage.setItem("role", data.role); 
            localStorage.setItem("username", username);
            localStorage.setItem("isLoggedIn", "true");
  
  
            console.log("Login successful");
            alert("เข้าสู่ระบบสำเร็จ");
  
            setTimeout(() => {
                if (data.role === "provider") {
                  window.location.href = "provider-dashboard.html";
                } else {
                  window.location.href = "index.html";
                }
              }, 200);  
            
          } else {
            alert(data.error || "เข้าสู่ระบบไม่สำเร็จ");
          }
        } catch (err) {
          alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
          console.error(err);
        }
      });
    }
  });
  