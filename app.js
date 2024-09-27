// quotes.json preuzeto sa https://gist.githubusercontent.com/nasrulhazim/54b659e43b1035215cd0ba1d4577ee80/raw/e3c6895ce42069f0ee7e991229064f167fe8ccdc/quotes.json
// camera_icon preuzeto sa https://www.freepik.com/icon/camera_1042339#fromView=search&term=camera&page=1&position=5&track=ais&uuid=b49cc02d-ce95-454d-8127-a9c7d3f109cc

const video = document.getElementById("video");
const quote = document.getElementById("quote");
const snap = document.getElementById("snap");
const imageList = document.getElementById("imageList");

let db;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("SW registered!", reg))
      .catch((err) => console.error("Error registering service worker", err));
  });
}

if (!navigator.onLine) {
  quote.textContent =
    "Nažalost, ova motivacijska funkcija ne radi u offline načinu rada. Molimo Vas da se spojite na internet kako biste mogli biti inspirirani.";
} else {
  fetch("public/json/quotes.json")
    .then((response) => response.json())
    .then((data) => {
      const randomQuote =
        data.quotes[Math.floor(Math.random() * data.quotes.length)];
      quote.textContent = randomQuote.quote + " - " + randomQuote.author;
    })
    .catch((err) => {
      //console.log("Error fetching quote", err);
      quote.textContent = "Error fetching quote";
    });
}

const request = indexedDB.open("cameraDB");

request.onupgradeneeded = (e) => {
  db = e.target.result;
  db.createObjectStore("images", { autoIncrement: true });
};

request.onsuccess = (e) => {
  db = e.target.result;
  displayImages();
};

navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
  video.play();
});

snap.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const offscreenContext = canvas.getContext("2d");
  offscreenContext.drawImage(video, 0, 0, 640, 480);
  const borderColor = generateDarkColor();
  offscreenContext.strokeStyle = borderColor;
  offscreenContext.lineWidth = Math.floor(Math.random() * (25 - 10 + 1)) + 10;

  // Draw a wavy border
  const waveSize = 20;
  const waveCount = Math.max(canvas.width, canvas.height) / waveSize;
  offscreenContext.beginPath();
  for (let i = 0; i < waveCount; i++) {
    const x = i * waveSize;
    const y = i % 2 === 0 ? 0 : waveSize;
    offscreenContext.quadraticCurveTo(
      x + waveSize / 2,
      y,
      x + waveSize,
      i % 2 === 0 ? 0 : waveSize
    );
  }
  offscreenContext.rotate(Math.PI / 2);
  offscreenContext.translate(0, -canvas.width);
  for (let i = 0; i < waveCount; i++) {
    const x = i * waveSize;
    const y = i % 2 === 0 ? 0 : waveSize;
    offscreenContext.quadraticCurveTo(
      x + waveSize / 2,
      y,
      x + waveSize,
      i % 2 === 0 ? 0 : waveSize
    );
  }
  offscreenContext.rotate(Math.PI / 2);
  offscreenContext.translate(0, -canvas.height);
  for (let i = 0; i < waveCount; i++) {
    const x = i * waveSize;
    const y = i % 2 === 0 ? 0 : waveSize;
    offscreenContext.quadraticCurveTo(
      x + waveSize / 2,
      y,
      x + waveSize,
      i % 2 === 0 ? 0 : waveSize
    );
  }
  offscreenContext.rotate(Math.PI / 2);
  offscreenContext.translate(0, -canvas.width);
  for (let i = 0; i < waveCount; i++) {
    const x = i * waveSize;
    const y = i % 2 === 0 ? 0 : waveSize;
    offscreenContext.quadraticCurveTo(
      x + waveSize / 2,
      y,
      x + waveSize,
      i % 2 === 0 ? 0 : waveSize
    );
  }
  offscreenContext.stroke();

  const image = canvas.toDataURL("image/png");
  const transaction = db.transaction(["images"], "readwrite");
  const store = transaction.objectStore("images");
  store.add(image);

  transaction.oncomplete = () => {
    displayImages();
  };
});

function displayImages() {
  while (imageList.firstChild) {
    imageList.removeChild(imageList.firstChild);
  }

  const objectStore = db.transaction("images").objectStore("images");
  objectStore.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.justifyContent = "space-between";

      const img = document.createElement("img");
      img.src = cursor.value;
      img.style.marginRight = "10px";
      img.style.marginBottom = "10px";
      div.appendChild(img);

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete photo";
      deleteButton.style.backgroundColor = "#ED5E68";
      deleteButton.style.color = "white";
      deleteButton.style.padding = "15px 32px";
      deleteButton.style.textAlign = "center";
      deleteButton.style.cursor = "pointer";
      deleteButton.style.fontSize = "16px";

      const primaryKey = cursor.primaryKey;
      deleteButton.addEventListener("click", () => {
        const deleteTx = db.transaction(["images"], "readwrite");
        deleteTx.objectStore("images").delete(primaryKey);
        deleteTx.oncomplete = () => {
          imageList.removeChild(div);
        };
        notifyUser(
          "Photo removed",
          "Deleted photo number " + primaryKey + " from the gallery."
        );
      });
      div.appendChild(deleteButton);

      imageList.insertBefore(div, imageList.firstChild);
      cursor.continue();
    }
  };
}

function generateDarkColor() {
  const red = Math.floor(Math.random() * 200);
  const green = Math.floor(Math.random() * 200);
  const blue = Math.floor(Math.random() * 200);
  const hexColor = `#${red.toString(16).padStart(2, "0")}${green
    .toString(16)
    .padStart(2, "0")}${blue.toString(16).padStart(2, "0")}`;
  return hexColor;
}

async function notifyUser(title, message) {
  if (!("Notification" in window)) {
    alert("This browser doesn't support Notifications API");
    return;
  }

  try {
    if (Notification.permission !== "granted") {
      await (async () => {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Permission denied");
        }
      })();
    }

    new Notification(title, {
      body: message,
      icon: "public/img/camera_icon.png",
    });
  } catch (error) {
    //console.error(error.message);
  }
}
