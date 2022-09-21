function randomFromArray(array){
   return array[Math.floor(Math.random() * array.length)]; 
}

function createName() {
    const prefix = randomFromArray(["other", "new", "good", "high", "old", "great", "big", "American", "small", "large", "national", "young", "different", "black", "long", "little", "important", "political", "bad", "white", "real", "best", "right", "social", "only", "public", "sure", "low", "early", "able", "human", "local", "late", "hard", "major", "better", "economic", "strong", "possible", "whole", "free", "military", "true", "federal", "international", "full", "special", "easy", "clear", "recent", "certain", "personal", "open", "red", "difficult", "available", "likely", "short", "single", "medical", "current", "wrong", "private", "past", "foreign", "fine", "common", "poor", "natural", "significant", "similar", "hot", "dead", "central", "happy", "serious", "ready", "simple", "left", "physical", "general", "environmental", "financial", "blue", "democratic", "dark", "various", "entire", "close", "legal", "religious", "cold", "final", "main", "green", "nice", "huge", "popular", "traditional", "cultural", "GUNG", "MID", "TRASHY", "TOXIC", "SCUMMY", "HOT"]).toUpperCase();
    const animal = randomFromArray(["BEAR", "CAT", "DOG", "PANGOLIN", "PANDA", "GIRAFFE"]);

    return `${prefix} ${animal}`;
}

(function () {

    let playerId;
    let playerRef;
    let playerElemenets = {}

    const gameContainer = document.querySelector(".game-container");

    function initGame() {
        const allPlayersRef = firebase.database().ref(`players`);

        allPlayersRef.on("value", (snapshot) =>{
            //Fires whenever a change occurs
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
            playerElemenets[addedPlayer.id] = characterElement;

            //Fill in initial state
            characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
            const left = 16 * addedPlayer.x + "px";
            const top = 16 * addedPlayer.y - 4 + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            gameContainer.appendChild(characterElement);
        })

        //Remove character from DOM when they leave
        allPlayersRef.on("child_removed", (snapshot) => {
            const removedKey = snapshot.val().id;
            gameContainer.removeChild(playerElemenets[removedKey]);
            delete playerElemenets[removedKey];
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
                x: Math.random() * (19 - 5) + 5,
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