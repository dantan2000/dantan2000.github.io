
// Handles the form that the user sees
class StudentForm {
    constructor(fName = "", lName = "", email = "") {
        this.date = new Date();
        this.fName = fName;
        this.lName = lName;
        this.email = email;

        // Returns the information stored in this StudentForm as an array
        this.toArray = function() {
            return [this.date.toString(), this.fName, this.lName, this.email];
        }
    }
}

// Names for the IDs of the HTML Elements
const formID = "form";
const fNameID = "fname";
const lNameID = "lname";
const emailID = "email";

// HTML String to be shown to the user if the form submission was successful
const successString = "<div class=\"success\"><p>Your information was successfully submitted!"
                            + " Feel free to add more students as necessary.</p></div>";

// HTML String to be shown to the user if the form submission failed
const errorString = "<div class=\"error\"><p>There was an error in submitting your data."
+ " Please try again.</p></div>";

var numForms = 0;

// Test values for appending to a sheet
var values = [
    [
        "john", "doe", "johndoe@gmail.com"
    ],
    [
        "jane", "deer", "janedeer@gmail.com"
    ]
]
var body = {
    value: values,
    numForms: 3
}


// Initializes form
addForm();

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

// Makes a single HTML form to be shown to the user
// index: integer -- the index of the form to be created
// fName: string -- the first name to be filled into the form
// lName: string -- the last name to be filled into the form
// email: string -- the email to be filled into the form
// Returns: string -- the HTML code that represents the created form
function makeForm(index, fName = "", lName = "", email = "") {
    var formString = "<div class=\"form-block\">\n"
        + "<span class=\"form-element\">\n"
        + "<br><h3><button class=\"remove-button\" onclick=\"removeForm(" + index + ")\">-</button></h3></span>\n"
        + "<span class=\"form-element\">\n"
        + "<form class=\"form-text\" id=\"" + formID + index + "\">\n"
        + "First name: <input type=\"text\" id=\"" + fNameID + "\" value=\"" + fName + "\"><br>\n"
        + "Last name: <input type=\"text\" id=\"" + lNameID + "\" value=\"" + lName + "\"><br>\n"
        + "email: <input type=\"text\" id=\"" + emailID + "\" value=\"" + email + "\">\n"
        + "</form></span>\n\n"
        + "</div><br>\n";
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
    numForms++;
    console.log("numForms: " + numForms);
}

// Removes a form at the requested index
function removeForm(index) {
    currentForms = readForms();
    if (index >= 0 && index < currentForms.length) {
        currentForms.splice(index, 1);
        showForms(currentForms);
        numForms--;
    }
}

// Reads the current form and constructs a 2D array of all the entries to be sent to the server
// Returns: 2d Array of String -- String[][]
function makeFormArray() {
    var formArray = [];
    var studentForms = readForms();
    // console.log(studentForms);
    for (i = 0; i < studentForms.length; i++) {
        var sf = studentForms[i];
        // console.log(sf);
        formArray.push(sf.toArray());
    }
    return formArray;
}

// Makes the body of the JSON to be sent to the sever with the form information
// Returns: JSON string
function makeFormBody() {
    var formArray = makeFormArray()
    var formBody = {
        value: formArray,
        numForms: formArray.length
    }
    console.log("form body: " + JSON.stringify(formBody));
    return formBody;
}

$('#submit_forms').on('click', function(e) {

    /*
    var request = jQuery.ajax({
        crossDomain:true,
        url: "https://script.google.com/macros/s/AKfycbz3mCn0HWYzuYFkeMKqkpdZBcuHDIHSJnKh9Gf6IAbbF0NAEUY/exec",
        method: "GET",
        dataType: "json",
        data: body
    }); 
    console.log(e); */

    console.log(JSON.stringify(body));
    e.preventDefault();
    var jqxhr = $.ajax({
      url: "https://script.google.com/macros/s/AKfycbz3mCn0HWYzuYFkeMKqkpdZBcuHDIHSJnKh9Gf6IAbbF0NAEUY/exec",
      method: "GET",
      dataType: "json",
      data: makeFormBody(),
      error: function (err) {
          submitError(err);
      },
      success: function (suc) {
          if (suc.result == "success") {
            submitSuccess(suc);
          } else {
            submitError(suc);
          }
      }
    })
  });

  function submitSuccess(suc) {
    console.log("Success!!");
    console.log("AJAX success in request: " + JSON.stringify(suc, null, 2));
    document.getElementById("student_forms").innerHTML = "";
    addForm();
    document.getElementById("submit_message").innerHTML = successString;
  }

  function submitError(err) {
    console.log("Success!!");
    console.log("AJAX success in request: " + JSON.stringify(err, null, 2));
    document.getElementById("submit_message").innerHTML = errorString;
  }