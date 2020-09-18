// Handles the form that the user sees
class StudentForm {
    constructor(fName = "", lName = "", email = "") {
        this.date = new Date();
        this.fName = fName;
        this.lName = lName;
        this.email = email;

        // Returns the information stored in this StudentForm as an array
        this.toArray = function () {
            return [this.date.toString(), this.fName, this.lName, this.email];
        }

        // Returns whether this StudentForm has an empty entry
        this.hasEmpty = function () {
            var values = this.toArray();
            for (var i = 0; i < values.length; i++) {
                var v = values[i];
                if (v == "") {
                    return true;
                }
            };
            return false;
        }

        this.invalidEmail = function () {
            return !this.validateEmail(this.email);
        }

    }

    // Returns whether the given text is a valid email
    // Source: w3resource.com
    validateEmail = function (inputText) {
        var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return inputText.match(mailformat);
    }

}


// Data object for returning invalid forms
class InvalidIDs {
    // Stores an array of ints representing the indices of all invalid form blocks
    constructor(emptyForms = [], invalidEmails = []) {
        this.emptyForms = emptyForms;
        this.invalidEmails = invalidEmails;

        // Gets the index of the first invalid form
        this.getFirstForm = function () {
            var firstEmpty = Number.MAX_VALUE;
            var firstInvalid = Number.MAX_VALUE;

            if (this.emptyForms.length > 0) {
                firstEmpty = emptyForms[0];
            }
            if (this.invalidEmails.length > 0) {
                firstInvalid = invalidEmails[0];
            }

            return Math.min(firstEmpty, firstInvalid);
        }

        // Returns whether both emptyForms and invalidEmails are empty
        // if true, there are no invalid forms
        this.isEmpty = function () {
            return emptyForms.length == 0 && invalidEmails.length == 0;
        }

    }
}

// URLs for the google script
const scriptURL = "https://script.google.com/macros/s/AKfycbxnh3Zf1o6CdHFwB2cdADW30rpFM5HZAbL613T4xXp4hqcMoA0/exec";
const tiersURL = "https://script.google.com/macros/s/AKfycbzt0byNi_oIceYma3OEP0CHJHMaTWKYEVbfhUt_6_AJL_mdG-yq/exec"


// Names for the IDs of the HTML Elements
const mainDivID = "add-student-forms"; // Represents the ID of the div the form will be placed into
const formID = "form";
const fNameID = "fname";
const lNameID = "lname";
const emailID = "email";
const blockID = "block";
const invalidID = "invalid";

// HTML string that initializes the form (creates the required div's and buttons)
const setupHTML = "<div id=\"student_forms\"></div>"
    + "<h2><button class=\"add-student-button\" onclick=\"addForm()\">Add Student</button> </h2> <br> <br> <br>"
    + "<h3><button class=\"submit-button\" id=\"submit_forms\" onclick=\"submitForm()\">Submit</button></h3>"
    + "<div id=\"submit_message\"></div>";

// Helper function to make HTML Strings for the user
function makeHTMLString(HTMLClass, message) {
    return "<div class=\"" + HTMLClass + "\"><p>" + message + "</p></div>";
}

// HTML String to be shown to the user if the form submission was successful
const successString = makeHTMLString("success", "Your information was successfully submitted! Feel free to add more students as necessary");

// HTML String to be shown to the user if the form submission failed
const errorString = makeHTMLString("error", "Sorry, there was an error in submitting your data. Please try again.");

// HTML String to be shown to the user during the form submission
const pendingString = makeHTMLString("success", "Submitting your form...");

// HTML String to be shown to the user if the script is unable to get the tier data from the server
const tierFailureString = makeHTMLString("error", "Error: Unable to load form. Please refresh the page and try again later.");

// HTML String for the loading animation
// Source: loading.io
const loadingAnimationString = "<div class=\"lds-roller\"><div></div><div></div><div></div><div>"
    + "</div><div></div><div></div><div></div><div></div></div>";

// String to be shown if the user forget to fill out a form entry
const emptyEntryString = "Please ensure all form fields are filled.";

// String to be shown if the user puts in an invalid email address
const invalidEmailString = "Please ensure the email address is valid.";


// Speed of adding/removing form blocks in milliseconds
const animationSpeed = 200;

// Programmer enforced invariant: numForms = the number of forms on the page
var numForms = 0;

// MemberSpace member object
var currentMember

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
    _callback();
}


// Gets the plan of the current teacher
// TODO: If multiple plans, get highest tier
function getPlan(member) {
    if (tiers) {
        // Finds the first (and top priority) tier the member has
        for (var i = 0; i < tiers.length; i++) {
            if (member.plans.includes(tiers[i])) {
                return tiers[i];
            }
        }
        // Member tier does not exist in spreadsheet
        throw "Invalid member tier";
    } else {
        getTiers(function () {return});
        throw "tiers haven't been recieved from server";
    }
}



// Gets the information of the teacher filling out the form
function getUserValues() {
    var userValues = [];
    userValues.push(currentMember.firstName, currentMember.lastName, currentMember.email, getPlan(currentMember));
    console.log("Current user values: " + userValues);
    return userValues;
}


// Initializes form and tiers
initForm();

// Calls getTiers to get the list of tiers from the server and passes a callback to set up the form once the tiers have been made
async function initForm() {
    document.getElementById(mainDivID).innerHTML = loadingAnimationString;
    var maxFail = 5;
    var failureCounter = 0;
    while (!tiers) {
        try {
            await getTiers(initFormCallback);
        } catch (err) {
            // Increase the fail counter, if the request failed too many times, show an error
            failureCounter++;
            if (failureCounter >= maxFail) {
                handleTierRequestFailure();
                return;
            }
        }
    }
}

// Callback for initForm after the tiers have been created
function initFormCallback() {
    createHTML();
    addForm();
}

// Creates the HTML that sets up the form, creating divs and buttons
function createHTML() {
    document.getElementById(mainDivID).innerHTML = setupHTML;
}

function handleTierRequestFailure() {
    document.getElementById(mainDivID).innerHTML = tierFailureString;
}

// Makes a single HTML form to be shown to the user
// index: integer -- the index of the form to be created
// fName: string -- the first name to be filled into the form
// lName: string -- the last name to be filled into the form
// email: string -- the email to be filled into the form
// Returns: string -- the HTML code that represents the created form
function makeForm(index, fName = "", lName = "", email = "") {
    var formString = "<div id=\"block" + index + "\">\n"
        + "<div class=\"form-block\">"
        + "<span class=\"form-element\">\n"
        + "<br><h3><button class=\"remove-button\" onclick=\"removeForm(" + index + ")\">-</button></h3></span>\n"
        + "<span class=\"form-element\">\n"
        + "<form class=\"form-text\" id=\"" + formID + index + "\">\n"
        + "First Name: <input type=\"text\" id=\"" + fNameID + "\" value=\"" + fName + "\"><br>\n"
        + "Last Name: <input type=\"text\" id=\"" + lNameID + "\" value=\"" + lName + "\"><br>\n"
        + "Email: <input type=\"text\" id=\"" + emailID + "\" value=\"" + email + "\">\n"
        + "</form></span>\n"
        + "<div class=\"invalid\" id=\"" + invalidID + index + "\"></div>"
        + "</div>"
        + "</div><br>\n\n";
    console.log(formString);
    return formString;
}

// Makes and fills out HTML forms based on the StudentForm array it is given
// studentForms: StudentForm[] -- the data do be filled into the forms
// Returns: string -- the HTML code that represents the created forms
function makeForms(studentForms) {
    var formString = "";
    for (var i = 0; i < studentForms.length; i++) {
        var currentForm = studentForms[i];
        formString += makeForm(i, currentForm.fName, currentForm.lName, currentForm.email);
    }
    return formString;
}

// Shows the current forms on the web page, and fills out the information based on the input
// studentForms: StudentForm[] -- the preexisting information to be filled out on the page
function showForms(studentForms) {
    var formsString = makeForms(studentForms);
    console.log(formsString);
    document.getElementById("student_forms").innerHTML = formsString;
}

// Adds another form to the end of the list
function addForm() {
    var currentForms = readForms();
    currentForms.push(new StudentForm());
    console.log("currentForms length at init: " + currentForms.length);
    showForms(currentForms);
    animateAddForm(currentForms.length - 1);
    numForms++;
    console.log("numForms: " + numForms);
}

// Animates adding a new form
function animateAddForm(index) {
    var id = "#" + blockID + index;
    $(id).hide(0, function () {
        $(id).show(animationSpeed);
    })
}

// Removes a form at the requested index
function removeForm(index) {
    currentForms = readForms();
    if (index >= 0 && index < currentForms.length) {
        var id = "#" + blockID + index;
        $(id).hide(animationSpeed, function () {
            currentForms.splice(index, 1);
            showForms(currentForms);
            numForms--;
            if (numForms == 0) {
                addForm();
            }
        });
    }
}


// Reads the current forms on the page and returns the data as an array of StudentForms
function readForms() {
    var studentForms = new Array();
    console.log("numForms in readForms: " + numForms);
    for (var i = 0; i < numForms; i++) {
        console.log("in the readForms loop, index: " + i);
        var currentForm = document.forms[formID + i];
        var currentStudent = new StudentForm(
            currentForm[fNameID].value, currentForm[lNameID].value, currentForm[emailID].value);
        studentForms.push(currentStudent);
    }
    console.log("size of studentForms: " + studentForms.length);
    return studentForms;
}

// Testing method for validateForms, initializes the argument
function validateFormsTester() {
    var studentForms = readForms();
    console.log(validateForms(studentForms));
}

// Makes sure that all form entries are valid
// studentForms: StudentForm[] -- the current form information on the page
// Returns: InvalidIDs
function validateForms(studentForms) {
    var emptyBlocks = [];
    var invalidEmailBlocks = [];
    for (var i = 0; i < studentForms.length; i++) {
        var sf = studentForms[i];
        if (sf.hasEmpty()) {
            emptyBlocks.push(i);
        }
        if (sf.invalidEmail()) {
            invalidEmailBlocks.push(i);
        }
    }
    return new InvalidIDs(emptyBlocks, invalidEmailBlocks);
}

// Handles invalid forms, shows the user messages based on form entries
function handleInvalidForms(invalidIDs) {
    var emptyBlocks = invalidIDs.emptyForms;
    var invalidEmailBlocks = invalidIDs.invalidEmails;
    displayInvalidMessage(emptyBlocks, emptyEntryString);
    displayInvalidMessage(invalidEmailBlocks, invalidEmailString);
    focusForm(invalidIDs.getFirstForm());
}

// Handles Form blocks with empty entries
// invalidBlocks: Array of number representing the indices of the blocks the message will be appended to
// message: HTML string that will be appended to the blocks and shown to the user
function displayInvalidMessage(invalidBlocks, message) {
    for (var i = 0; i < invalidBlocks.length; i++) {
        var currentForm = document.getElementById(invalidID + invalidBlocks[i]);
        if (currentForm.innerHTML != "") {
            currentForm.innerHTML += "<br>";
        }
        currentForm.innerHTML += message;
    }
}

// Focuses the form block at the requested index
function focusForm(index) {
    var formBlock = document.getElementById(blockID + index);
    formBlock.focus();
    formBlock.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Reads the current form and constructs a 2D array of all the entries to be sent to the server
// Returns: 2d Array of String -- String[][]
function makeFormArray() {
    var formArray = [];
    var studentForms = readForms();
    // console.log(studentForms);
    for (var i = 0; i < studentForms.length; i++) {
        var sf = studentForms[i];
        // console.log(sf);
        var studentArray = sf.toArray();
        var teacherArray = getUserValues();
        var tempArray = studentArray.concat(teacherArray)
        formArray.push(tempArray);
    }
    return formArray;
}

// Makes the body of the JSON to be sent to the sever with the form information
// Returns: JSON string
function makeFormBody() {
    var formArray = makeFormArray()
    var formBody = {
        value: formArray,
        numForms: formArray.length,
        tier: getPlan(currentMember)
    }
    console.log("form body: " + JSON.stringify(formBody));
    return formBody;
}

// Resets the forms and deletes all messages
function resetForms() {
    var studentForms = readForms();
    showForms(studentForms);
}

// Submits the form to the Google Script through an AJAX request
//$('#submit_forms').on('click', function (e) {
function submitForm() {
    submitInProgress();
    resetForms();
    var studentForms = readForms();
    var invalidIDs = validateForms(studentForms);
    try {
        if (invalidIDs.isEmpty()) {
            // Send the request
            //e.preventDefault();
            var jqxhr = $.ajax({
                url: scriptURL,
                method: "GET",
                dataType: "json",
                data: makeFormBody(),
                error: function (err) {
                    throw err;
                },
                success: function (suc) {
                    if (suc.result == "success") {
                        submitSuccess(suc);
                    } else {
                        throw err;
                    }
                }
            })
        } else {
            // Handle invalid entries
            handleInvalidForms(invalidIDs);
            document.getElementById("submit_message").innerHTML = "";
        }
    } catch (err) {
        submitError(err);
    }
};

// Shows the user a pending message
function submitInProgress() {
    console.log("Subimtting data....");
    document.getElementById("submit_message").innerHTML = loadingAnimationString;
}

// Shows the user a success message and resets the form
function submitSuccess(suc) {
    console.log("Success!!");
    console.log("AJAX success in request: " + JSON.stringify(suc, null, 2));
    document.getElementById("student_forms").innerHTML = "";
    numForms = 0;
    addForm();
    document.getElementById("submit_message").innerHTML = successString;
}

// Shows the user an error message and maintains the form
function submitError(err) {
    console.log("Error");
    console.log("AJAX error in request: " + JSON.stringify(err, null, 2));
    document.getElementById("submit_message").innerHTML = errorString;
}