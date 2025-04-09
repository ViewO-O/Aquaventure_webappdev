document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get("bookingId");
  
    if (!bookingId) {
      const notyf = new Notyf();
      notyf.error('ไม่พบข้อมูลการจอง');
      setTimeout(() => window.location.href = "index.html", 2000);
      return;
    }
    document.getElementById("bookingId").value = bookingId;
  
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      window.location.href = "auth.html";
      return;
    }
  
    try {
      const res = await fetch(`http://localhost:5000/booking/${bookingId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await res.json();
  
      if (res.ok) {
        const booking = data.booking;
  
        document.getElementById("summaryName").textContent = booking.fullname;
        document.getElementById("summaryEmail").textContent = booking.email;
        document.getElementById("summaryActivity").textContent = booking.activity;
        document.getElementById("summaryPeople").textContent = booking.people;
        document.getElementById("summaryDate").textContent = booking.date;
        document.getElementById("summaryTime").textContent = booking.time;
      } else {
        throw new Error(data.message || "ไม่พบข้อมูลการจอง");
      }
  
    } catch (error) {
      console.error("Error:", error);
      const notyf = new Notyf();
      notyf.error('ไม่สามารถโหลดข้อมูลการจองได้');
    }
  });
  
  const cardForm = document.getElementById("payment-form");
  const qrSection = document.getElementById("qr-payment-section");
  
  cardForm.addEventListener("submit", function (e) {
    e.preventDefault();
  
    const bookingId = document.getElementById("bookingId").value;
    const notyf = new Notyf();
  
    notyf.open({
      type: 'loading',
      message: 'กำลังดำเนินการชำระเงิน...',
    });
  
    setTimeout(() => {
      const paymentData = {
        bookingId,
        method: "card",
        status: "success",
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("paymentInfo", JSON.stringify(paymentData));
  
      notyf.success('ชำระเงินสำเร็จ!');
      setTimeout(() => window.location.href = "thankyou.html", 2000);
    }, 2000);
  });
  
  document.getElementById("payment-method-form").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const method = document.getElementById("payment-method").value;
    const notyf = new Notyf();
  
    if (method === "card") {
      document.getElementById("card-payment-section").style.display = "block";
      qrSection.style.display = "none";
    } else if (method === "qr") {
      qrSection.style.display = "block";
      document.getElementById("card-payment-section").style.display = "none";
  
      document.getElementById("qr-code").innerHTML = `
        <img src="https://api.qrserver.com/v1/create-qr-code/?data=AquaventurePaymentMock123&size=200x200" alt="QR Code" />
      `;
  
      const bookingId = document.getElementById("bookingId").value;
  
      setTimeout(() => {
        const paymentData = {
          bookingId,
          method: "qr",
          status: "success",
          timestamp: new Date().toISOString()
        };
        localStorage.setItem("paymentInfo", JSON.stringify(paymentData));
  
        notyf.success('ชำระเงินผ่าน QR สำเร็จ!');
        setTimeout(() => window.location.href = "thankyou.html", 2000);
      }, 5000);
    }
  });
  