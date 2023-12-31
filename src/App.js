import './App.css';
import React, { useState, useRef, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
// import TodoTemplate from './components/todo/todo';
import VideoTemplate from "./components/video/video";
import CameraButtonTemplate from "./components/button/CameraButton";
// import MiceButtonTemplate from "./components/button/MiceButton";
// import { WebRTCUser } from "./types";

const pc_config = {
  iceServers: [
    // {
    //   urls: 'stun:[STUN_IP]:[PORT]',
    //   'credentials': '[YOR CREDENTIALS]',
    //   'username': '[USERNAME]'
    // },
    {
      urls: "stun:stun.l.google.com:19302",
    },
    // {
    //   urls: "turn:a.relay.metered.ca:80",
    //   username: "58e686be527c0068cfb5ba6d",
    //   credential: "ka326fwi9Pp+JP8w",
    // },
    {
      urls: "turn:a.relay.metered.ca:80",
      username: "58e686be527c0068cfb5ba6d",
      credential: "ka326fwi9Pp+JP8w",
    },
    // {
    //   urls: "turn:a.relay.metered.ca:443",
    //   username: "58e686be527c0068cfb5ba6d",
    //   credential: "ka326fwi9Pp+JP8w",
    // },
    // {
    //   urls: "turn:a.relay.metered.ca:443?transport=tcp",
    //   username: "58e686be527c0068cfb5ba6d",
    //   credential: "ka326fwi9Pp+JP8w",
    // },
  ],
};
//
const SOCKET_SERVER_URL = "http://43.201.165.228:3000";


function App() {
  const [Camera, setCamera] = useState(true); //카메라 on off
  // const [Mice, setMice] = useState(true); //마이크 on off



  const socketRef = useRef(null); //소켓 연결해서 데이터 받는 부분
  const localStreamRef = useRef(null);
  const sendPCRef = useRef(null);
  const receivePCsRef = useRef(null);
  const [users, setUsers] = useState([]);

  const localVideoRef = useRef(null);
  // const remoteVideoRef = useRef(null);


  const onModalDisplay = (x) => {
    console.log(x);
    setCamera(x);

    if (x) {
      getLocalStream();
      // const pc = new RTCPeerConnection(pc_config);

      // localStreamRef.current.getTracks().forEach((track) => {
      //   if (!localStreamRef.current) return;
      //   pc.addTrack(track, localStreamRef.current);
      // });
    } else {
      const vidTrack = localStreamRef.current.getVideoTracks();
      vidTrack.forEach(track => {
        localStreamRef.current.removeTrack(track);
      });
    }


  };

  const closeReceivePC = useCallback((id) => {
    if (!receivePCsRef.current[id]) return;
    receivePCsRef.current[id].close();
    delete receivePCsRef.current[id];
  }, []);

  const createReceiverOffer = useCallback(
    async (pc, senderSocketID) => {
      try {
        const sdp = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        console.log("create receiver offer success");

        await pc.setLocalDescription(new RTCSessionDescription(sdp));

        if (!socketRef.current) return;
        socketRef.current.emit("receiverOffer", {
          sdp,
          receiverSocketID: socketRef.current.id,
          senderSocketID,
          roomID: "1234",
        });
      } catch (error) {
        console.log(error);
      }
    },
    []
  );

  //받은 스트림 피어 연결
  const createReceiverPeerConnection = useCallback((socketID) => {
    try {
      const pc = new RTCPeerConnection(pc_config);

      // add pc to peerConnections object
      receivePCsRef.current = { ...receivePCsRef.current, [socketID]: pc };
      pc.onicecandidate = (e) => {
        console.log("onicecandidate");
        console.log(e);
        console.log("onicecandidate");

        if (!(e.candidate && socketRef.current)) return;
        console.log("receiver PC onicecandidate");
        socketRef.current.emit("receiverCandidate", {
          candidate: e.candidate,
          receiverSocketID: socketRef.current.id,
          senderSocketID: socketID,
        });
      };

      pc.oniceconnectionstatechange = (e) => {
        console.log("oniceconnectionstatechange remote");
        console.log(e);
        console.log(e.currentTarget.iceConnectionState);

        console.log("oniceconnectionstatechange remote");
        //연결 되었는지 체크 해주는 부분
      };

      // console.log("users");
      // console.log(users);

      //유저 추가하는 부분
      pc.ontrack = (e) => {
        console.log("users 추가");
        console.log(socketID);
        // console.log(e.streams[0]);

        // if (remoteVideoRef.current) {
        //   remoteVideoRef.current.srcObject = e.streams[0];
        // }

        console.log("ontrack success");
        setUsers((oldUsers) =>
          oldUsers
            .filter((user) => user.id !== socketID)
            .concat({
              id: socketID,
              stream: e.streams[0],
            })
        );

        // const remote_user = {
        //   //users: {
        //   id: socketID,
        //   stream: e.streams[0],
        //   //}
        // }
        // setUsers(users.concat(remote_user));

        // console.log("users *** ");
        // console.log(remote_user);
        // console.log(users);
        // console.log("users *** ");


      };

      // return pc
      return pc;
    } catch (e) {
      console.error(e);
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //받은 스트림을 만들어라.
  const createReceivePC = useCallback(
    (id) => {
      try {
        console.log(`socketID(${id}) user entered`); // 로그 찍힘
        const pc = createReceiverPeerConnection(id); //상대 리모트 아이디를 갖고 있음 
        if (!(socketRef.current && pc)) return;
        createReceiverOffer(pc, id);
      } catch (error) {
        console.log(error);
      }
    },
    [createReceiverOffer, createReceiverPeerConnection]
  );

  //전송할 offer를 만든다
  const createSenderOffer = useCallback(async () => {
    try {
      //sdp 생성
      if (!sendPCRef.current) return;
      const sdp = await sendPCRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      console.log("create sender offer success");
      await sendPCRef.current.setLocalDescription(
        new RTCSessionDescription(sdp)
      );

      console.log("createSenderOffer");
      console.log(sdp);
      console.log(socketRef.current.id);
      console.log("createSenderOffer");

      if (!socketRef.current) return;
      socketRef.current.emit("senderOffer", {
        sdp,
        senderSocketID: socketRef.current.id,
        roomID: "1234",
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

  //내 영상 피어 연결
  const createSenderPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(pc_config);

    //새롭게 넣어줌.
    // pc.ontrack = (e) => {
    //   console.log("ontrack");
    //   console.log(e);
    //   console.log("ontrack");

    //   if (e.track.kind === 'audio') {
    //     return
    //   }

    //   let el = document.createElement(e.track.kind)
    //   el.srcObject = e.streams[0]
    //   el.autoplay = true
    //   el.controls = true
    //   document.getElementById('remoteVideoRef').appendChild(el)

    //   e.track.onmute = function (event) {
    //     el.play()
    //   }

    //   e.streams[0].onremovetrack = ({ track }) => {
    //     if (el.parentNode) {
    //       el.parentNode.removeChild(el)
    //     }
    //   }
    // }

    pc.onicecandidate = (e) => {
      if (!(e.candidate && socketRef.current)) return;
      console.log("sender PC onicecandidate");
      console.log(e.candidate);


      socketRef.current.emit("senderCandidate", {
        candidate: e.candidate,
        senderSocketID: socketRef.current.id,
      });
    };

    pc.oniceconnectionstatechange = (e) => {
      console.log("oniceconnectionstatechange local");
      console.log(e);
      console.log(e.currentTarget.iceConnectionState);
      console.log("oniceconnectionstatechange local");
    };

    if (localStreamRef.current) {
      console.log("add local stream");
      localStreamRef.current.getTracks().forEach((track) => {
        if (!localStreamRef.current) return;
        pc.addTrack(track, localStreamRef.current);
      });
    } else {
      console.log("no local stream");
    }

    sendPCRef.current = pc;
  }, []);

  //내 카메라 동작
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      if (!socketRef.current) return;

      //내 피어 연결을 만든다.
      createSenderPeerConnection();

      //전송할 offer를 만든다
      await createSenderOffer();

      console.log("socket ID");
      console.log(socketRef.current.id);
      console.log("socket ID");

      //방 참여 
      socketRef.current.emit("joinRoom", {
        id: socketRef.current.id,
        roomID: "1234",
      });
    } catch (e) {
      console.log(`getUserMedia error: ${e}`);
    }
  }, [createSenderOffer, createSenderPeerConnection]);


  //메서드 시작하는 부분
  useEffect(() => {
    //소켓 연결 : 성공
    socketRef.current = io.connect(SOCKET_SERVER_URL);

    //내 카메라 동작
    getLocalStream();

    //상대 유저 입장.
    socketRef.current.on("userEnter", (data) => {
      console.log("on::userEnter");
      createReceivePC(data.id);
      console.log("on::userEnter");
    });

    //방 참여후 모든 유저에게 보내주는 부분 
    socketRef.current.on(
      "allUsers",
      (data) => {
        console.log("allUsers");
        console.log(data);
        console.log("allUsers");

        //한명만 들어왔을때는 데이터가 없어. 
        data.users.forEach((user) => createReceivePC(user.id));
      }
    );

    socketRef.current.on("userExit", (data) => {
      console.log("userExit");
      console.log(data);
      console.log("userExit");

      closeReceivePC(data.id);
      setUsers((users) => users.filter((user) => user.id !== data.id));
    });

    //senderOffer를 서버로 전송후 받아오는 부분
    socketRef.current.on(
      "getSenderAnswer",
      async (data) => {
        console.log("getSenderAnswer");
        console.log(data.sdp);
        console.log("getSenderAnswer");

        try {
          if (!sendPCRef.current) return;
          console.log("get sender answer");
          console.log(data.sdp);

          await sendPCRef.current.setRemoteDescription(
            new RTCSessionDescription(data.sdp)
          );
        } catch (error) {
          console.log(error);
        }
      }
    );

    socketRef.current.on(
      "getSenderCandidate",
      async (data) => {
        console.log("getSenderCandidate");
        console.log(data);
        console.log(data.candidate);
        console.log("getSenderCandidate");

        try {
          if (!(data.candidate && sendPCRef.current)) return;
          console.log("get sender candidate");
          await sendPCRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
          console.log("candidate add success");
        } catch (error) {
          console.log(error);
        }
      }
    );

    //test
    // socketRef.current.on(
    //   "gettest",
    //   async (data) => {
    //     console.log("gettest");
    //     console.log(data);
    //     console.log("gettest");
    //   }
    // );


    socketRef.current.on(
      "getReceiverAnswer",
      async (data) => {
        console.log("getReceiverAnswer");
        console.log(data);
        console.log("getReceiverAnswer");

        try {
          console.log(`get socketID(${data.id})'s answer`); //상대방 리모트 아이디
          const pc = receivePCsRef.current[data.id];
          if (!pc) return;
          await pc.setRemoteDescription(data.sdp);
          console.log(`socketID(${data.id})'s set remote sdp success`);

          //**여기까지 로그 찍힘

        } catch (error) {
          console.log(error);
        }
      }
    );

    socketRef.current.on(
      "getReceiverCandidate",
      async (data) => {

        console.log("getReceiverCandidate");
        console.log(data);
        console.log("getReceiverCandidate");

        try {
          console.log(data);
          console.log(`get socketID(${data.id})'s candidate`);
          const pc = receivePCsRef.current[data.id];
          if (!(pc && data.candidate)) return;
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log(`socketID(${data.id})'s candidate add success`);
        } catch (error) {
          console.log(error);
        }
      }
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (sendPCRef.current) {
        sendPCRef.current.close();
      }
      users.forEach((user) => closeReceivePC(user.id));
    };
    // eslint-disable-next-line
  }, [
    closeReceivePC,
    createReceivePC,
    createSenderOffer,
    createSenderPeerConnection,
    getLocalStream,
  ]);




  return (
    <div>
      <video
        style={{
          width: 500,
          height: 500,
          margin: 5,
          backgroundColor: "black",
        }}
        muted
        ref={localVideoRef}
        autoPlay
      />

      {/* <video
        style={{
          width: 300,
          height: 300,
          margin: 5,
          backgroundColor: "black",
        }}
        muted
        ref={remoteVideoRef}
        autoPlay
      /> */}

      {users.map((user, index) => (
        // index 
        <VideoTemplate key={index} stream={user.stream} />
      ))}


      <CameraButtonTemplate value={Camera} onModalDisplay={onModalDisplay} />
      {/* <MiceButtonTemplate value={Mice} /> */}


      {/* <button onClick={this.handleClick}>camera on</button> */}
      {/* <button >mice on</button> */}
    </div>
  );
}

export default App;
