import { useEffect, useState } from "react";
import { io } from "socket.io-client";

let namespaceSocket = null;

function Chat({ user, namespaces }) {
  const [mainNamespace, setMainNamespace] = useState({});
  const [mainNamespaceRooms, setMainNamespaceRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState({});
  const [activeRoomStatus, setActiveRoomStatus] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMainNamespace(namespaces[0]);

  }, [namespaces]);

  useEffect(() => {
    if (!mainNamespace?.href) {
      return;
    }

    namespaceSocket = io(`http://localhost:3000${mainNamespace.href}`);
    namespaceSocket.on("namespaceRooms", rooms => setMainNamespaceRooms(rooms));
    namespaceSocket.on("online-user-count", showOnlineUserCount);

  }, [mainNamespace?.title]);

  const showOnlineUserCount = count => setActiveRoomStatus(count > 1 ? `${count} Online Users` : `${count} Online User`);


  const selectRoomHandler = (event, roomData) => {
    event.preventDefault();
    setMessage("");

    namespaceSocket.emit("join", roomData.title);
  };

  useEffect(() => {
    if (!namespaceSocket) {
      return;
    }

    namespaceSocket.on("room-info", roomData => setActiveRoom(roomData));
    namespaceSocket.on("typing-status", showTypingStatus);
  }, [namespaceSocket]);

  const showTypingStatus = data => {
    data.user._id !== user._id && setActiveRoomStatus(`${data.user.name} is typing ...`);
  };

  const typeHandler = message => {
    setMessage(message);

    const data = {
      user,
      roomTitle: activeRoom.title,
      isTyping: true
    };

    namespaceSocket.emit("typing", data);

    const timeout = setTimeout(() => {
      namespaceSocket.emit("typing", { ...data, isTyping: false });
      clearTimeout(timeout);

    }, 2000);
  };

  const sendMessageHandler = event => {
    event.preventDefault();
    const messageValue = message.trim();
    if (!message) {
      return;
    }

    const messageData = {
      senderId: user._id,
      roomTitle: activeRoom.title,
      message: messageValue
    };

    namespaceSocket.off("send-message");
    namespaceSocket.emit("send-message", messageData);
    setMessage("");

  };

  useEffect(() => {
    if (!namespaceSocket) {
      return;
    }

    namespaceSocket.off("room-message");
    namespaceSocket.on("room-message", showNewMessage);

  }, [namespaceSocket]);

  const showNewMessage = messageData => {
    setActiveRoom(prevRoomData => {
      const newMessageData = {
        sender: messageData.sender,
        message: messageData.message,
        createdAt: Date.now(),
        _id: crypto.randomUUID()
      };

      const newRoomData = {
        ...prevRoomData,
        messages: [...prevRoomData.messages, newMessageData]
      };

      return newRoomData;
    });
  };

  const getTime = timestamps => {
    const date = new Date(timestamps);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  };

  return (
    <main className="main">
      <section className="costom-row">
        <div className="costom-col-3">
          <section className="sidebar">
            <div className="sidebar__categories">
              <ul className="sidebar__categories-list">
                {namespaces.map((namespace) => (
                  <li
                    key={namespace._id}
                    className={mainNamespace?.title === namespace.title ?
                      "sidebar__categories-item sidebar__categories-item--active" :
                      "sidebar__categories-item"
                    }
                    onClick={() => setMainNamespace(namespace)}
                  >
                    <span className="sidebar__categories-text">
                      {namespace.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sidebar__contact data-category-all sidebar__contact--active">
              <ul className="sidebar__contact-list">
                {mainNamespaceRooms.map(room => (
                  <li className="sidebar__contact-item" key={room._id} onClick={event => selectRoomHandler(event, room)}>
                    <a className="sidebar__contact-link" href="#">
                      <div className="sidebar__contact-left">
                        <div className="sidebar__contact-left-left">
                          <img
                            className="sidebar__contact-avatar"
                            src={room.image ? `http://localhost:3000/uploads/${room.image}` : "public/images/fav.webp"}
                          />
                        </div>
                        <div className="sidebar__contact-left-right">
                          <span className="sidebar__contact-title">
                            {room.title}
                          </span>
                          <div className="sidebar__contact-sender">
                            <span className="sidebar__contact-sender-name">
                              {console.log(room.messages)}
                              {room.messages.length ? `${room.messages.at(-1).sender.name}: ` : ""}
                            </span>
                            <span className="sidebar__contact-sender-text">
                              {room.messages.length ?
                                `${room.messages.at(-1).message.slice(0, 17)} ${room.messages.at(-1).message.length > 17 ? "..." : ""}` :
                                "No message yet"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="sidebar__contact-right">
                        <span className="sidebar__contact-clock">
                          {room.messages.length ? getTime(room.messages.at(-1).createdAt) : getTime(Date.now())}
                        </span>
                        <span className="sidebar__contact-counter sidebar__counter sidebar__counter-active">
                          66
                        </span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <button className="sidebar-bottom-btn btn-circle rp btn-corner z-depth-1 btn-menu-toggle">
            <span className="tgico animated-button-icon-icon animated-button-icon-icon-first">
              
            </span>
          </button>
        </div>
        <div className="costom-col-9 container-hide">
          <section className="chat">
            <div className={activeRoom?.title ? "chat__header chat__header--active" : "chat__header"}>
              <div className="chat__header-left">
                <button className="btn-icon sidebar-close-button">
                  <span className="tgico button-icon"></span>
                  <span className="badge badge-20 badge-primary is-badge-empty back-unread-badge"></span>
                </button>
                <div className="chat__header-left-left">
                  <img
                    className="chat__header-avatar"
                    src={activeRoom?.image ? `http://localhost:3000/uploads/${activeRoom.image}` : "public/images/fav.webp"}
                  />
                </div>
                <div className="chat__header-left-right">
                  <span className="chat__header-name">{activeRoom?.title}</span>
                  <span className="chat__header-status">
                    {activeRoomStatus}
                  </span>
                </div>
              </div>
              <div className="chat__header-right">
                <div className="chat__header-search icon-phone">
                  <span className="tgico button-icon chat__header-phone-icon"></span>
                </div>
                <div className="chat__header-search">
                  <i className="chat__header-search-icon fa fa-search"></i>
                </div>
                <div className="chat__header-menu">
                  <i className="chat__header-menu-icon fa fa-ellipsis-v"></i>
                </div>
              </div>
            </div>
            <div
              className={activeRoom?.title ? "chat__content chat__content--active" : "chat__content"}
              style={{ position: "relative" }}
            >
              <div className="chat__content-date">
                <span className="chat__content-date-text"> Today </span>
              </div>
              <div className="chat__content-main" style={{ height: "74%", overflow: "auto", paddingRight: "1rem" }}>
                {activeRoom.messages?.map(messageData => messageData.sender === user._id ? (
                  <div
                    key={messageData._id}
                    className="chat__content-receiver-wrapper chat__content-wrapper">
                    <div className="chat__content-receiver">
                      <span className="chat__content-receiver-text">{messageData.message}</span>
                      <span className="chat__content-chat-clock">
                        {getTime(messageData.createdAt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    key={messageData._id}
                    id={messageData._id}
                    className="chat__content-sender-wrapper chat__content-wrapper">
                    <div className="chat__content-sender">
                      <span className="chat__content-sender-text">{messageData.message}</span>
                      <span className="chat__content-chat-clock">
                        {getTime(messageData.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat__content-bottom-bar" style={{ bottom: "5rem" }}>
                <form
                  className="chat__content-bottom-bar-left"
                  style={{ overflow: "hidden", borderRadius: "1rem" }}
                  onSubmit={sendMessageHandler}
                >
                  <input
                    className="chat__content-bottom-bar-input"
                    placeholder="Message"
                    type="text"
                    value={message}
                    onChange={event => typeHandler(event.target.value)}
                  />
                  <i className="chat__content-bottom-bar-icon-left tgico button-icon laugh-icon"></i>
                  <i className="chat__content-bottom-bar-icon-right tgico button-icon file-icon"></i>
                </form>
                <div className="chat__content-bottom-bar-right">
                  <i className="chat__content-bottom-bar-right-icon fa fa-microphone"></i>
                </div>
                <div className="chat__content-bottom-bar-right">
                  <span
                    style={{
                      backgroundColor: "var(--secondary-color)",
                      top: "-37px",
                      fontSize: "2.4rem",
                      visibility: "hidden",
                      opacity: "0",
                    }}
                    className="chat__content-bottom-bar-right-icon tgico button-icon arrow-bottom-icon__active"
                  >
                    
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default Chat;
