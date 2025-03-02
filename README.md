# LANtern Messenger

LANtern Messenger is a **peer-to-peer** (P2P) chat application built using **Hypercore, Hyperbee, and Hyperswarm**. It enables **decentralized messaging** without relying on centralized servers, making it ideal for local and offline-first communication.

## 🚀 Features

- **Peer-to-Peer Messaging**: No centralized servers required.
- **Unique Peer ID Generation**: Each instance gets a unique ID.
- **Real-Time Synchronization**: Messages are streamed live.
- **Decentralized Communication**: Uses Hypercore and Hyperswarm for discovery and replication.
- **Persistent Chat History**: Messages are stored in Hyperbee.

## 🛠️ Installation

### Prerequisites
Ensure you have **Node.js** installed on your system.

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/LANtern-Messenger.git
   cd LANtern-Messenger
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the application:
   ```sh
   npm start
   ```

## 🏗️ How It Works

1. **Initialize Peer ID**: Each instance generates a **unique Peer ID** based on a Hypercore.
2. **Copy & Share Peer ID**: Users can copy their Peer ID and share it with others.
3. **Connect to Remote Peers**: Enter a Peer ID to establish a connection.
4. **Message Exchange**: Messages are stored in **Hyperbee** and streamed in real time.
5. **Decentralized Discovery**: Uses **Hyperswarm** for peer discovery and data replication.

## 🔧 Technologies Used
- **Hypercore** (Distributed append-only logs)
- **Hyperbee** (Key-value store on top of Hypercore)
- **Hyperswarm** (Peer-to-peer networking for discovery and connection)
- **Corestore** (Manages multiple Hypercores)
- **b4a (Buffer Utilities)**


## 📖 Usage Guide

### Start Chatting
1. **Open the app**
2. **Copy your Peer ID** and share it with another user
3. **Enter a Remote Peer ID** and click **Connect**
4. **Send messages** and watch them sync in real-time!

### Troubleshooting
- **Same Peer ID?** Try running in **Incognito Mode** or **different browsers**.
- **Connection Issues?** Ensure you’ve entered a valid Peer ID.
- **Message Delay?** Check if **swarm.join** and **replication** events are firing.

## 🛠 Future Enhancements
- **File Sharing Support** 📂
- **End-to-End Encryption** 🔐
- **Mobile-Friendly UI** 📱

## 🤝 Contributing
Pull requests are welcome! If you find bugs or want to improve something, feel free to contribute.

## 📜 License
MIT License. See `LICENSE` for more details.

---
🚀 **Built for PEARS Hackathon** 🚀

