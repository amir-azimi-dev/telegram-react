import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";

import "../public/css/common.css";
import "../public/css/style.css";
import Chat from "./Pages/Chat";
import Auth from "./Pages/Auth";


function App() {
  const [user, setUser] = useState({});
  const [namespaces, setNamespaces] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    (async () => {
      const userInfo = await authenticateUser();
      if (!userInfo) {
        return navigate("/auth");
      }

      setUser(userInfo);

      const socketIo = io("http://localhost:3000");
      socketIo.on("namespaces", namespaces => setNamespaces(namespaces));
    })()

  }, [pathname]);

  async function authenticateUser() {
    const token = localStorage.getItem("token");
    if (!token) {
      return false;
    }

    const response = await fetch("http://localhost:3000/api/v1/auth", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return false;
    }

    const userInfo = await response.json();
    return userInfo.payload;
  };

  return (
    <Routes>
      <Route path="/" element={<Chat namespaces={namespaces} user={user} />} />
      <Route path="/auth" element={<Auth />} />
    </Routes>
  )
}

export default App;
