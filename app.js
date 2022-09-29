const roadData = {
    minX: 0,
    maxX: 22,
    minY: 9,
    maxY: 13
}

function randomFromArray(array){
   return array[Math.floor(Math.random() * array.length)]; 
}

function createName() {
    const prefix = randomFromArray(["other", "new", "good", "high", "old", "great", "big", "American", "small", "large", "national", "young", "different", "black", "long", "little", "important", "political", "bad", "white", "real", "best", "right", "social", "only", "public", "sure", "low", "early", "able", "human", "local", "late", "hard", "major", "better", "economic", "strong", "possible", "whole", "free", "military", "true", "federal", "international", "full", "special", "easy", "clear", "recent", "certain", "personal", "open", "red", "difficult", "available", "likely", "short", "single", "medical", "current", "wrong", "private", "past", "foreign", "fine", "common", "poor", "natural", "significant", "similar", "hot", "dead", "central", "happy", "serious", "ready", "simple", "left", "physical", "general", "environmental", "financial", "blue", "democratic", "dark", "various", "entire", "close", "legal", "religious", "cold", "final", "main", "green", "nice", "huge", "popular", "traditional", "cultural", "GUNG", "MID", "TRASHY", "TOXIC", "SCUMMY", "HOT"]).toUpperCase();
    const animal = randomFromArray(["BEAR", "CAT", "DOG", "PANGOLIN", "PANDA", "GIRAFFE"]);

    return `${prefix} ${animal}`;
}

function randomCarColor() {
    return Math.floor(Math.random() * 360);;
}

function inBounds(x, y){
    return (
    x > roadData.maxX || 
    x < roadData.minX ||
    y > roadData.maxY ||
    y < roadData.minY)
}

function setScale() {
    const gameContainerBorder = document.querySelector(".game-container-border");
    const windowWidth = window.innerWidth * .55;
    gameContainerBorder.style.transform = `scale(${windowWidth/420})`;
}

function centerName(gamePlayerName) {
    return `${18 - (gamePlayerName.clientWidth / 2)}px`;
}

function getCurrentTimeAsString(){
    return String(new Date());
}

(function () {

    window.addEventListener("resize", setScale);
    setScale();

    let sendMessageButton = document.querySelector(".send-message > input:nth-child(2)");
    sendMessageButton.addEventListener("click", sendMessage);

    let playerSettingsCloseButton = document.querySelector(".player-settings-popup-x");
    playerSettingsCloseButton.addEventListener("click", closePlayerSettings);

    let playerId;
    let playerRef;
    let chatRef;
    let playerName;
    let playerElements = {}

    const gameContainer = document.querySelector(".game-container");
    const playerNamesContainer = document.querySelector(".playerNames-container");
    const chatContainer = document.querySelector(".chat-container");
    const chatMessages = document.querySelector(".chat-messages");

    function closePlayerSettings() {
        const settingsBox = document.querySelector(".player-settings-popup");
        settingsBox.classList.remove('scaleInAnimation');  
        settingsBox.classList.add('hidden');
    }

    function sendMessage() {
        const messageBox = chatContainer.querySelector(".send-message > input:nth-child(1)");
        const message = messageBox.value;
        if (message) {
            messageBox.value = "";
            chatRef.push({
                time: getCurrentTimeAsString(),
                message,
                id: playerId,
            })   
        }
    }

    function handleArrowPress(xChange, yChange) {
        const newX = players[playerId].x + xChange;
        const newY = players[playerId].y + yChange;

        if (!inBounds(newX, newY)) {
            //move to the next space
            players[playerId].x = newX;
            players[playerId].y = newY;
            playerRef.set(players[playerId]);
        } else if (newX < roadData.minX) {
            players[playerId].x = roadData.minX;
            playerRef.set(players[playerId]);
        } else if (newX > roadData.maxX) {
            players[playerId].x = roadData.maxX;
            playerRef.set(players[playerId]);
        }
    }

    function initGame() {

        new KeyPressListener("ArrowUp", () => handleArrowPress(0, -2));
        new KeyPressListener("ArrowDown", () => handleArrowPress(0, 2));
        new KeyPressListener("ArrowLeft", () => handleArrowPress(-2, 0));
        new KeyPressListener("ArrowRight", () => handleArrowPress(2, 0));
        new KeyPressListener("Enter", () => handleEnterKey());

        const allPlayersRef = firebase.database().ref(`players`);

        function handleEnterKey() {
            const sendChatActive = document.querySelector('.send-message > input:nth-child(1)');
            const updateNameActive = document.querySelector('.player-settings-name-input');

            if (sendChatActive === document.activeElement) {
                sendMessage();
            } else if (updateNameActive === document.activeElement){
                setPlayerName();
            }
        }

        async function openPlayerSettings() {
            const settingsBox = document.querySelector(".player-settings-popup");
            const autoButton = document.getElementById("generate-name");
            const setNameButton = document.getElementById("set-name");
            const carColorSlider = document.getElementById("car_color_slider");
            let carColorOffset;
        
            settingsBox.classList.remove('hidden');
            settingsBox.classList.remove('scaleInAnimation'); // reset animation
            void settingsBox.offsetWidth; // trigger reflow
            settingsBox.classList.add('scaleInAnimation'); // start animation
        
            autoButton.addEventListener("click", getAutoName);
            setNameButton.addEventListener("click", setPlayerName);
        
            const playerNameRef = firebase.database().ref(`players/${playerId}`);
            await playerNameRef.get().then((snapshot) => {
                playerName = (snapshot.val().name);
                carColorOffset = (snapshot.val().car_color_offset);
            })
            
            const playerNameInput = document.querySelector(".player-settings-name-input");
            playerNameInput.value = playerName;

            carColorSlider.value = carColorOffset;

            let colorRange = document.getElementById("car_color_slider");
            colorRange.addEventListener("input", function() {
            playerRef.update({
                car_color_offset: colorRange.value
            })
            playerCar = document.querySelector("div.Character.grid-cell.you div.Character_car.grid-cell");
            playerCar.style = `filter: hue-rotate(${colorRange.value}deg)`;}, false);
        }

        async function setPlayerName() {
            const playerNameInput = document.querySelector(".player-settings-name-input");
            playerName = playerNameInput.value;
            playerRef.update({
                name: playerName
            })
        }

        function getAutoName() {
            document.querySelector(".player-settings-name-input").value = createName();
        }

        async function drawAllMessages(players) {
            //Removes all DOM elements in the chat so they aren't duplicated
            while (chatMessages.firstChild) {
                chatMessages.removeChild(chatMessages.firstChild);
            }
            if (players){
                const playerArray = Object.values(players)
                for await (const sender of playerArray) {
                        //Gets the name from the allPlayersRef, so the name can be added to the message
                        await allPlayersRef.child(sender.id).get().then(async(snapshot) => { //Maybe put async here if they come out of order?
    
                            //HTML setup and appending
                            var playerName;
                            if (snapshot.val()?.name){
                                playerName = snapshot.val().name;
                            } else{
                                playerName = "User Disconnected";
                            }
                            const chatTimestamp = (new Date(sender.time).toLocaleTimeString().replace(/(0[\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3"));
                            const chatMessage = sender.message;
                            const playerNameSpan = document.createElement('span');
                            const messageSpan = document.createElement('span');
                            messageSpan.classList.add("messageBody");
                            messageSpan.innerHTML = chatMessage;
                            playerNameSpan.innerHTML = `${playerName} (${chatTimestamp}):`;
                            chatMessages.append(playerNameSpan);
                            chatMessages.append(messageSpan);
                            chatContainer.scrollTop = chatContainer.scrollHeight;
                        })
                }
            }
        }

        chatRef.on("value", (snapshot) => {
            //Fires when a chat is sent
            drawAllMessages(snapshot.val());
        })

        allPlayersRef.on("child_changed", (snapshot) => {
            chatRef.get().then((snapshot) => {
                drawAllMessages(snapshot.val());
            })
        })

        allPlayersRef.on("value", (snapshot) =>{

            //Fires whenever a change occurs
            players = snapshot.val() || {};
            Object.keys(players).forEach((key) => {
                const characterState = players[key];
                let el = playerElements[key].charElement;
                let listEl = playerElements[key].playerList;

                el.querySelector(".Character_name").innerText = characterState.name;
                listEl.querySelector(".playerInfo > span").innerText = characterState.name;

                var playerOnlineStatus;
                if (characterState.online == true){
                    playerOnlineStatus = 'online';
                } else {
                    playerOnlineStatus = 'offline';
                    gameContainer.removeChild(playerElements[key].charElement);
                }
                listEl.querySelector(".playerInfo > span:nth-child(2)").setAttribute("class", "");
                listEl.querySelector(".playerInfo > span:nth-child(2)").classList.add(playerOnlineStatus);
                const gamePlayerName = el.querySelector(".Character_name-container")
                gamePlayerName.style.left = centerName(gamePlayerName);
                const left = 16 * characterState.x + "px";
                const top = 16 * characterState.y - 4 + "px";
                el.style.transform = `translate3d(${left}, ${top}, 0)`;

                el.querySelector(".Character_car.grid-cell").style = `filter: hue-rotate(${characterState.car_color_offset}deg)`;
            })
        })

        allPlayersRef.on("child_added", (snapshot) =>{
            //Fires whenever a new node is added to the tree
            const addedPlayer = snapshot.val();
            const characterElement = document.createElement("div");
            characterElement.classList.add("Character", "grid-cell");
            if(addedPlayer.id == playerId){
                characterElement.classList.add("you");
            }
            characterElement.innerHTML = (`<div class="Character_car grid-cell" style="filter: hue-rotate(${addedPlayer.car_color_offset}deg);"></div><div class="Character_name-container"><span class="Character_name"></span></div><div class="Character_you-arrow"></div>`);

            const playerListElement = document.createElement("div");
            playerListElement.classList.add("playerInfo");
            if(addedPlayer.id == playerId){
                playerListElement.classList.add("you");
            }
            var playerOnlineStatus = 'offline';
            if(addedPlayer.online == true){
                playerOnlineStatus = 'online';
            }
            playerListElement.innerHTML = (`
            <span>${addedPlayer.name}</span>
            <span>■</span>
            `);

            playerElements[addedPlayer.id] = {playerList: playerListElement, charElement: characterElement};

            //Fill in initial state
            characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
            const left = 16 * addedPlayer.x + "px";
            const top = 16 * addedPlayer.y - 4 + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            gameContainer.prepend(characterElement);
            playerNamesContainer.appendChild(playerListElement);

            const gamePlayerName = characterElement.querySelector(".Character_name-container")
            gamePlayerName.style.left = centerName(gamePlayerName);

            const playerInfoSettings = document.getElementsByClassName("playerInfo you");
            playerInfoSettings[0].addEventListener("click", openPlayerSettings);
        })

        allPlayersRef.on("child_removed", (snapshot) => {
            const removedKey = snapshot.val().id;
            gameContainer.removeChild(playerElements[removedKey].charElement);
            playerNamesContainer.removeChild(playerElements[removedKey].playerList);
            delete playerElements[removedKey];

            chatRef.get().then((snapshot) => {
                drawAllMessages(snapshot.val());
            })
        })
    }

    firebase.auth().onAuthStateChanged((user) => {
        //console.log(user)
        if (user) {
            //You're logged in!
            playerId = user.uid;
            playerRef = firebase.database().ref(`players/${playerId}`);
            chatRef = firebase.database().ref(`chatMessages`);

            const name = createName();

            playerRef.set({
                id: playerId,
                name,
                x: Math.floor(Math.random() * (19 - 5) + 5),
                y: randomFromArray([9, 11, 13]),
                online: true,
                car_color_offset: randomCarColor()
            })

            //PRESENCE DETECTION
            if (user.isAnonymous){
                playerRef.onDisconnect().remove();
            } else{
                playerRef.onDisconnect().update({
                    online: false
                })
            }

            //Begin game since they're logged in
            initGame();

        } else {
            //You're logged out!
        }
    })

    firebase.auth().signInAnonymously().catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
        console.log(errorCode, errorMessage);
    });

})();