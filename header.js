// Temporary links object for local testing
var adminLinks = {
    "Forum": "forum",
    "Online at Will": "online-at-will",
    "Broad Live Virtual Lessons": "live-virtual-lessons",
    "In Classroom Lessons": "in-classroom-lessons",
    "Online Virtual Lessons": "online-virtual-lessons",
    "Professional Development": "professional-development",
    "Contact Us": "contact-us",
    "Add Students to the Platform": "add-students"
}

var currentMember;

const headerName = "header-nav";
const linksURL = "https://script.google.com/a/changeissimple.org/macros/s/AKfycbwX3XEcLOQA5XTD0HW6zbZTNArrxr4NAZwp2YBgHMCF6rx-2qM/exec";
const loadingHTML = "<div class=\"lds-facebook\"><div></div><div></div><div></div></div>";

// Initializes currentMember and sidebar
(function () {
    MemberSpace.onReady = MemberSpace.onReady || [];
    MemberSpace.onReady.push(function (args) {
        if (args.member) {
            currentMember = args.member;
            initHeader();
        }
    });
}());



// Initializes sidebar
function initHeader() {

    var header = document.getElementById(headerName)
    // If there is no div for header navigation on the page, do nothing
    if (!document.getElementById(headerName)) {
        return;
    }

    header.innerHTML = loadingHTML;


    makeLinks();

}


// Makes the request body for the link info request
// TODO: Get highest teir
function makeRequestBody() {
    var body = {
        tier: currentMember.plans[0],
    };
    console.log("BODY: " + JSON.stringify(body));
    return body;
}

// Gets the link info from the server
async function getLinkInfo(_callback) {
    try {
        // Send the request
        //e.preventDefault();
        var jqxhr = $.ajax({
            url: linksURL,
            method: "GET",
            dataType: "json",
            data: makeRequestBody(),
            error: function (err) {
                throw err;
            },
            success: function (suc) {
                if (suc.result == "success") {
                    console.log("Success! " + suc);
                    _callback(suc.links);
                } else {
                    throw suc;
                }
            }
        })

    } catch (err) {
        throw err;
    }
}

// Creates the links for the sidebar
function makeLinks() {
    return getLinkInfo(makeLinksCallback);
}

// Parses the links objects and returns the HTML string for the links
function makeLinksCallback(links) {
    var linkString = "";
    for (message in links) {
        currLink = makeHTMLLink(message, links[message]);
        linkString += currLink;
    }
    document.getElementById(headerName).innerHTML = linkString;
}

// Makes an HTML hyperlink
function makeHTMLLink(message, link) {
    return "<a href=\"" + link + "\">" + message + "</a>";
}

