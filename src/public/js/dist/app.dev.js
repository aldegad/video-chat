"use strict";

var socket = io();
var call = document.getElementById("call");
var myFace = document.getElementById("myFace");
var muteBtn = document.getElementById("mute");
var cameraBtn = document.getElementById("camera");
var camerasSelect = document.getElementById("cameras");
call.hidden = true;
/**
 * @type MediaStream
 */

var myStream;
var muted = false;
var cameraOff = false;

function getCameras() {
  var devices, _cameras, currentCamera;

  return regeneratorRuntime.async(function getCameras$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(navigator.mediaDevices.enumerateDevices());

        case 3:
          devices = _context.sent;
          console.log(devices);
          _cameras = devices.filter(function (device) {
            return device.kind === 'videoinput';
          });
          console.log(_cameras);
          currentCamera = myStream.getVideoTracks()[0];
          console.log(currentCamera);

          _cameras.forEach(function (camera) {
            var option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label) _cameras.value = camera.deviceId;
            camerasSelect.append(option);
          });

          _context.next = 15;
          break;

        case 12:
          _context.prev = 12;
          _context.t0 = _context["catch"](0);
          console.log(_context.t0);

        case 15:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 12]]);
}

function getMedia(deviceId) {
  return regeneratorRuntime.async(function getMedia$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(navigator.mediaDevices.getUserMedia({
            audio: true,
            video: deviceId ? {
              deviceId: deviceId
            } : true
          }));

        case 3:
          myStream = _context2.sent;
          console.log(myStream);
          myFace.srcObject = myStream;

          if (!deviceId) {
            getCameras();
          }

          setMute(true);
          _context2.next = 14;
          break;

        case 10:
          _context2.prev = 10;
          _context2.t0 = _context2["catch"](0);
          alert(_context2.t0);
          console.log(_context2.t0);

        case 14:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 10]]);
}

function setMute(mute) {
  var audioTracks = myStream.getAudioTracks();
  console.log(audioTracks);

  if (mute) {
    muteBtn.innerText = "UnMute";
    muted = true;
    audioTracks.forEach(function (track) {
      return track.enabled = false;
    });
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
    audioTracks.forEach(function (track) {
      return track.enabled = true;
    });
  }
}

function handleMuteClick() {
  setMute(!muted);
}

function handleMuteCameraClick() {
  var cameraTracks = myStream.getVideoTracks();
  console.log(cameraTracks);

  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
    cameraTracks.forEach(function (track) {
      return track.enabled = true;
    });
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
    cameraTracks.forEach(function (track) {
      return track.enabled = false;
    });
  }
}

function handleCameraChange() {
  var videoTrack, videoSender;
  return regeneratorRuntime.async(function handleCameraChange$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(getMedia(cameras.value));

        case 2:
          if (myPeerConnection) {
            videoTrack = myStream.getVideoTracks()[0];
            videoSender = myPeerConnection.getSenders().find(function (sender) {
              return sender.track.kind === 'video';
            });
            videoSender.replaceTrack(videoTrack);
          }

        case 3:
        case "end":
          return _context3.stop();
      }
    }
  });
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleMuteCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);
var welcome = document.getElementById("welcome");
var welcomeForm = welcome.querySelector("form");
var room = "";
/**
 * @type RTCPeerConnection[]
 */

var peerConnections = {};

function initCall() {
  return regeneratorRuntime.async(function initCall$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          welcome.hidden = true;
          call.hidden = false;
          _context4.next = 4;
          return regeneratorRuntime.awrap(getMedia());

        case 4:
        case "end":
          return _context4.stop();
      }
    }
  });
}

function handleWelcomeSubmit(event) {
  var input;
  return regeneratorRuntime.async(function handleWelcomeSubmit$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          event.preventDefault();
          input = document.querySelector("input");
          _context5.next = 4;
          return regeneratorRuntime.awrap(initCall());

        case 4:
          socket.emit("join_room", input.value, socket.id);
          room = input.value;
          input.value = "";

        case 7:
        case "end":
          return _context5.stop();
      }
    }
  });
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit); // socket code

socket.on("welcome", function _callee(newbieID) {
  var offer;
  return regeneratorRuntime.async(function _callee$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return regeneratorRuntime.awrap(makeConnection(newbieID));

        case 2:
          offer = _context6.sent;
          console.log("someone joined"); // 뉴비에게 내 정보와 offer를 전달한다.

          socket.emit("offer", offer, room, newbieID, socket.id);
          console.log("send the offer");

        case 6:
        case "end":
          return _context6.stop();
      }
    }
  });
});
socket.on("leave", function (leaveId) {
  var video = document.getElementById(leaveId);
  video.remove();
});
socket.on("offer", function _callee2(offer, offersId) {
  var answer;
  return regeneratorRuntime.async(function _callee2$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          console.log("receive the offer");
          console.log(offer); // 뉴비는 현재 방안에 있던 모든사람의 offer를 받아 새로운 커넥션을 만들고, 답장을 만든다.

          _context7.next = 4;
          return regeneratorRuntime.awrap(makeConnection(offersId, offer));

        case 4:
          answer = _context7.sent;
          // 답장을 현재 있는 받은 커넥션들에게 각각 보내준다.
          socket.emit("answer", answer, offersId, socket.id);
          console.log("send the answer");

        case 7:
        case "end":
          return _context7.stop();
      }
    }
  });
});
socket.on("answer", function _callee3(answer, newbieID) {
  return regeneratorRuntime.async(function _callee3$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          console.log("receive the answer", newbieID); // 방에 있던 사람들은 뉴비를 위해 생성한 커섹션에 answer를 추가한다.

          peerConnections[newbieID].setRemoteDescription(answer);

        case 2:
        case "end":
          return _context8.stop();
      }
    }
  });
});
socket.on("ice", function (ice, othersId) {
  console.log("receive candidate");
  /** 다른 사람에게서 받은 ice candidate를 각 커넥션에 넣는다. */

  peerConnections[othersId].addIceCandidate(ice);
}); // RTC Code

function makeConnection(othersId, _offer) {
  var myPeerConnection, offer, answer;
  return regeneratorRuntime.async(function makeConnection$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          myPeerConnection = new RTCPeerConnection({
            iceServers: [{
              urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302", "stun:stun4.l.google.com:19302", "stun:stun01.sipphone.com", "stun:stun.ekiga.net", "stun:stun.fwdnet.net", "stun:stun.ideasip.com", "stun:stun.iptel.org", "stun:stun.rixtelecom.se", "stun:stun.schlund.de", "stun:stunserver.org", "stun:stun.softjoys.com", "stun:stun.voiparound.com", "stun:stun.voipbuster.com", "stun:stun.voipstunt.com", "stun:stun.voxgratia.org", "stun:stun.xten.com"]
            }]
          });
          peerConnections[othersId] = myPeerConnection;
          myPeerConnection.addEventListener("icecandidate", function (data) {
            return handleIce(data, othersId);
          });
          myPeerConnection.addEventListener("addstream", function (data) {
            return handleAddStream(data, othersId);
          });
          myStream.getTracks().forEach(function (track) {
            return myPeerConnection.addTrack(track, myStream);
          });
          offer = _offer;

          if (offer) {
            _context9.next = 13;
            break;
          }

          _context9.next = 9;
          return regeneratorRuntime.awrap(myPeerConnection.createOffer());

        case 9:
          offer = _context9.sent;
          myPeerConnection.setLocalDescription(offer);
          _context9.next = 18;
          break;

        case 13:
          myPeerConnection.setRemoteDescription(offer);
          _context9.next = 16;
          return regeneratorRuntime.awrap(myPeerConnection.createAnswer());

        case 16:
          answer = _context9.sent;
          myPeerConnection.setLocalDescription(answer);

        case 18:
          return _context9.abrupt("return", answer || offer);

        case 19:
        case "end":
          return _context9.stop();
      }
    }
  });
}
/**
 * 
 * @param {RTCPeerConnectionIceEvent} data 
 */


function handleIce(data, othersId) {
  // ice breack가 생기면? 이를 해당 사람들에게 전달한다.
  console.log("got ice candidate");
  socket.emit("ice", data.candidate, room, othersId, socket.id);
  console.log("send ice candidate");
}
/**
 * 
 * @param {MediaStreamEvent} data 
 */


function handleAddStream(data, othersId) {
  console.log("got an stream from my peer"); // stream을 받아오면, 비디오를 새로 생성하고 넣어준다.

  var video = document.createElement("video");
  document.getElementById("othersStream").appendChild(video);
  video.id = othersId;
  video.autoplay = true;
  video.playsInline = true;
  video.style.backgroundColor = "blue";
  video.width = 400;
  video.height = 400;
  video.srcObject = data.stream;
}