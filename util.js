// MemberSpace member object
var currentMember;

// List of tiers from the spreadsheet
var tiers;


// Initializes currentMember
(function () {
    MemberSpace.onReady = MemberSpace.onReady || [];
    MemberSpace.onReady.push(function (args) {
        if (args.member) {
            currentMember = args.member;
        }
    });
}());

// Gets the current tiers for the platform
async function getTiers(_callback) {
    await $.ajax({
        url: tiersURL,
        method: "GET",
        dataType: "json",
        data: {},
        error: function (err) {
            throw err;
        },
        success: function (suc) {
            if (suc.result == "success") {
                console.log("Got tiers from server: " + suc.tiers)
                tiers = suc.tiers;
            } else {
                submitError(suc);
            }
        }
    })
}

(async function () {
    var maxFail = 5;
    var failureCounter = 0;
    while (!tiers) {
        try {
            await getTiers();
        } catch (err) {
            // Increase the fail counter, if the request failed too many times, show an error
            failureCounter++;
            if (failureCounter >= maxFail) {
                return;
            }
        }
    }
});


// Gets the plan of the current teacher
// TODO: If multiple plans, get highest tier
function getPlan(member) {
    return member.plans[0];
}

/*
// Exports util functions into object Util
var Util = (function (module) {

    const tierScriptURL = "https://script.google.com/macros/s/AKfycbzt0byNi_oIceYma3OEP0CHJHMaTWKYEVbfhUt_6_AJL_mdG-yq/exec";


    module.add = function (a, b) {
        return a + b;
    }

    // makeRequest(String, String, function)
    // Input:
    //   URL - URL string of the web app to make a request to
    //   body - JSON String representing the information to be sent to the server
    //   _callback - the callback function to be called once the request finishes
    // makes ajax request with given web app URL, request body, and callback function
    // On succes: calls callback with the return info from the web app
    // On error: throws an error
    module.makeRequest = async function (URL, body, _callback) {
        console.log("making request: " + URL + "," + body + ", " + _callback);
        await $.ajax({
            url: URL,
            method: "GET",
            dataType: "json",
            data: body,
            error: function (err) {
                throw err;
            },
            success: function (suc) {
                if (suc.result == "success") {
                    _callback(suc);
                } else {
                    throw suc;
                }
            }
        });
        return;
    };



    module.initTiers = async function () {
        await module.makeRequest(tierScriptURL, {}, function (body) { module.tiers = body.tiers });
        return;
    };

    // Initializes currentMember and tiers
    (function () {
        MemberSpace.onReady = MemberSpace.onReady || [];
        MemberSpace.onReady.push(function (args) {
            if (args.member) {
                module.currentMember = args.member;
                module.initTiers();
            }
        });
    }());

    // Gets the plan of highest importance of the current member
    module.getPlan = async function () {
        if (!this.tiers) {
            await this.initTiers();
        }
        console.log("  -  TIERS: " + this.teirs);
        // Finds the first (and top priority) tier the member has
        for (var i = 0; i < tiers.length; i++) {
            if (this.currentMember.plans.includes(tiers[i])) {
                return tiers[i];
            }
        }
        // Member tier does not exist in spreadsheet
        throw "Invalid member tier";

    };


    return module;
}(Util || {})); */