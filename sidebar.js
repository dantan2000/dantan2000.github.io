/*
MAKE CHANGES
*/

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

var topPadding = 200;

// Initializes currentMember and sidebar
(function () {
    MemberSpace.onReady = MemberSpace.onReady || [];
    MemberSpace.onReady.push(function (args) {
        if (args.member) {
            initSidebar();
        }
    });
}());

const sidebarName = "sidebar";
const sidebarClassName = "sidebar";
const sidebarElementClassName = "sidebarElement";
const linkPanelName = "linkPanel";
const toggleButtonName = "toggleButton";
const toggleButtonIconName = "toggleButtonIcon";

const linksURL = "https://script.google.com/macros/s/AKfycbwnk-6kX4mKFAcHI3IibLC5KUUSSdUSM45SRGM67ezqyYi1WWis/exec";

const linkPanelWidth = 150;
var isVisible;

// Creates element with the specified tag and name, and class
function makeElement(tag, name, className) {
    var element = document.createElement(tag);
    element.id = name;
    element.className = className;
    return element;
}

// Initializes sidebar
async function initSidebar() {

    var sidebar = makeElement("div", sidebarName, sidebarClassName);
    document.body.appendChild(sidebar);

    var linkPanel = makeElement("div", linkPanelName, sidebarElementClassName);
    sidebar.appendChild(linkPanel);


    await makeLinks();
    animateInitSidebar($("#" + sidebarName));
}


// Initializes the properties for the toggle button
function initToggleButton() {    
    var toggleButton = document.getElementById(toggleButtonName);
    var toggleButtonIcon = document.getElementById(toggleButtonIconName);
    var toggleButton = makeElement("div", toggleButtonName, sidebarElementClassName);
    sidebar.appendChild(toggleButton);
    var toggleButtonIcon = makeElement("div", toggleButtonIconName);
    toggleButton.appendChild(toggleButtonIcon);
    toggleButton.setAttribute("onclick", "toggleSidebar()");
    toggleButtonIcon.innerHTML = "  <div class=\"bar1\"></div><div class=\"bar2\"></div><div class=\"bar3\"></div>";
    toggleButton.classList.toggle("change");
}

// Animates the sidebar appearing onscreen
function animateInitSidebar($sidebar) {
    $sidebar.hide(0, function () {
        $sidebar.stop().animate({
            top: topPadding
        }, 0, function () {
            $sidebar.show(300, initSidebarFunction);
        });
    });
}

// Initializes the function that animates the sidebar on scroll 
function initSidebarFunction() {
    $(function () {
        var $sidebar = $("#sidebar"),
            $window = $(window),
            offset = $sidebar.offset()

        $window.scroll(function () {
            $sidebar.stop().animate({
                top: $window.scrollTop() + topPadding
            }, 0, "swing");
        });
    });
    $(window).scroll();
    toggleSidebar();
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
    getLinkInfo(makeLinksHelper);
}

// Parses the links objects and inserts the hyperlinks into the sidebar
function makeLinksHelper(links) {
    var linkPanel = document.getElementById(linkPanelName);
    for (message in links) {
        currLink = makeHTMLLink(message, links[message]);
        linkPanel.innerHTML += currLink;
    }
    initToggleButton();
    toggleSidebar();
}

// Makes an HTML hyperlink
function makeHTMLLink(message, link) {
    return "<a href=\"" + link + "\">" + message + "</a>";
}

// Toggles the visibility of the sidebar 
function toggleSidebar() {
    sidebar = document.getElementById(sidebarName);
    toggleButton = document.getElementById(toggleButtonName);
    toggleButton.classList.toggle("change");
    if (isVisible) {
        sidebar.style.left = 0 + "px";
        isVisible = false;
    } else {
        sidebar.style.left = (-1 * linkPanelWidth) + "px";
        isVisible = true;
    }
}
