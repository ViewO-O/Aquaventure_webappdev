const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();

const PORT = 5000;
const secret = "your_secret_key";

app.use(cors());
app.use(express.json());

// ---------------------- JWT Middleware ----------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized: Missing token" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  });
}

function authorizeCustomer(req, res, next) {
  if (req.user.role !== "customer") {
    return res.status(403).json({ error: "Only customers can access this page" });
  }
  next();
}

// ---------------------- Path ----------------------
const usersPath = path.join(__dirname, "data/users.json");
const bookingsPath = path.join(__dirname, "data/bookings.json");
const paymentsPath = path.join(__dirname, "data/payments.json");


// ---------------------- Register ----------------------
app.post("/register", (req, res) => {
    const { username, password, confirmPassword } = req.body;
  
    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "รหัสผ่านไม่ตรงกัน" });
    }
  
    let users = [];
    if (fs.existsSync(usersPath)) {
      users = JSON.parse(fs.readFileSync(usersPath));
    }
  
    if (users.find((u) => u.username === username)) {
      return res.status(400).json({ error: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" });
    }
  
    const newUser = { username, password, role: "customer" };
    users.push(newUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  
    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
  });  

app.post("/register/provider", (req, res) => {
    const { username, password, confirmPassword } = req.body;
  
    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "รหัสผ่านไม่ตรงกัน" });
    }
  
    let users = [];
    if (fs.existsSync(usersPath)) {
      users = JSON.parse(fs.readFileSync(usersPath));
    }
  
    if (users.find((u) => u.username === username)) {
      return res.status(400).json({ error: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" });
    }
  
    const newUser = { username, password, role: "provider" };
    users.push(newUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  
    res.status(201).json({ message: "สมัครสมาชิกผู้ให้บริการสำเร็จ" });
  });
  

// ---------------------- Login ----------------------
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!fs.existsSync(usersPath)) {
    return res.status(400).json({ error: "ไม่มีผู้ใช้งานในระบบ" });
  }

  const users = JSON.parse(fs.readFileSync(usersPath));
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
  }

  const token = jwt.sign({ username: user.username, role: user.role }, secret, {
    expiresIn: "1h",
  });

  res.json({ 
    message: "เข้าสู่ระบบสำเร็จ", 
    token, 
    role: user.role,
    username: user.username 
  });
  

});

// ---------------------- Booking ----------------------
app.post("/booking", authenticateToken, authorizeCustomer, (req, res) => {
  const { username } = req.user;
  const { activity, date, time, fullname, email, people } = req.body;

  const peopleNum = Number(people);
  let totalPrice = 0;

  switch (activity) {
    case "scuba":
      totalPrice = 2500 * peopleNum;
      break;
    case "snorkeling":
      totalPrice = 1200 * peopleNum;
      break;
    case "boat":
      totalPrice = 5000;
      break;
    case "jetski":
      totalPrice = 2000;
      break;
    default:
      return res.status(400).json({ error: "ไม่พบประเภทกิจกรรมที่ระบุ" });
  }

  const newBooking = {
    id: Date.now(),
    username,
    fullname,
    email,
    activity,
    people,
    date,
    time,
    price: totalPrice,
  };

  let bookings = [];
  if (fs.existsSync(bookingsPath)) {
    bookings = JSON.parse(fs.readFileSync(bookingsPath));
  }

  bookings.push(newBooking);
  fs.writeFileSync(bookingsPath, JSON.stringify(bookings, null, 2));

  // บันทึกสถานะการชำระเงินอัตโนมัติเป็น "ชำระแล้ว"
  const newPayment = {
    id: `pay_${Date.now()}`,
    username: req.user.username,
    bookingId: newBooking.id,
    method: "credit_card", // หรือ method ที่ต้องการ
    status: "paid", // ตั้งสถานะให้เป็น "ชำระแล้ว"
    timestamp: new Date().toISOString(),
  };

  let payments = [];
  if (fs.existsSync(paymentsPath)) {
    payments = JSON.parse(fs.readFileSync(paymentsPath));
  }

  payments.push(newPayment);
  fs.writeFileSync(paymentsPath, JSON.stringify(payments, null, 2));

  res.status(201).json({ message: "จองสำเร็จและชำระเงินแล้ว", booking: newBooking, payment: newPayment });
});

// ดึงข้อมูลการจองด้วย bookingId

app.get("/booking/:id", authenticateToken, authorizeCustomer, (req, res) => {
  const bookingId = Number(req.params.id);
  
  if (!fs.existsSync(bookingsPath)) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจอง" });
  }

  const bookings = JSON.parse(fs.readFileSync(bookingsPath));
  const booking = bookings.find(b => b.id === bookingId && b.username === req.user.username);

  if (!booking) {
    return res.status(404).json({ error: "ไม่พบการจองนี้ของคุณ" });
  }

  res.json({ booking });
});



// ดึงการจองล่าสุดของผู้ใช้
app.get("/userBookings", authenticateToken, authorizeCustomer, (req, res) => {
  const username = req.user.username;

  if (!fs.existsSync(bookingsPath)) {
    return res.json([]);
  }

  const bookings = JSON.parse(fs.readFileSync(bookingsPath));
  const userBookings = bookings.filter(b => b.username === username);

  res.json(userBookings);
});

app.post("/payment", authenticateToken, authorizeCustomer, (req, res) => {
  const { bookingId, method, status } = req.body;

  let payments = [];
  if (fs.existsSync(paymentsPath)) {
    payments = JSON.parse(fs.readFileSync(paymentsPath));
  }

  const bookings = fs.existsSync(bookingsPath)
  ? JSON.parse(fs.readFileSync(bookingsPath))
  : [];

const bookingExists = bookings.find(
  (b) => b.id === Number(bookingId) && b.username === req.user.username
);

if (!bookingExists) {
  return res.status(404).json({ error: "ไม่พบข้อมูลการจองที่ต้องการชำระเงิน" });
}


  const newPayment = {
    id: `pay_${Date.now()}`,
    username: req.user.username,
    bookingId,
    method,
    status,
    timestamp: new Date().toISOString()
  };

  payments.push(newPayment);
  fs.writeFileSync(paymentsPath, JSON.stringify(payments, null, 2));

  res.json({ message: "บันทึกการชำระเงินเรียบร้อย", payment: newPayment });
});

app.get("/payments", authenticateToken, authorizeCustomer, (req, res) => {
  const username = req.user.username;

  if (!fs.existsSync(paymentsPath)) {
    return res.json([]);  
  }

  
  let payments = [];
  try {
    payments = JSON.parse(fs.readFileSync(paymentsPath));
  } catch (err) {
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในการอ่านข้อมูลการชำระเงิน" });
  }

  
  if (!Array.isArray(payments)) {
    return res.status(500).json({ error: "ข้อมูลการชำระเงินไม่ถูกต้อง" });
  }

  const userPayments = payments.filter((p) => p.username === username);

  res.json(userPayments);
});



// ดูรายการจองทั้งหมด
app.get("/allBookings", authenticateToken, (req, res) => {
  if (!fs.existsSync(bookingsPath)) {
    return res.json([]);
  }

  const bookings = JSON.parse(fs.readFileSync(bookingsPath));
  res.json(bookings);
});

app.delete("/booking/:id", authenticateToken, authorizeCustomer, (req, res) => {
  const bookingId = Number(req.params.id);
  let bookings = fs.existsSync(bookingsPath) ? JSON.parse(fs.readFileSync(bookingsPath)) : [];

  const index = bookings.findIndex(b => b.id === bookingId && b.username === req.user.username);
  if (index === -1) return res.status(404).json({ error: "ไม่พบรายการจอง" });

  bookings.splice(index, 1);
  fs.writeFileSync(bookingsPath, JSON.stringify(bookings, null, 2));
  res.json({ message: "ยกเลิกการจองเรียบร้อยแล้ว" });
});

// ดูการจองทั้งหมดของลูกค้า (provider)
app.get("/provider/bookings", authenticateToken, (req, res) => {
  if (req.user.role !== "provider") {
    return res.status(403).json({ error: "Only providers can access this page" });
  }

  const bookings = fs.existsSync(bookingsPath)
    ? JSON.parse(fs.readFileSync(bookingsPath))
    : [];

  res.json(bookings);
});


function authorizeProvider(req, res, next) {
  if (req.user.role !== "provider") {
    return res.status(403).json({ error: "Only providers can access this page" });
  }
  next();
}

app.get("/provider/payments", authenticateToken, authorizeProvider, (req, res) => {
  try {
    const payments = fs.existsSync(paymentsPath)
      ? JSON.parse(fs.readFileSync(paymentsPath))
      : [];

  
    res.json(payments);
  } catch (err) {
    
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงิน" });
  }
});


app.delete("/provider/booking/:id", authenticateToken, authorizeProvider, (req, res) => {
  const bookingId = Number(req.params.id);
  let bookings = fs.existsSync(bookingsPath) ? JSON.parse(fs.readFileSync(bookingsPath)) : [];

  const index = bookings.findIndex(b => b.id === bookingId);
  if (index === -1) return res.status(404).json({ error: "ไม่พบรายการจอง" });

  bookings.splice(index, 1);
  fs.writeFileSync(bookingsPath, JSON.stringify(bookings, null, 2));

  res.json({ message: "การจองถูกลบเรียบร้อยแล้ว" });
});

app.get('/protected-route', (req, res) => {
  res.json({ message: 'This is a protected route!' });
});

app.get("/user/profile", authenticateToken, (req, res) => {
  const username = req.user.username;
  const role = req.user.role;
  res.json({ username, role });
});

app.get("/auth/profile", authenticateToken, (req, res) => {
  const username = req.user.username;

  if (!fs.existsSync(usersPath)) {
    return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
  }

  const users = JSON.parse(fs.readFileSync(usersPath));
  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
  }
  const { password, ...profile } = user;
  res.json({ profile });
});





// ---------------------- Start Server ----------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
