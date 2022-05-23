/**
 * When the form with id 'student_form' is submitted, ajax is used to send a
 * request using the put method. The url of the request includes the 
 * record id from the user input. The request body includes the first name,
 * last name, gpa, and enrollment status of the student. A success or error 
 * message is displayed depending on the result of the request.
 */
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
