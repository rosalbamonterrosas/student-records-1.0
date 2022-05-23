//studentserver.js

const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const fs = require('fs');
const glob = require("glob")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('./public'));

/**
 * Creates a record id based on the current time value, and gets the first
 * name, last name, gpa, and enrollment status of the student from the request
 * body. All of the student files are read in order to check for duplicates,
 * based on the student's first and last name, before writing to a new file to
 * create a new student. If a duplicate is found, an error message is sent.
 * If there is no duplicate, the new student is created.
 */
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

/**
 * Gets the record id from the parameter of the request URL. Reads the file
 * of the student corresponding to that record id and sends the student's data
 * in the response.
 */
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

/**
 * Writes to a file and includes the record id in the filename. If there is an
 * error writing to the file, the error message is included in the response.
 * 
 * @param {*} record_id the record id of a student
 * @param {*} content the content to be written to the file
 * @param {*} res response of the request
 */
const write = (record_id, content, res) => {
  fs.writeFile("students/" + record_id + ".json", content, function(err) {
    var rsp_obj = {};
    if(err) {
      rsp_obj.record_id = -1;
      rsp_obj.message = 'error - unable to create resource';
      return res.status(200).send(rsp_obj);
    } else {
      rsp_obj.record_id = record_id;
      rsp_obj.message = 'successfully created';
      return res.status(201).send(rsp_obj);
    }
  }); //end writeFile method
}

/**
 * Gets the first name and last name of the student from the query parameters
 * if included in the request URL. Reads all of the students' files and searches
 * the files to find a match for the first name and/or last name. If either the 
 * first name or last name is not provided in the query parameter, an empty 
 * string is used in place of the missing parameter to include all 
 * possibilities for that value. This way, the user can choose search based on 
 * only first name or last name, or get all students. This enhances the user's 
 * experience by providing different search options. If a match is found, the 
 * data of the match is saved into an array. Once all of the files have been
 * searched, the saved data gets sent in the response.
 */
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

/**
 * Gets the record id from the parameter of the request URL. Updates a 
 * student's file using the first name, last name, gpa, and enrollment status 
 * of the student included in the request body. If the student file does not
 * already exist, an error message is sent in the response.
 */
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

/**
 * Gets the record id from the parameter of the request URL. Deletes the 
 * student file pertaining to that record id.
 */
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

app.listen(5678); //start the server
console.log('Server is running at http://localhost:5678');