const socket = io();



const call = document.getElementById("call");
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

call.hidden = true;

/**
 * @type MediaStream
 */
let myStream;
let muted = false;
let cameraOff = false;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log(devices);
        const cameras = devices.filter(device => device.kind === 'videoinput');
        console.log(cameras);
        const currentCamera = myStream.getVideoTracks()[0];
        console.log(currentCamera);
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) cameras.value = camera.deviceId;
            camerasSelect.append(option);
        })
    }
    catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId){
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: deviceId ? { deviceId } : true
        });
        console.log(myStream);
        myFace.srcObject = myStream;
        if(!deviceId) {
            getCameras();
        }
        setMute(true);
    }
    catch(e) {
        alert(e);
        console.log(e);
    }
}

function setMute(mute) {
    const audioTracks = myStream.getAudioTracks();
    console.log(audioTracks);
    if(mute) {
        muteBtn.innerText = "UnMute";
        muted = true;
        audioTracks.forEach(track => track.enabled = false);
    }
    else {
        muteBtn.innerText = "Mute";
        muted = false;
        audioTracks.forEach(track => track.enabled = true);
    }
}
function handleMuteClick() {
    setMute(!muted);
}
function handleMuteCameraClick() {
    const cameraTracks = myStream.getVideoTracks();
    console.log(cameraTracks);
    if(cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
        cameraTracks.forEach(track => track.enabled = true);
    }
    else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
        cameraTracks.forEach(track => track.enabled = false);
    }
}
async function handleCameraChange() {
    await getMedia(cameras.value);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind === 'video');
        videoSender.replaceTrack(videoTrack);
    }
}
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleMuteCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);





const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
let room = "";
/**
 * @type RTCPeerConnection[]
 */
let peerConnections = {};

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = document.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value, socket.id);
    room = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);


// socket code

socket.on("welcome", async(newbieID) => {
    // ????????? ?????? ????????? ???????????? ?????????
    const offer = await makeConnection(newbieID);
    console.log("someone joined");
    // ???????????? ??? ????????? offer??? ????????????.
    socket.emit("offer", offer, room, newbieID, socket.id);
    console.log("send the offer");
});
socket.on("leave", (leaveId) => {
    const video = document.getElementById(leaveId);
    video.remove();
});
socket.on("offer", async(offer, offersId) => {
    console.log("receive the offer");
    console.log(offer);
    // ????????? ?????? ????????? ?????? ??????????????? offer??? ?????? ????????? ???????????? ?????????, ????????? ?????????.
    const answer = await makeConnection(offersId, offer);
    // ????????? ?????? ?????? ?????? ?????????????????? ?????? ????????????.
    socket.emit("answer", answer, offersId, socket.id);
    console.log("send the answer");
});
socket.on("answer", async(answer, newbieID) => {
    console.log("receive the answer", newbieID);
    // ?????? ?????? ???????????? ????????? ?????? ????????? ???????????? answer??? ????????????.
    peerConnections[newbieID].setRemoteDescription(answer);
});
socket.on("ice", (ice, othersId) => {
    console.log("receive candidate");
    /** ?????? ??????????????? ?????? ice candidate??? ??? ???????????? ?????????. */
    peerConnections[othersId].addIceCandidate(ice);
});


// RTC Code
async function makeConnection(othersId, _offer) {
    const myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                    "stun:stun01.sipphone.com",
                    "stun:stun.ekiga.net",
                    "stun:stun.fwdnet.net",
                    "stun:stun.ideasip.com",
                    "stun:stun.iptel.org",
                    "stun:stun.rixtelecom.se",
                    "stun:stun.schlund.de",
                    "stun:stunserver.org",
                    "stun:stun.softjoys.com",
                    "stun:stun.voiparound.com",
                    "stun:stun.voipbuster.com",
                    "stun:stun.voipstunt.com",
                    "stun:stun.voxgratia.org",
                    "stun:stun.xten.com"
                ]
            }
        ]
    });
    peerConnections[othersId] = myPeerConnection;

    myPeerConnection.addEventListener("icecandidate", (data) => handleIce(data, othersId));
    myPeerConnection.addEventListener("addstream", (data) => handleAddStream(data, othersId));
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));

    let offer = _offer;
    let answer;
    if(!offer) {
        offer = await myPeerConnection.createOffer();
        myPeerConnection.setLocalDescription(offer);
    }
    else {
        myPeerConnection.setRemoteDescription(offer);
        answer = await myPeerConnection.createAnswer();
        myPeerConnection.setLocalDescription(answer);
    }

    return answer || offer;
}

/**
 * 
 * @param {RTCPeerConnectionIceEvent} data 
 */
function handleIce(data, othersId) {
    // ice breack??? ?????????? ?????? ?????? ??????????????? ????????????.
    console.log("got ice candidate");
    socket.emit("ice", data.candidate, room, othersId, socket.id);
    console.log("send ice candidate");
}

/**
 * 
 * @param {MediaStreamEvent} data 
 */
function handleAddStream(data, othersId) {
    console.log("got an stream from my peer");
    // stream??? ????????????, ???????????? ?????? ???????????? ????????????.
    const video = document.createElement("video");
    document.getElementById("othersStream").appendChild(video);
    video.id = othersId;
    video.autoplay = true;
    video.playsInline = true;
    video.style.backgroundColor = "blue";
    video.width = 400;
    video.height = 400;
    video.srcObject = data.stream;
}