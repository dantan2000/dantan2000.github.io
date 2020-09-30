// Name of the div container to put the livestream into
const streamContainerID = "livestream";

const videoPlayerID = "video-player";
const chatID = "chat";

const streamBlockClassName = "stream-block";

const videoPlayerRatio = ".75";

const chatURL = "https://script.google.com/macros/s/AKfycbx0qwmIzAOkPlQuQYh6MlhzP2Pr7y-5aDTwok91hYr6SvNk1W3P/exec";

var currentMember;

// Initializes currentMember and chat box
(function () {
    MemberSpace.onReady = MemberSpace.onReady || [];
    MemberSpace.onReady.push(function (args) {
        if (args.member) {
            currentMember = args.member;
            initChat();
        }
    });
}());

// HTML String for embedding the stream, where [0] comes before the stream URL and [1] comes after it
const streamEmbed = ["<iframe src=\"",
    "\" width=\"100%\" height=\"100%\" frameborder=\"0\" scrolling=\"no\" allow=\"autoplay\""
    + "allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>"];

// HTML String for embedding the chat box
const chatEmbed = ['<iframe src="',
    '" width="100%" height="100%" allowtransparency="yes" allow="autoplay" frameborder="0" marginheight="0" marginwidth="0" scrolling="auto"></iframe>'];

// Returns the width of the container, truncated to the nearest integer
// Optional: multiplies the width and the height by a given ratio
function getContainerWidth(ratio = 1.0) {
    var div = document.getElementById(streamContainerID);
    var width = div.clientWidth;
    return Math.trunc(width * ratio);
}

// Resizes the given element to the given width and height
function resizeElement(element, width, height) {
    element.style.width = width + "px";
    element.style.height = height + "px";
}

// Initializes and embeds the chat box
function initChat() {
    if (currentMember) {
        getChatUrl();
    }
}

// Given the URL of the livestream, returns the HTML embedding code
function makeStreamEmbedCode(urlString) {
    return streamEmbed[0] + urlString + streamEmbed[1];
}

// Makes the data to be sent to the server
function makeRequestBody() {
    return {
        userName: currentMember.name,
        profilePicture: currentMember.profileImageUrl
    }
}

// Gets the chat Url from the server and then calls embedChat to embed the chat
function getChatUrl() {
    try {
        // Send the request
        //e.preventDefault();
        var jqxhr = $.ajax({
            url: chatURL,
            method: "GET",
            dataType: "json",
            data: makeRequestBody(),
            error: function (err) {
                throw err;
            },
            success: function (suc) {
                if (suc.result == "success") {
                    console.log("Success! " + JSON.stringify(suc));
                    embedChat(suc.embedURL);
                } else {
                    throw suc;
                }
            }
        });
    } catch (err) {
        throw err;
    }
}

// Makes the HTML code for embedding the chat using the given Url
function makeChatEmbedCode(url) {
    return chatEmbed[0] + url + chatEmbed[1];
}

// Embeds the chat box using the given Url
function embedChat(url) {
    var chatDiv = document.getElementById(chatID);
    chatDiv.innerHTML = makeChatEmbedCode(url);
}

// Resizes the Video Player and Chat Box to the current continer size
function resizeElements() {
    var videoPlayerDiv = document.getElementById(videoPlayerID);
    var chatDiv = document.getElementById(chatID);
    var divWidth = getContainerWidth();
    var videoPlayerWidth;
    var videoPlayerHeight;
    var chatWidth;
    var chatHeight;
    if (divWidth < 600) {
        videoPlayerWidth = divWidth;
        videoPlayerHeight = videoPlayerWidth * 9 / 16;
        chatWidth = divWidth;
        chatHeight = videoPlayerHeight * .75;
    } else {
        videoPlayerWidth = divWidth * videoPlayerRatio;
        chatWidth = divWidth * (1 - videoPlayerRatio);
        videoPlayerHeight = videoPlayerWidth * 9 / 16;
        chatHeight = videoPlayerHeight;

    }
    resizeElement(videoPlayerDiv, videoPlayerWidth, videoPlayerHeight);
    resizeElement(chatDiv, chatWidth, chatHeight);

}

// Given the URL of the livestream, embeds it into the livestream div container
async function initLivestream(urlString) {

    await makeDivs(urlString);

    resizeElements();
    window.onresize = resizeElements;
}

// Makes and embeds the divs for the Video Player and Chat Box
function makeDivs(urlString) {
    var livestreamDiv = document.getElementById(streamContainerID);

    // Initializes and embeds video player
    var videoPlayerDiv = document.createElement("div");
    videoPlayerDiv.id = videoPlayerID;
    videoPlayerDiv.className = streamBlockClassName;
    videoPlayerDiv.innerHTML = makeStreamEmbedCode(urlString);
    livestreamDiv.appendChild(videoPlayerDiv);

    // Initializes chat box
    var chatDiv = document.createElement("div");
    chatDiv.id = chatID;
    chatDiv.className = streamBlockClassName;
    livestreamDiv.appendChild(chatDiv);
    resizeElements();
}