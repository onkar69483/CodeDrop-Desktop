# 🚀 CodeDrop - Synchronized Clipboard Sharing

**CodeDrop** is a cross-PC clipboard synchronization tool built as an **Electron desktop application**. It enables multiple devices to share clipboard content in real time within a defined group or "room."  

With CodeDrop, you can:
- Create a **room** and share a **4-digit code** to sync clipboards.
- Choose between **one-way** and **two-way** clipboard synchronization.
- Approve or reject **join requests** from new devices.
- Toggle clipboard sync like a **desktop extension**.

<p align="center">
  <img src="https://github.com/user-attachments/assets/ebee9287-a2ee-4b52-a761-d86c23eab4e6" alt="Image 1" width="30%" height="400">
  <img src="https://github.com/user-attachments/assets/7f6074f0-5ad9-4ed8-8248-44a9a0991f23" alt="Image 2" width="25%" height="400">
</p>


## ✨ Features

✅ **Room-Based Clipboard Syncing** – A root device creates a room, and others join with a 4-digit code.  
✅ **Two Sync Modes** – Choose **One-Way Sync** (root device shares only) or **Two-Way Sync** (all devices share).  
✅ **Join Request Authorization** – Root device approves or denies new devices joining.  
✅ **Desktop Extension-Like UI** – Runs in the background with a system tray option.  
✅ **Secure & Fast** – Uses **MongoDB, WebSockets, and Electron** for real-time updates.  

## 🚀 Installation

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/yourusername/codedrop.git
cd codedrop
```

### **2️⃣ Install Dependencies**
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### **3️⃣ Start the Application**
```bash
# Start the backend server
cd backend
npm run dev

# Start the Electron app
cd ../frontend
npm run edev
```

## 🖥️ Usage Guide

1️⃣ Open **CodeDrop** on your primary (root) device and **create a room**.  
2️⃣ Share the **4-digit code** with other devices to join the room.  
3️⃣ **Approve or reject** incoming join requests.  
4️⃣ Choose **One-Way Sync** or **Two-Way Sync** based on your needs.  
5️⃣ Copy text on one device, and it **instantly appears** on others! 🎉  

## 🛠️ Tech Stack
- **Frontend:** Electron, React, TailwindCSS  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB  
- **Real-Time Sync:** WebSockets

## 🛡️ Security Considerations
🔐 CodeDrop ensures that clipboard data is **never stored permanently** in the database.  
🔐 Only **authorized devices** can join a clipboard-sharing session.  
🔐 Encrypted WebSockets ensure **secure data transfer** between devices.  

## 💡 Future Enhancements
📌 End-to-end encryption for clipboard data  
📌 Support for **files & images** in clipboard sync  
📌 Custom clipboard history & management  

## 📜 License
This project is licensed under the **MIT License**.

🚀 **Let's make clipboard sharing effortless! Happy coding!** 🎉
