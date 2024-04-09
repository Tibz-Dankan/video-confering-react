import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Peer from "peerjs";

const App: React.FC = () => {
  const videoGridRef = useRef<HTMLVideoElement>(null);
  const [text, setText] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  let [user, setUser] = useState<string | null>(null);
  // const socket = useRef<Socket | null>(null);
  const socket = useRef<Socket | null>(io("http://localhost:3030"));
  const peer = useRef<Peer | null>(null);

  useEffect(() => {
    const initializeMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        const video = document.createElement("video");
        addVideoStream(video, stream);

        // socket.current = io("http://localhost:3030");
        peer.current = new Peer({
          host: "127.0.0.1",
          port: 3030,
          path: "/peerjs",
          config: {
            iceServers: [
              { urls: "stun:stun01.sipphone.com" },
              { urls: "stun:stun.ekiga.net" },
              { url: "stun:stunserver.org" },
              { url: "stun:stun.softjoys.com" },
              { url: "stun:stun.voiparound.com" },
              { url: "stun:stun.voipbuster.com" },
              { url: "stun:stun.voipstunt.com" },
              { url: "stun:stun.voxgratia.org" },
              { url: "stun:stun.xten.com" },
              {
                url: "turn:192.158.29.39:3478?transport=udp",
                credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
                username: "28224511:1379330808",
              },
              {
                url: "turn:192.158.29.39:3478?transport=tcp",
                credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
                username: "28224511:1379330808",
              },
            ],
          },
          debug: 3,
        });

        if (!peer.current) return;
        console.log("socket.current:::", socket.current);
        console.log("peer.current:::", peer.current);

        peer.current.on("open", (id) => {
          console.log("my id is" + id);

          if (!socket.current?.connected) return;

          console.log("Joining video conf chat room...");
          socket.current?.emit("join-room", "ROOM_ID", id, "user");

          // socket.current.on("connect", () => {
          //   console.log("Joining video conf chat room...");

          //   socket.current?.emit("join-room", "ROOM_ID", id, "user");
          // });
        });

        peer.current.on("call", (call) => {
          console.log("someone call me");
          call.answer(stream);
          const video = document.createElement("video");
          call.on("stream", (userVideoStream) => {
            addVideoStream(video, userVideoStream);
          });
        });

        socket.current?.on("user-connected", (userId: string) => {
          console.log("New user connected::::=>", userId);
          connectToNewUser(userId, stream);
        });

        socket.current?.on(
          "createMessage",
          (message: string, userName: string) => {
            setMessages((prevMessages) => [
              ...prevMessages,
              `${userName === user ? "me" : userName}: ${message}`,
            ]);
          }
        );
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    const addVideoStream = (video: HTMLVideoElement, stream: MediaStream) => {
      const videoGrid = document.getElementById("video-grid")!;

      video.srcObject = stream;
      video.addEventListener("loadedmetadata", () => {
        video.play();
        videoGrid.append(video);
      });
    };

    const connectToNewUser = (userId: string, stream: MediaStream) => {
      console.log("I call someone" + userId);
      const call = peer.current?.call(userId, stream);
      if (call) {
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
      }
    };

    initializeMediaStream();

    return () => {
      // Clean up resources
      // if (myVideoStream) {
      //   myVideoStream.getTracks().forEach((track) => {
      //     track.stop();
      //   });
      // }
      // if (socket.current) {
      //   socket.current.disconnect();
      // }
      // if (peer.current) {
      //   peer.current.destroy();
      // }
    };
  }, [user]);

  const sendMessage = () => {
    if (text.trim() !== "") {
      socket.current?.emit("message", text.trim());
      setText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div>
      <div id="video-grid"></div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button onClick={sendMessage}>Send</button>
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
    </div>
  );
};

export default App;
