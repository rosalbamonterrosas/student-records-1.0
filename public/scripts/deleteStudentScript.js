/**
 * When the form with id 'record_id_form' is submitted, ajax is used to send a
 * request using the delete method. The url of the request includes the 
 * record id from the user input. A success or error message is displayed
 * depending on the result of the request.
 */
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
