window.addEventListener('load', init);
var jsonDemo = {},
    stageDemo = 0; // used to imitate the flow of data which would be used in a real game
const jsonFile = "example.json"; // a json format which is used in the DOM manipulation
const server = "http://ec2-18-130-82-13.eu-west-2.compute.amazonaws.com"; // a reference to a custom server endpoint for API calls
var messageStack, messageStackPointer, players, roles, pickedRoles, lines, fired, ddosed, inGame; // used to store the live data for the DOM manipulation

function init() {
    initJson(); // created to clean code
    document.getElementById("game").style.display = "none";
    document.getElementById("start").addEventListener('click', toGame);
    // readJSON() uses a formatted JSON file, which would mimic a back-end API calls result
    // createJSON() would use live data, which would have calculations done on the front end using API calls
    // simulateGame() uses mimicked live data, which is updated via the built-in setInterval function
    simulateGame();
    setInterval(simulateGame, 1000); // interval rate set low for the max two minute presentation, not mimicking the pace a real game would be
}

function createJSON() {
    var json = {};
    json.started = inGame;
    json.number = getNumber(); // might fall down, since it an async type task, which it did and had no time to change
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
    // do lines (processing)
}

function checkMessages() { // goes through all messages in the stack
    messageStack = reducedMessages(getMessages()); // might fall down
    if (messageStack.length != 0) {
        // going through all NEW messages not been processed
        for (var i = messageStackPointer; i <= messageStack.length; i++) dealWithMessage(messageStack[i]);
        messageStackPointer = messageStack.length - 1; // updates what messages have been read in the stack
    }
}

// This function would contain all if statements to deal with the different commands the user can enter
function dealWithMessage(message) {
    if (newUser(message)) return; // returns due to being the only execution a new user would do
    if (message.body.split(" ")[0] == "/talk") lines.push(getUser(message.from) + ": " + message.body.replace("/talk ", ""));
}

function getUser(phone) {
    for (var i = 0; i < players.length; i++)
        if (players[i].phone == phone) return players[i].user;
    return "ERROR!";
}

function newUser(message) {
    var userExists = false;
    for (var i = 0; i < players.length; i++) {
        if (players[i].phone == message.from) userExists = true;
    } 
    if (!userExists) {
        var role = getRole(); // random unique role
        players.push({
            user: message.body,
            phone: message.from,
            ingame: true,
            ip: "127.0.0.1", // a unique ip randomiser would be implemented
            secretRole: role.name
        }); sendText(message.from, "Your role is the " + role.name + "\n" + role.desc); // might fall down (async again, although should be fine)
    } return userExists;
}

function getRole() {
    pickedRoles = shuffle(pickedRoles);
    return pickedRoles.pop(); // removing the role from possible roles given (when given)
}

// https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    } return a;
}

// needed since the Twilio API showed outbound messages were returned in the API call, which are not needed and could cause issues
function reducedMessages(json) {
    return json.filter(a => a.direction == "inbound");
}

// Custom back-end API call, making API calls to a set-up Twilio Account for the game
function sendText(number, body) {
    $.post(server + "/message", {
        number: number,
        body: body
    });
}

// Custom back-end API call, making API calls to a set-up Twilio Account for the game
function getMessages() {
    $.get(server + "/get_messages", function (data, status) {
        return data;
    });
}

// Custom back-end API call, making API calls to a set-up Twilio Account for the game
function getNumber() {
    $.get(server + "/get_phone_number", function (data, status) {
        console.log(data);
        return data;
    });
}

function drawOnDOM(json) {
    if (!inGame) {
        itterateAdd("", "members", json.players);
        document.getElementById("phoneNumber").innerHTML = "Text your username to " + json.number + " to play!";
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

// A custom method to add multiple indexes from an array within a HTML element, adding a heading if needed before/above ("before")
function itterateAdd(before, elementID, array) {
    var x = document.getElementById(elementID);
    x.innerHTML = before;
    for (var i = 0; i < array.length; i++) {
        var c = ""; // used to hold any class names if needed
        var txt = array[i];
        // adding classes
        if (array[i].hasOwnProperty("ingame")) c += (array[i].ingame) ? "" : "strike ";
        if (array[i].hasOwnProperty("type")) c += array[i].type;
        // setting the text based on which properties the object has
        if (array[i].hasOwnProperty("user") && array[i].hasOwnProperty("role")) txt = array[i].user + " (" + array[i].role + ")";
        if (array[i].hasOwnProperty("user") && array[i].hasOwnProperty("ip")) txt = array[i].user + " - " + array[i].ip;
        if (!array[i].hasOwnProperty("user") && array[i].hasOwnProperty("role")) txt = array[i].role;
        // adding index i to the element
        x.innerHTML += "<p class='" + c + "'>" + txt + "</p>";
    }
}

// simply changing the screen from the welcome, to the game
function toGame() {
    document.getElementById("welcome").style.display = "none";
    document.getElementById("game").style.display = "block";
    inGame = true;
}

// used to imitate an ideal JSON back-end API call, but using a local jsonFile location instead
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

// used to ensure that the main text view shows the latest updates to the game
window.setInterval(function() {
    var elem = document.getElementById('messages');
    elem.scrollTop = elem.scrollHeight;
  }, 1000);

// mimics a changing JSON object, which a real game would look like (roughly), although not to completion (due to presentation time)
function simulateGame() {
    if (stageDemo == 0) jsonDemo = {
        "started": false,
        "number": "+44875486212",
        "players": [],
        "messages": [],
        "roles": [],
        "fired": [],
        "ddosed": []
    };
    if (stageDemo == 2) jsonDemo.players.push({
        "user": "Sean12697",
        "phone": "+44809874536",
        "secretRole": "CEO",
        "ip": "127.0.129.192",
        "ingame": true
    });
    if (stageDemo == 3) jsonDemo.players.push({
        "user": "Tal",
        "phone": "+44216976539",
        "secretRole": "Developer",
        "ip": "127.0.129.193",
        "ingame": true
    });
    if (stageDemo == 6) jsonDemo.players.push({
        "user": "Qasim",
        "phone": "+446583875356",
        "secretRole": "Network Admin",
        "ip": "127.0.129.194",
        "ingame": true
    });
    if (stageDemo == 8) jsonDemo.players.push({
        "user": "Tiffany",
        "phone": "+44835963793",
        "secretRole": "Hacker",
        "ip": "127.0.129.195",
        "ingame": true
    });
    if (stageDemo == 10) jsonDemo.players.push({
        "user": "Jeff",
        "phone": "+44120864753",
        "secretRole": "UX Consultant",
        "ip": "127.0.129.196",
        "ingame": true
    });
    if (stageDemo == 15) jsonDemo.players.push({
        "user": "Jessica",
        "phone": "+44098675898",
        "secretRole": "UI Designer",
        "ip": "127.0.129.197",
        "ingame": true
    });
    if (stageDemo == 16) jsonDemo.roles = [{
            "role": "CEO",
            "ingame": true,
            "type": "boss"
        },
        {
            "role": "Network Admin",
            "ingame": true,
            "type": "good"
        },
        {
            "role": "Hacker",
            "ingame": true,
            "type": "bad"
        },
        {
            "role": "Developer",
            "ingame": true,
            "type": "neutral"
        },
        {
            "role": "UI Designer",
            "ingame": true,
            "type": "neutral"
        },
        {
            "role": "UX Consultant",
            "ingame": true,
            "type": "neutral"
        }
    ];
    if (stageDemo == 20) jsonDemo.started = true;
    if (stageDemo == 21) jsonDemo.messages.push("Welcome to the Company of Silicon!");
    if (stageDemo == 27) jsonDemo.messages.push("It's starting to turn dark after an eventful day");
    if (stageDemo == 35) jsonDemo.messages.push("It has turned midnight!");
    if (stageDemo == 41) jsonDemo.messages.push("The networks traffic seems to have slowed down briefly!");
    if (stageDemo == 50) jsonDemo.messages.push("Jeff has gone offline!");
    if (stageDemo == 50) jsonDemo.players[4].ingame = false;
    if (stageDemo == 50) jsonDemo.roles[5].ingame = false;
    if (stageDemo == 50) jsonDemo.ddosed.push({
        "user": "Jeff",
        "role": "UX Consultant",
        "type": "neutral"
    });
    if (stageDemo == 57) jsonDemo.messages.push("Tiffany (127.0.129.195): I think Paul might have took Jeff offline!");
    if (stageDemo == 61) jsonDemo.messages.push("Paul (127.0.129.194): Lies!");
    if (stageDemo == 67) jsonDemo.messages.push("Jessica (127.0.129.197): Why would you say that? Tal had more access being a Dev");
    if (stageDemo == 72) jsonDemo.messages.push("Tiffany (127.0.129.195) Has accused Tal of being the hacker, voting comenses!");
    if (stageDemo == 74) jsonDemo.messages.push("Jessica (127.0.129.197) Has voted against Tal");
    if (stageDemo == 78) jsonDemo.messages.push("30 more seconds left of voting, 2/5!");
    if (stageDemo == 82) jsonDemo.messages.push("Voting over, the majority of the company did not vote to fire the employee");
    if (stageDemo == 84) jsonDemo.messages.push("Nighttime!");
    if (stageDemo == 89) jsonDemo.messages.push("The whole networks is taken offline briefly!");
    if (stageDemo == 95) jsonDemo.messages.push("Morning comes!");
    if (stageDemo == 97) jsonDemo.messages.push("The Network Admin had protected Paul (127.0.129.194) from the Hacker");
    if (stageDemo == 103) jsonDemo.messages.push("Jessica (127.0.129.197): This is clearly Tal!");
    if (stageDemo == 106) jsonDemo.messages.push("Jessica (127.0.129.197): Has accused Tal of being the hacker, voting comenses!");
    if (stageDemo == 107) jsonDemo.messages.push("Tiffany (127.0.129.195) Has voted against Tal");
    if (stageDemo == 113) jsonDemo.messages.push("Sean12697 (127.0.129.192) Has voted against Tal");
    if (stageDemo == 114) jsonDemo.messages.push("The majority has voted, including the CEO, Tal (127.0.129.193) will be fired and taken off the network");
    if (stageDemo == 115) jsonDemo.players[1].ingame = false;
    if (stageDemo == 115) jsonDemo.roles[3].ingame = false;
    if (stageDemo == 115) jsonDemo.fired.push({
        "user": "Tal",
        "role": "Developer",
        "type": "neutral"
    });
    stageDemo++;
    drawOnDOM(jsonDemo);
}

function initJson() {
    messageStack = [];
    messageStackPointer = 0;
    players = [];
    // all possible roles to be picked from at random
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
    }, {
        name: "UI Designer",
        desc: "You are a normal player",
        type: "neutral",
        ingame: true
    }];
    pickedRoles = roles;
    lines = [];
    fired = [];
    ddosed = [];
    inGame = false;
}