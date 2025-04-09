console.log("Script loaded");
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
        Toastify({
            text: "กรุณาเข้าสู่ระบบก่อนทำการจอง",
            duration: 3000,
            backgroundColor: "#FF5722", 
            gravity: "top",
            position: "center",
            close: true,
        }).showToast();
        window.location.href = "auth.html";
        return;
    }

    let userData = null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userData = payload;
        if (payload.role !== "customer") {
            Toastify({
                text: "เฉพาะลูกค้าเท่านั้นที่สามารถทำการจองได้",
                duration: 3000,
                backgroundColor: "#FF5722",
                gravity: "top",
                position: "center",
                close: true,
            }).showToast();
            window.location.href = "index.html";
            return;
        }
    } catch (e) {
        console.error("Token error:", e);
        window.location.href = "auth.html";
        return;
    }

    const bookingForm = document.getElementById("bookingForm");
    const submitBtn = document.getElementById("submitBtn");

    const inputDate = document.getElementById("inputDate");
    const today = new Date().toISOString().split("T")[0];
    inputDate.setAttribute("min", today);

    submitBtn.disabled = false;
    submitBtn.textContent = "ยืนยันการจอง";

    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullname = document.getElementById("inputName").value.trim();
        const email = document.getElementById("inputEmail").value.trim();
        const activity = document.querySelector('input[name="activity"]:checked')?.value;
        const people = document.getElementById("inputPeople").value;
        const date = document.getElementById("inputDate").value;
        const time = document.getElementById("inputTime").value;

        if (!fullname || !email || !activity || !people || !date || !time) {
           
            Toastify({
                text: "กรุณากรอกข้อมูลให้ครบถ้วน",
                duration: 3000,
                backgroundColor: "#FF5722",
                gravity: "top",
                position: "center",
                close: true,
            }).showToast();
            return;
        }

        if (parseInt(people) <= 0) {
            
            Toastify({
                text: "จำนวนคนต้องมากกว่า 0",
                duration: 3000,
                backgroundColor: "#FF5722",
                gravity: "top",
                position: "center",
                close: true,
            }).showToast();
            return;
        }

        const bookingDateTime = new Date(`${date}T${time}`);
        const now = new Date();

        if (isNaN(bookingDateTime.getTime())) {
            Toastify({
                text: "วันที่หรือเวลาไม่ถูกต้อง",
                duration: 3000,
                backgroundColor: "#FF5722",
                gravity: "top",
                position: "center",
                close: true,
            }).showToast();
            return;
        }

        if (bookingDateTime <= now) {
            Toastify({
                text: "ไม่สามารถจองย้อนหลังได้ กรุณาเลือกวันและเวลาที่อยู่ในอนาคต",
                duration: 3000,
                backgroundColor: "#FF5722",
                gravity: "top",
                position: "center",
                close: true,
            }).showToast();
            return;
        }

        const bookingData = { fullname, email, activity, people, date, time };
        submitBtn.disabled = true;
        submitBtn.textContent = "กำลังจอง...";

        try {
            const response = await fetch("http://localhost:5000/booking", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(bookingData),
            });

            const data = await response.json();
            console.log("Server response:", data);

            if (response.ok && data.booking?.id) {
                Toastify({
                    text: `คุณได้จองกิจกรรม ${data.booking.activity} สำเร็จแล้ว`,
                    duration: 5000,
                    backgroundColor: "#4CAF50", 
                    gravity: "top",
                    position: "center",
                    close: true,
                }).showToast();
                window.location.href = `payment.html?bookingId=${data.booking.id}`;
            } else {
                Toastify({
                    text: "เกิดข้อผิดพลาดในการจองกรุณาลองใหม่อีกครั้ง.",
                    duration: 3000,
                    backgroundColor: "#FF5722",
                    gravity: "top",
                    position: "center",
                    close: true,
                }).showToast();
            }

        } catch (error) {
            console.error("Booking error:", error);
            Toastify({
                text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
                duration: 3000,
                backgroundColor: "#FF5722",
                gravity: "top",
                position: "center",
                close: true,
            }).showToast();
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "ยืนยันการจอง";
        }
    });
});