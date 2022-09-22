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

function centerName() {
    return `${18 - document.querySelector(".Character_name-container").clientWidth / 2}px`;
}

(function () {

    window.addEventListener("resize", setScale);
    setScale();

    let playerId;
    let playerRef;
    let playerElements = {}

    const gameContainer = document.querySelector(".game-container");
    const playerNamesContainer = document.querySelector(".playerNames-container");

    function handleArrowPress(xChange, yChange) {
        const newX = players[playerId].x + xChange;
        const newY = players[playerId].y + yChange;
        if (!inBounds(newX, newY)) {
            //move to the next space
            players[playerId].x = newX;
            players[playerId].y = newY;
            playerRef.set(players[playerId]);
        }
    }

    function initGame() {

        new KeyPressListener("ArrowUp", () => handleArrowPress(0, -2))
        new KeyPressListener("ArrowDown", () => handleArrowPress(0, 2))
        new KeyPressListener("ArrowLeft", () => handleArrowPress(-2, 0))
        new KeyPressListener("ArrowRight", () => handleArrowPress(2, 0))

        const allPlayersRef = firebase.database().ref(`players`);

        allPlayersRef.on("value", (snapshot) =>{
            //Fires whenever a change occurs
            players = snapshot.val() || {};
            Object.keys(players).forEach((key) => {
                const characterState = players[key];
                let el = playerElements[key].charElement;

                el.querySelector(".Character_name").innerText = characterState.name;
                el.querySelector(".Character_name-container").style.left = centerName();
                const left = 16 * characterState.x + "px";
                const top = 16 * characterState.y - 4 + "px";
                el.style.transform = `translate3d(${left}, ${top}, 0)`;
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
            characterElement.innerHTML = (`
            <div class="Character_car grid-cell"></div>
            <div class="Character_name-container">
                <span class="Character_name"></span>
            </div>
            <div class="Character_you-arrow"></div>
            `);

            const playerListElement = document.createElement("div");
            playerListElement.classList.add("playerInfo");
            if(addedPlayer.id == playerId){
                playerListElement.classList.add("you");
            }
            playerListElement.innerHTML = (`
            <span>${addedPlayer.name}</span>
            <span>■</span>
            `);

            playerElements[addedPlayer.id] = {playerList: playerListElement, charElement: characterElement};
            //playerElements[addedPlayer.id] = characterElement;

            //Fill in initial state
            characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
            const left = 16 * addedPlayer.x + "px";
            const top = 16 * addedPlayer.y - 4 + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            gameContainer.prepend(characterElement);
            playerNamesContainer.appendChild(playerListElement);
        })

        //Remove character from DOM when they leave
        allPlayersRef.on("child_removed", (snapshot) => {
            const removedKey = snapshot.val().id;
            gameContainer.removeChild(playerElements[removedKey].charElement);
            playerNamesContainer.removeChild(playerElements[removedKey].playerList);
            delete playerElements[removedKey];
        })
    }

    firebase.auth().onAuthStateChanged((user) => {
        //console.log(user)
        if (user) {
            //You're logged in!
            playerId = user.uid;
            playerRef = firebase.database().ref(`players/${playerId}`);

            const name = createName();

            playerRef.set({
                id: playerId,
                name,
                x: Math.floor(Math.random() * (19 - 5) + 5),
                y: randomFromArray([9, 11, 13]),
                online: true
            })

            playerRef.onDisconnect().remove();

            //PRESENCE DETECTION: DISABLED DURING TESTING
            // playerRef.onDisconnect().update({
            //     online: false
            // })

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