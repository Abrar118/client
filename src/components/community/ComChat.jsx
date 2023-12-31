import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import PortalPopup from "../PortalPopup";
import ScaleLoader from "react-spinners/ScaleLoader";
import "../../styles/community/comChat.css";

import { getFormattedDateWithTime } from "../utility/time";

import { BiCopy as CopyIcon } from "react-icons/bi";
import { AiFillAudio as AuidoIcon } from "react-icons/ai";
import { ImAttachment as AttachmentIcon } from "react-icons/im";
import {
  BsSend as SendIcon,
  BsFillReplyFill as ReplyIcon,
  BsGlobe as PublicIcon,
} from "react-icons/bs";
import { useNavigate, useParams } from "react-router-dom";
import { signal } from "@preact/signals-react";
import { io } from "socket.io-client";
import ScrollToBottom from "react-scroll-to-bottom";

const community = signal({});
const socket = io(import.meta.env.VITE_CURRENT_PATH, {
  transports: ["websocket"],
});

function ComChat() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const [manageMembers, setManageMembers] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [comName, setComName] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]); // [ { sender: "user", message: "message" } ]
  const [text, setText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [offlieUsers, setOfflineUsers] = useState([]);
  const comAdmin = useRef(0);
  const currentTag = useParams().tag;
  const attachment = useRef(null);
  const navigate = useNavigate();

  const toggleManageMembers = () => {
    setManageMembers(!manageMembers);
  };

  const getAdmin = async () => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_CURRENT_PATH + `/get_communityByTag/${currentTag}`
      );
      comAdmin.current = res.data.admin;
      community.value = res.data;
      setComName(res.data.name);
      setShowDelete(comAdmin.current === user.student_id);
    } catch (err) {
      console.log(err);
    }
  };

  const getOnlineUsers = async () => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_CURRENT_PATH + `/getOnlineUsers/${currentTag}`
      );
      setOnlineUsers(res.data.online);
      setOfflineUsers(res.data.offline);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteCommunity = async () => {
    setLoading(true);
    const reposnse = await axios
      .delete(import.meta.env.VITE_CURRENT_PATH + `/deleteCom/${currentTag}`)
      .catch((err) => {
        if (err.response?.status === 500) {
          toast.error("Something went wrong");
        }
      });

    const data = reposnse.data;
    if (data.acknowledged) {
      setLoading(false);
      toast.success("Community deleted successfully");
      navigate("/profile/my-commnunities");
    } else {
      toast.error("Something went wrong");
    }
  };

  const leaveCommunity = async () => {
    setLoading(true);
    let terminate = false;
    const reposnse = await axios
      .patch(import.meta.env.VITE_CURRENT_PATH + "/leaveCommunity", {
        tag: currentTag,
        studentId: user.student_id,
      })
      .catch((err) => {
        if (err.response?.status === 500) {
          toast.error("Something went wrong");
          terminate = true;
        }
      });

    if (terminate) return;

    if (reposnse.status === 200) {
      setLoading(false);
      user.community = user.community.filter((tag) => tag !== currentTag);
      localStorage.setItem("currentUser", JSON.stringify(user));
      toast.success("Community left successfully");
      navigate("/profile/my-commnunities");
    } else {
      toast.error("Something went wrong");
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (e.key === "Enter") {
      socket.emit("sendMessage", {
        user: user,
        body: text,
      });
      setText("");
    } else setText(e.target.value);
  };

  useEffect(() => {
    getAdmin();
    getOnlineUsers();

    socket.emit("joinComChat", {
      user: user,
      comTag: currentTag,
    });
  }, []);

  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
  }, [socket]);

  return (
    <motion.div layout className="com-chat">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ease: "easeIn", duration: 0.3 }}
        className="chat-window"
      >
        <div className="title">{comName} Chatroom</div>
        <div className="chat-holder">
          <ScrollToBottom
            initialScrollBehavior="smooth"
            className="chat-holder-scroll"
            followButtonClassName="follow-button"
            scrollViewClassName="scroll-view"
          >
            {messages.map((message, index) => (
              <ChatRow user={message.user} message={message.body} key={index} />
            ))}
          </ScrollToBottom>
        </div>
        <form className="message-field">
          <motion.div
            whileHover={{ scale: 1.1, cursor: "pointer", color: "#ee4962" }}
            whileTap={{ scale: 0.9 }}
            className="audio-icon"
            title="Attach audio file"
          >
            <AuidoIcon />
          </motion.div>
          <textarea
            required
            name="message"
            id="message"
            cols="30"
            rows="10"
            placeholder="What do you want to say today"
            className="message-input"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            // onKeyDown={sendMessage}
          />
          <motion.div
            whileHover={{ scale: 1.1, cursor: "pointer", color: "#ee4962" }}
            whileTap={{ scale: 0.9 }}
            className="attach-icon"
            title="Attach file"
            onClick={() => attachment.current.click()}
          >
            <AttachmentIcon />
          </motion.div>
          <input
            type="file"
            name="file"
            id="file"
            ref={attachment}
            style={{ display: "none" }}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.1, cursor: "pointer" }}
            whileTap={{ scale: 0.9 }}
            className="send-icon"
            onClick={(e) => {
              e.preventDefault();
              socket.emit("sendMessage", {
                user: user,
                body: text,
                room: currentTag,
              });
              setText("");
            }}
          >
            <SendIcon style={{ color: "GrayText" }} />
          </motion.button>
        </form>
      </motion.div>

      <motion.div className="members">
        <div className="onoff-list">
          <motion.div
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ease: "easeIn", duration: 0.3 }}
            className="online"
          >
            <div className="title">Currently Online</div>
            {onlineUsers.map((user, index) => (
              <OnlineOffline user={user} key={index} />
            ))}
          </motion.div>
          <div className="divider" />
          <motion.div
            initial={{ x: -500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ease: "easeIn", duration: 0.3 }}
            className="offline"
          >
            <div className="title">Offline</div>
            {offlieUsers.map((user, index) => (
              <OnlineOffline user={user} key={index} />
            ))}
          </motion.div>
        </div>
        <div className="manage-buttons">
          <motion.button
            whileHover={{
              scale: 1.04,
              backgroundColor: "#ee4962",
              color: "#fff",
            }}
            whileTap={{ scale: 0.9 }}
            className="member-mng"
            onClick={() => {
              if (comAdmin.current === user.student_id) {
                toggleManageMembers();
              } else {
                toast.error("You are not an admin of this community");
              }
            }}
          >
            Manage Members
          </motion.button>

          <motion.button
            whileHover={{
              scale: 1.04,
              backgroundColor: "#ee4962",
              color: "#fff",
            }}
            whileTap={{ scale: 0.9 }}
            className="member-mng"
            onClick={() => {
              if (showDelete) {
                deleteCommunity();
              } else {
                leaveCommunity();
              }
            }}
          >
            {showDelete ? "Delete Community" : "Leave Community"}
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence initial={false} mode="wait" onExitComplete={() => null}>
        {manageMembers && (
          <PortalPopup
            overlayColor="rgba(0,0,0, 0.5)"
            placement="Centered"
            onOutsideClick={toggleManageMembers}
          >
            <ManageMembers />
          </PortalPopup>
        )}
      </AnimatePresence>

      {loading && (
        <PortalPopup overlayColor="rgba(0,0,0, 0.5)" placement="Centered">
          <ScaleLoader color="#36d7b7" height={35} width={5} />
        </PortalPopup>
      )}
    </motion.div>
  );
}

export const ChatRow = ({ user, message }) => {
  const [showCopy, setShowCopy] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
  )?.student_id;

  return (
    <div
      className="chat-row"
      onMouseEnter={() => {
        setShowReply(true);
      }}
      onMouseLeave={() => {
        setShowReply(false);
      }}
    >
      <img src={user.avatar} alt="avatar" className="sender-avatar" />
      <div className="message-body">
        <div className="name-date">
          <div className="actual-name-date">
            <div className="name">{user.name}</div>
            <div className="date">
              {getFormattedDateWithTime(new Date("2023-10-30T15:14:44.195Z"))}
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.04, cursor: "pointer", color: "#ee4962" }}
            whileTap={{ scale: 0.9 }}
            className="copy-icon"
            onClick={() => {
              navigator.clipboard.writeText(message);
              setShowCopy(true);
              setTimeout(() => {
                setShowCopy(false);
              }, 500);
            }}
          >
            <CopyIcon />
            {showCopy && (
              <AnimatePresence
                initial={false}
                mode="wait"
                onExitComplete={() => null}
              >
                <motion.div
                  initial={{ width: 0, opacity: 0, fontSize: 0 }}
                  animate={{
                    width: "fit-content",
                    opacity: 1,
                    fontSize: "0.8rem",
                  }}
                  exit={{ width: 0, opacity: 0, fontSize: 0 }}
                  transition={{ duration: 0.2, ease: "easeIn" }}
                  className="copy-message"
                >
                  copied
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
        <div className="main-text">
          <div className="main-actual-text">{message}</div>
          {showReply && (
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: "#ee4962" }}
              whileTap={{ scale: 0.9 }}
              className="reply-icon"
            >
              <ReplyIcon /> Reply
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export const OnlineOffline = ({ user }) => {
  return (
    <div className="online-offline">
      <div className="image-name">
        <img src={user.avatar} alt="avatar" className="online-image" />
        <div className="online-name">{user.name}</div>
      </div>
    </div>
  );
};

export const ManageMembers = () => {
  const user = JSON.parse(window.localStorage.getItem("currentUser"));
  const [requests, setRequests] = useState([]);
  const [invitationId, setInvitationId] = useState(0);
  const currentTag = useParams().tag;

  const getRequests = async () => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_CURRENT_PATH + `/getRequests/${currentTag}`
      );
      setRequests(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleRequest = async ({ confirm, tag, id }) => {
    try {
      await axios.patch(import.meta.env.VITE_CURRENT_PATH + "/handleRequest", {
        confirm: confirm,
        tag: tag,
        id: id,
      });

      getRequests();
    } catch (err) {
      console.log(err);
    }
  };

  const sendInvitation = async (e) => {
    e.preventDefault();

    const invitation = {
      messageBody: `${user.name} has invited you to join his community`,
      title: community.value.name,
      date: new Date().toISOString(),
      type: "invitation",
      status: "unread",
      comTag: currentTag,
      comName: community.value.name,
    };

    const response = await axios
      .patch(
        import.meta.env.VITE_CURRENT_PATH + `/sendInvitation/${invitationId}`,
        invitation
      )
      .catch((err) => {
        if (err.response?.status === 500) {
          toast.error("Something went wrong");
        }
      });

    if (response.status === 201) {
      toast.warning("Already a member of this community");
      return;
    } else if (response.status === 202) {
      toast.warning("User does not exists");
      return;
    }

    const data = response.data;
    if (data.acknowledged) {
      toast.success("Invitation sent successfully");
      socket.emit("sendInvitation", {
        invitationId: Number(invitationId),
        sender: user.student_id,
        comName: community.value.name,
      });
    } else {
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    getRequests();
  }, []);

  const RequestRow = ({ request }) => {
    return (
      <div className="request-row">
        <div className="image-name">
          <img src={request.avatar} alt="avatar" className="image" />
          <div className="name">{request.name}</div>
        </div>

        <div className="buttons">
          <motion.button
            whileHover={{
              scale: 1.04,
              backgroundColor: "#f6c90e",
              color: "#000000",
            }}
            whileTap={{ scale: 0.9 }}
            className="confirm"
            style={{ color: "#b6f09c" }}
            onClick={() =>
              handleRequest({ confirm: "yes", tag: currentTag, id: request.id })
            }
          >
            Confirm
          </motion.button>
          <motion.button
            whileHover={{
              scale: 1.04,
              backgroundColor: "#ee4962",
              color: "#ffffff",
            }}
            whileTap={{ scale: 0.9 }}
            className="confirm"
            style={{ color: "#ee4962" }}
            onClick={() =>
              handleRequest({ confirm: "no", tag: currentTag, id: request.id })
            }
          >
            Decline
          </motion.button>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ ease: "easeIn", duration: 0.3 }}
      exit={{ scale: 0.5, transition: { ease: "easeIn", duration: 0.2 } }}
      className="manage-members"
    >
      <div className="title-wrapper">
        <div className="title">Manage members of your community</div>
        <div className="subtitle">
          Review requests to join your community and invite new members
        </div>
      </div>

      <form className="invitation-send" onSubmit={sendInvitation}>
        <div className="public-icon">
          <PublicIcon />
        </div>
        <input
          required
          type="text"
          className="invitation-field"
          placeholder="Send invitation by student ID"
          onChange={(e) => setInvitationId(e.target.value)}
        />
        <motion.button
          whileHover={{
            scale: 1.04,
            backgroundColor: "#ee4962",
            color: "#ffffff",
          }}
          whileTap={{ scale: 0.9 }}
          type="submit"
          className="invitation-button"
        >
          Invite
        </motion.button>
      </form>

      <div className="request-list">
        {requests.length === 0 ? (
          <div
            style={{
              fontFamily: "poppins",
              position: "relative",
              left: "30%",
              top: "30%",
              color: "gray",
            }}
          >
            No requests to join this community
          </div>
        ) : (
          requests.map((request) => (
            <RequestRow request={request} key={request.id} />
          ))
        )}
      </div>
    </motion.div>
  );
};

export default ComChat;
