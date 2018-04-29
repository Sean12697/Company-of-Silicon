window.addEventListener('load', init);
const jsonFile = "example.json";
var messageStack = [],
    messageStackPointer = 0,
    players = [],
    roles = [{
        name: "CEO",
        desc: "Your aim is to fire the hackers!",
        type: "boss",
        ingame: true
    }, {
        name: "Network Admin",
        desc: "Your aim is to protect the CEO from DDOS attacks",
        type: "good",
        ingame: true
    }, {
        name: "Hacker",
        desc: "Your aim is to DDOS the CEO!",
        type: "bad",
        ingame: true
    }, {
        name: "Developer",
        desc: "You are a normal player",
        type: "neutral",
        ingame: true
    }, {
        name: "UX Consultant",
        desc: "You are a normal player",
        type: "neutral",
        ingame: true
    }],
    pickedRoles = roles,
    lines = [],
    fired = [],
    ddosed = [];
var inGame = false;

function init() {
    document.getElementById("game").style.display = "none";
    document.getElementById("start").addEventListener('click', toGame);
    readJSON(); // replace with createJSON();
    setInterval(readJSON, 100);
}

function createJSON() {
    var json = {};
    json.started = inGame;
    json.number = getNumber(); // might fall down
    checkMessages();
    progress();
    json.players = players;
    json.messages = lines;
    json.roles = roles;
    json.fired = fired;
    json.ddosed = ddosed;
    drawOnDOM(json);
}

function progress() {
    // do lines
}

function checkMessages() {
    messageStack = reducedMessages(getMessages()); // might fall down
    if (messageStack.length != 0) {
        for (var i = messageStackPointer; i <= messageStack.length; i++) {
            dealWithMessage(messageStack[i]);
        } messageStackPointer = messageStack.length - 1;
    }
}

function dealWithMessage(message) {
    if (newUser(message)) return;
    if (message.body.split(" ")[0] == "/talk") lines.push(getUser(message.from) + ": " + message.body.replace("/talk ", ""));
}

function getUser(phone) {
    for (var i = 0; i < players.length; i++) if (players[i].phone == phone) return players[i].user;
    return "ERROR!";
}

function newUser(message) {
    var userExists = false;
    for (var i = 0; i < players.length; i++) {
        if (players[i].phone == message.from) userExists = true;
    }
    if (!userExists) {
        var role = getRole();
        players.push({
            user: message.body,
            phone: message.from,
            ingame: true,
            ip: "127.0.0.1",
            secretRole: role.name
        });
        sendText(message.from, "Your role is the " + role.name + "\n" + role.desc); // might fall down
    } return userExists;
}

function getRole() {
    pickedRoles = shuffle(pickedRoles);
    return pickedRoles.pop();
}

// https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    } return a;
}

function reducedMessages(json) {
    return json.filter(a => a.direction == "inbound");
}

function sendText(number, body) {
    $.post("url", {
        number: number,
        body: body
    });
}

function getMessages() {
    $.get("messages", function (data, status) {
        return data;
    });
}

function getNumber() {
    $.get("number", function (data, status) {
        return data;
    });
}

function drawOnDOM(json) {
    if (!inGame) {
        itterateAdd("", "members", json.players);
        document.getElementById("phoneNumber").innerHTML = "Text your username to " + json.number;
    }
    if (!inGame && json.started) toGame();
    if (inGame) {
        itterateAdd("", "messages", json.messages);
        itterateAdd("<h3>Users</h3>", "users", json.players);
        itterateAdd("<h3>Roles</h3>", "roles", json.roles);
        itterateAdd("<h3>Fired</h3>", "fired", json.fired);
        itterateAdd("<h3>DDOS'ed</h3>", "ddos", json.ddosed);
    }
}

function itterateAdd(before, elementID, array) {
    var x = document.getElementById(elementID);
    x.innerHTML = before;
    for (var i = 0; i < array.length; i++) {
        var c = "";
        var txt = array[i];
        if (array[i].hasOwnProperty("ingame")) c += (array[i].ingame) ? "" : "strike ";
        if (array[i].hasOwnProperty("type")) c += array[i].type;
        if (array[i].hasOwnProperty("user") && array[i].hasOwnProperty("role")) txt = array[i].user + " (" + array[i].role + ")";
        if (array[i].hasOwnProperty("user") && array[i].hasOwnProperty("ip")) txt = array[i].user + " - " + array[i].ip;
        if (!array[i].hasOwnProperty("user") && array[i].hasOwnProperty("role")) txt = array[i].role;
        x.innerHTML += "<p class='" + c + "'>" + txt + "</p>";
    }
}

function toGame() {
    document.getElementById("welcome").style.display = "none";
    document.getElementById("game").style.display = "block";
    inGame = true;
}

function readJSON() {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", jsonFile, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                drawOnDOM(JSON.parse(rawFile.responseText));
            }
        }
    }
    rawFile.send(null);
}