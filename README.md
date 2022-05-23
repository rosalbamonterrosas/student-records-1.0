# Student Records - Node.js + Express + Curl/Postman
Rosalba Monterrosas

# Table of Contents

- [About the Project](#about-the-project)
  - [Built With](#built-with)
- [Project Explanation](#project-explanation)
  - [Add Student](#add-student)
  - [Update Student](#update-student)
  - [Delete Student](#delete-student)
  - [Get Student](#get-student)
  - [Search Students](#search-students)

## About the Project

This project contains a main html file, students.html, where the user can click
on one of the following five options: add a student, update a student, delete a
student, get a student, or search the students. The following HTTP methods are
used in the request for each option:

* POST: create a new student and checks for duplicates
* PUT: update a student by record id
* DELETE: delete a student by record id
* GET: display a single student by record id
* GET: searching for student based on first and last name

The frontend interacts with the existing backend (studentserver.js).

### Built With

* [Express](https://expressjs.com/)
* [Node.js](https://nodejs.org/)
* [HTML](https://html.com)
* [CSS](https://www.w3.org/Style/CSS/)
* [Bootstrap](https://getbootstrap.com)
* [JavaScript](https://www.javascript.com/)
* [JQuery](https://jquery.com)
* [Font Awesome](https://fontawesome.com/)

## Project Explanation

### Add Student

Clicking on the “Add student” option in the home page opens up the 
addStudent.html file in a new tab. 

The addStudent.html file uses a form to 
obtain the values of the input fields, and sends a request using the POST 
method and input values to create a new student, as shown in the code below.

```
<!-- Form for input fields -->
<form action="/students" method="post">
    <div class="row">
    <!-- First name -->
    <label for="first_name" class="col-4 text-end">First name:</label>
    <input type="text" id="first_name" name="first_name" value="" class="col-4" required>
    </div>
    <br>
    <div class="row">
    <!-- Last name -->
    <label for="last_name" class="col-4 text-end">Last name:</label>
    <input type="text" id="last_name" name="last_name" value="" class="col-4" required>
    </div>
    <br>
    <div class="row">
    <!-- GPA -->
    <label for="gpa" class="col-4 text-end">GPA:</label>
    <input type="number" id="gpa" name="gpa" step="0.01" min="0" max="4" class="col-4" required>
    </div>
    <br>
    <!-- Enrolled radio buttons -->
    <label for="enrolled" class="col-4 text-end">Enrolled:</label>
    
    <input type="radio" id="true" name="enrolled" value=true required>
    <label for="true">True</label>

    <input type="radio" id="false" name="enrolled" value=false>
    <label for="false">False</label> 
    <br><br>
    <div class="row">
    <div class="col-5"></div>
    <!-- Submit button -->
    <input type="submit" value="Submit" class="btn-light col-2">
    </div>
</form> 
```

The function below is the POST method in the studentserver.js file, which
creates a record id based on the current time value, and gets the first name, 
last name, gpa, and enrollment status of the student from the request body. All 
of the student files are read in order to check for duplicates, based on the 
student's first and last name, before writing to a new file to create a new 
student. If a duplicate is found, an error message is sent. If there is no 
duplicate, the new student is created.

```
app.post('/students', function(req, res) {
  var record_id = new Date().getTime();

  var obj = {};
  obj.record_id = record_id;
  obj.first_name = req.body.first_name;
  obj.last_name = req.body.last_name;
  obj.gpa = parseFloat(req.body.gpa);
  obj.enrolled = (req.body.enrolled.toString() == 'true');  // convert to bool

  // Read all students files and check for duplicates
  glob("students/*.json", null, function (err, files) {
    if (err) {
      return res.status(500).send({"message":"error - internal server error"});
    }
    checkDup(files, res, obj);
  });

  // Check for duplicate before writing file
  const checkDup = (files, res, obj) => {
    if (files.length == 0) {  // No duplicates found in all files
      write(obj.record_id, JSON.stringify(obj, null, 2), res);
      return;
    }
    fname = files.pop();  // Get next file
    if (!fname)
      return;
    fs.readFile(fname, "utf8", function(err, data) {
      if (err) {
        return res.status(500).send({"message":"error - internal server error"});
      } else {
        const dataObj = JSON.parse(data);
        // Check for duplicate based on first and last name
        if (dataObj.first_name.toLowerCase() == obj.first_name.toLowerCase() 
          && dataObj.last_name.toLowerCase() == obj.last_name.toLowerCase()) {
          // Duplicate found
          return res.status(405).send(  
            {"message": `error - duplicate found for ${dataObj.first_name} ${dataObj.last_name}`},
          );
        }
        // No duplicate found yet
        checkDup(files, res, obj);
      }
    });  
  }
}); 
```

### Update Student

Next, clicking on the “Update student” option in the home page opens up the 
updateStudent.html file in a new tab. 

The function below depicts that when the form with id 'student_form' is 
submitted in the updateStudent.html file, ajax is used in the 
updateStudentScript.js file to send a request using the PUT method. The url of 
the request includes the record id from the user input. The request body 
includes the first name, last name, gpa, and enrollment status of the student. 
A success or error message is displayed depending on the result of the 
request.

```
$("#student_form").submit((event) => {
    // Get input fields' values
    var record_id = $("#record_id").val();
    var first_name_val = $("#first_name").val();
    var last_name_val = $("#last_name").val();
    var gpa_val = $("#gpa").val();
    var enrolled_val = $('input[name=enrolled]:checked').val();
    $.ajax({
      url: "http://localhost:5678/students/"+record_id,
      type: "put",
      data: { 
        first_name: first_name_val,
        last_name: last_name_val,
        gpa: gpa_val,
        enrolled: enrolled_val
      },
      success: function(response) {
        console.log(response)
        $("#result").text("Succesfully updated student with Record ID " + record_id);
      },
      error: function(xhr) {
        $("#result").text('error: ' + xhr.responseText);  // error message 
      }
    });
    event.preventDefault();  // Prevent form from resetting
});
```

The function below is the PUT method in the studentserver.js file, which gets 
the record id from the parameter of the request URL. Updates a student's file 
using the first name, last name, gpa, and enrollment status of the student 
included in the request body. If the student file does not already exist, an 
error message is sent in the response.

```
app.put('/students/:record_id', function(req, res) {
  var record_id = parseInt(req.params.record_id);
  var fname = "students/" + record_id + ".json";
  var rsp_obj = {};
  var obj = {};

  obj.record_id = record_id;
  obj.first_name = req.body.first_name;
  obj.last_name = req.body.last_name;
  obj.gpa = parseFloat(req.body.gpa);
  obj.enrolled = (req.body.enrolled.toString() == 'true');  // convert to bool;

  var str = JSON.stringify(obj, null, 2);
  
  //check if file exists
  fs.stat(fname, function(err) {
    if(err == null) {  //file exists
      fs.writeFile("students/" + record_id + ".json", str, function(err) {
        var rsp_obj = {};
        if(err) {
          rsp_obj.record_id = record_id;
          rsp_obj.message = 'error - unable to update resource';
          return res.status(200).send(rsp_obj);
        } else {
          rsp_obj.record_id = record_id;
          rsp_obj.message = 'successfully updated';
          return res.status(201).send(rsp_obj);
        }
      });
    } else {  // file does not exist
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'error - resource not found';
      return res.status(404).send(rsp_obj);
    }
  });
}); 
```

### Delete Student

Next, clicking on the “Delete student” option in the home page opens up the 
deleteStudent.html file in a new tab. 

The function below depicts that when the form with id 'record_id_form' is 
submitted in the deleteStudent.html file, ajax is used in the 
deleteStudentScript.js file to send a request using the DELETE method. The url 
of the request includes the record id from the user input. A success or error 
message is displayed depending on the result of the request.

```
$("#record_id_form").submit((event) => {
    var record_id = $("#record_id").val();  // get record id input
    $.ajax({
      url: "http://localhost:5678/students/"+record_id,
      type: "delete",
      success: function(response) {
        $("#result").text("Succesfully deleted student with Record ID " + record_id);
      },
      error: function(xhr) {
        $("#result").text('error: ' + xhr.responseText);  // error message 
      }
    });
    event.preventDefault();  // Prevent form from resetting
    $("#record_id").val('');  // Clear record id input
});
```

The function below is the DELETE method in the studentserver.js file, which 
gets the record id from the parameter of the request URL. Deletes the student 
file pertaining to that record id.

```
app.delete('/students/:record_id', function(req, res) {
  var record_id = req.params.record_id;
  var fname = "students/" + record_id + ".json";

  fs.unlink(fname, function(err) {
    var rsp_obj = {};
    if (err) {
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'error - resource not found';
      return res.status(404).send(rsp_obj);
    } else {
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'record deleted';
      return res.status(200).send(rsp_obj);
    }
  });
});
```

### Get Student

Next, clicking on the “Get student” option in the home page opens up the 
getStudent.html file in a new tab.

The function below depicts that when the form with id 'record_id_form' is 
submitted in the deleteStudent.html file, ajax is used in the 
deleteStudentScript.js file to send a request using the GET method. The url of 
the request includes the record id from the user input. A success or error 
message is displayed depending on the result of the request. 

```
$("#record_id_form").submit((event) => {
    var record_id = $("#record_id").val();  // get record id input
    $.ajax({
      url: "http://localhost:5678/students/"+record_id,
      type: "get",
      success: function(response) {
        $("#result").text(response);
      },
      error: function(xhr) {
        $("#result").text('error: ' + xhr.responseText);  // error message 
      }
    });
    event.preventDefault();  // Prevent form from resetting
    $("#record_id").val('');  // Clear record id input
});
```

The function below is the GET method in the studentserver.js file for getting a 
single student based on their record id, which gets the record id from the 
parameter of the request URL. Reads the file of the student corresponding to 
that record id and sends the student's data in the response.

```
app.get('/students/:record_id', function(req, res) {
  var record_id = req.params.record_id;

  fs.readFile("students/" + record_id + ".json", "utf8", function(err, data) {
    if (err) {
      var rsp_obj = {};
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'error - resource not found';
      return res.status(404).send(rsp_obj);
    } else {
      return res.status(200).send(data);  
    }
  });
}); 
```

### Search Students

Lastly, clicking on the “Search students” option in the home page opens up the 
searchStudent.html file in a new tab.

The searchStudent.html file uses a form to obtain the values of the first name 
and last name input fields, and sends a request using the GET method and input 
values to search the students, as shown in the code below.

```
<!-- Form for input fields -->
<form action="/students" method="get">
    <div class="row">
    <!-- First name -->
    <label for="first_name" class="col-4 text-end">First name:</label>
    <input type="text" id="first_name" name="first_name" value="" class="col-4">
    </div>
    <br>
    <div class="row">
    <!-- Last name -->
    <label for="last_name" class="col-4 text-end">Last name:</label>
    <input type="text" id="last_name" name="last_name" value="" class="col-4">
    </div>
    <br>
    <div class="row">
    <div class="col-5"></div>
    <!-- Submit button -->
    <input type="submit" value="Submit" class="btn-light col-2">
    </div>
</form> 
```

The function below is the GET method in the studentserver.js file for 
searching the students, which gets the first name and last name of the student 
from the query parameters if included in the request URL. Reads all of the 
students’ files and searches the files to find a match for the first name 
and/or last name. If either the first name or last name is not provided in the 
query parameter, an empty string is used in place of the missing parameter to 
include all possibilities for that value. This way, the user can choose search 
based on only first name or last name, or get all students. This enhances the 
user's experience by providing different search options. If a match is found, 
the data of the match is saved into an array. Once all of the files have been 
searched, the saved data gets sent in the response.

```
app.get('/students', function(req, res) {
  var obj = {};
  var arr = [];
  filesread = 0;
  var first_name = req.query.first_name;
  var last_name = req.query.last_name;

  // Read all students files and searches for a match
  glob("students/*.json", null, function (err, files) {
    if (err) {
      return res.status(500).send({"message":"error - internal server error"});
    }
    searchName(files, res, first_name, last_name, []);
  });

  // Search for a match based on first_name and/or last_name
  const searchName = (files, res, first_name="", last_name="", arr) => {
    if (files.length == 0) {  // Done searching all files
      var obj = {};
      obj.students = arr;
      return res.status(200).send(obj);  // Send matches
    }
    fname = files.pop();  // Get next file
    if (!fname)
      return;
    fs.readFile(fname, "utf8", function(err, data) {
      if (err) {
        return res.status(500).send({"message":"error - internal server error"});
      } else {
        const dataObj = JSON.parse(data);
        // Check for match based on first and last name
        if (dataObj.first_name.toLowerCase().startsWith(first_name.toLowerCase()) 
          && dataObj.last_name.toLowerCase().startsWith(last_name.toLowerCase())) {
          // Match found 
          arr.push(dataObj);
        }
        // Not done searching all files yet
        searchName(files, res, first_name, last_name, arr);
      }
    });  
  }
});
```