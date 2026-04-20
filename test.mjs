import { io } from "socket.io-client";
import fs from "fs";
const socket = io("http://localhost:5000");
socket.on("connect", () => {
    console.log("Connected");
    const buffer = fs.readFileSync("c:/Users/hp/Desktop/partex-ai/test_consultation.wav");
    socket.emit("audio:upload", { patientId: "PAT-TEST", audioBuffer: buffer, mimetype: "audio/wav" });
});
socket.on("extraction:progress", (d) => console.log(d));
socket.on("extraction:complete", (d) => { console.log(d); process.exit(0); });
socket.on("error", (d) => { console.log("ERR", d); process.exit(1); });
