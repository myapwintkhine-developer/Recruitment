$(document).ready(function() {
	var baseAjaxUrl = '/interviewer/candidate-data';

	function loadPositionsForSort(targetSelect) {

		$.ajax({
			url: "/interviewer/position-for-sort",
			type: "GET",
			success: function(response) {
				var positionSelect = $(targetSelect);
				positionSelect.empty();
				positionSelect.append('<option value="all">All</option>');
				response.forEach(function(position) {
					var option = $("<option>")
						.val(position.name)
						.text(position.name);
					positionSelect.append(option);
				});
			},
			error: function(xhr, status, error) {
				console.error(error);
			}
		});
	}

	function loadDepartmentForSort(targetSelect) {
		$.ajax({
			url: "/interviewer/department-for-sort",
			type: "GET",
			success: function(response) {
				var departmentSelect = $(targetSelect);

				departmentSelect.empty();

				departmentSelect.append('<option value="all">All</option>');
				response.forEach(function(department) {
					var option = $("<option>")
						.val(department.name)
						.text(department.name);
					departmentSelect.append(option);
				});
			},
			error: function(xhr, status, error) {
				console.error(error);
			}
		});
	}

	// Load positions on initial page load
	loadPositionsForSort("#positionSort");
	loadDepartmentForSort("#departmentSort");


	function filterData(position, department) {
		var table = $('#candidateTable').DataTable();
		var positionFilter = position === 'all' ? '' : position;
		var departmentFilter = department === 'all' ? '' : department;
		table.search('').columns().search('').draw();

		table.column(1).search(positionFilter, true, false);
		table.column(2).search(departmentFilter, true, false);

		// Redraw the table to apply the filters
		table.draw();
	}

	// Attach the event handlers
	// Type, Status, Stage, and Position filter change events
	$('#positionSort,#departmentSort').on('change', function() {
		var selectedPosition = $('#positionSort').val();
		var selectedDepartment = $('#departmentSort').val();
		filterData(selectedPosition, selectedDepartment);
	});

	const $reviewText = $('#reviewText');
    const $submitReviewButton = $('#submitReviewButton');

    // Add an input event listener to the textarea
    $reviewText.on('input', function() {
        const reviewContent = $reviewText.val().trim();

        // Enable or disable the submit button based on the review content length
        if (reviewContent.length < 2) {
            $submitReviewButton.prop('disabled', true);
        } else {
            $submitReviewButton.prop('disabled', false);
        }
    });

    // Initialize the button state on page load
    $submitReviewButton.prop('disabled', true);



	var table = $('#candidateTable').DataTable({
		processing: true,
		serverSide: true,
		ajax: {
			url: baseAjaxUrl,
			type: 'GET',
		},
		columns: [
			{ data: "name", responsivePriority: 2 },
			{ data: "vacancy.position.name", responsivePriority: 3 },
			{ data: "vacancy.department.name"},
			{ data: "mainTech", responsivePriority: 4 },
			{
				data: 'submitDate',
				responsivePriority: 5,
				render: function(data) {
					if (data) {
						const date = new Date(data);
						const day = String(date.getDate()).padStart(2, '0');
						const month = String(date.getMonth() + 1).padStart(2, '0');
						const year = date.getFullYear();
						return `${day}-${month}-${year}`;
					}
					return '';
				},
			},
			{ data: "exp", responsivePriority: 6 },

			{
				data: "candidateInterviews",
				render: function(data, type, row) {
					var lastStatus = data[data.length - 1];
					if (lastStatus) {
						var statusName = lastStatus.status;
						var statusClass;
						if (statusName === "Reached") {
							statusClass = "status-received";
						} else if (statusName === "Pending") {
							statusClass = "status-viewed";
						} else if (statusName === "Passed") {
							statusClass = "status-considering";
						} else if (statusName === "Cancel") {
							statusClass = "status-decline";
						} else {
							statusClass = ""; // Add a default class if needed
						}
						return '<div class="status-badge ' + statusClass + '">' + statusName + '</div>';
					}
					return '';
				},
				sortable: false, responsivePriority: 7
			},

			{
				data: "candidateInterviews",
				render: function(data, type, row) {
					var lastStatus = data[data.length - 1];
					if (lastStatus) {
						var statusName = lastStatus.interview.stage;

						return '<div class="status-badge stage-info"> stage ' + statusName + '</div>';
					}
					return '';
				},
				sortable: false,
				responsivePriority: 8
			},
			{
				data: "id",
				render: function(data, type, row) {
					var currentUserRole;

					$.ajax({
						url: '/interviewer/current-user-role',
						type: 'GET',
						async: false,
						success: function(role) {
							currentUserRole = role;
						},
						error: function() {
							currentUserRole = "";
						}
					});

					var lastStatus = row.candidateInterviews[row.candidateInterviews.length - 1];
					var statusName = lastStatus ? lastStatus.status : "";

					var changeStatusButton = `<button type="button" class="btn btn-success success-btn" data-id="${row.id}" id="changeStatusButton"><i class="ti ti-info"></i></button>`;
					var reviewButton = `<button type="button" class="btn btn-info review-btn" data-candidate-id="${row.id}" data-toggle="modal" data-target="#reviewModal"><i class="ti ti-pencil"></i></button>`;
					var content = '<div class="btn-group">' + reviewButton;

					if ((currentUserRole === 'Department-head' || currentUserRole === 'Admin' || currentUserRole === 'Default-Admin') && statusName === "Reached") {
						content += changeStatusButton;
					}
					content += '</div>';
					return content;
				},
				sortable: false,
				responsivePriority: 9
			},
			{
				data: "id",
				render: function(data, type, row) {
					var infoButton = `<button type="button" class="btn btn-info info-btn" data-id="${row.id}" id="infoButton"><i class="bi bi-person-lines-fill"></i></button>`;

					// Add the new button with the icon and action URL
					var historyButton = `<a href="/interviewer/candidate-history/${row.id}" class="btn btn-primary"><i class="bi bi-clock-history text-white"></i></a>`;

					return `<div class="btn-group">${infoButton} ${historyButton}</div>`;
				},
				sortable: false, responsivePriority: 10
			},
		],
		order: [[4, 'desc']],
		paging: true,
		lengthMenu: [10, 15, 20],
		pageLength: 10,


		responsive: true,
		language: {
			"infoFiltered": ""
		}

	});


	$('#interviewStatusSelect,#interviewStageSelect').on('change', function() {

		var interviewStatus = $('#interviewStatusSelect').val();
		var stage = $('#interviewStageSelect').val();
		table.ajax.url(baseAjaxUrl + '?&interviewStatus=' + interviewStatus + '&stage=' + stage).load();

	});

	$("#resetButton").click(function() {

		$("#interviewStatusSelect").val("All");

		$("#interviewStageSelect").val("All");

		$("#positionSort").val("all");
		$("#departmentSort").val("all");

		$("#startDateFrom").val("");
		$("#endDateTo").val("");
		table.clear().draw();
		table.columns().search('').draw();
		table.ajax.url(baseAjaxUrl).load();
	});


	$(document).on('click', '.review-btn', function() {
		var candidateId = $(this).data('candidate-id');
		$('#reviewModal').data('candidateId', candidateId);
	});

	$('#submitReviewButton').click(function() {
		var reviewText = $('#reviewText').val();
		var candidateId = $('#reviewModal').data('candidateId');

		if (candidateId) {
			$.ajax({
				type: 'GET',
				url: '/interviewer/save-reviews',
				data: {
					review: reviewText,
					candidateId: candidateId
				},
				success: function() {
					$('#reviewModal').modal('hide');

					$('#successAlert').show();

					setTimeout(function() {
						$('#successAlert').hide();
					}, 3000);

					table.ajax.reload();
				},
				error: function(error) {
					console.log(error.responseText);
				}
			});
		} else {
			console.log("Candidate ID is not available. Please make sure to set it correctly.");
		}
	});


	// Event handler for the status buttons
	$(document).on('click', '.status-btn', function(e) {
		var button = $(this);
		var candidateId = button.data('candidate-id');
		var newStatusId = button.data('status-id');
		var newStatusName = button.data('status-name');

		// Set the status name in the modal
		$('#statusName').text(newStatusName);

		// Show the confirmation modal
		$('#confirmationModal').modal('show');

		// Set the data attributes for the "OK" button in the modal
		$('#confirmStatusChange').data('candidate-id', candidateId);
		$('#confirmStatusChange').data('status-id', newStatusId);

		// Prevent default behavior of checkbox selection
		e.stopPropagation();
	});

	// Event handler for the status change confirmation
	$(document).on('click', '#confirmStatusChange', function(e) {
		// Hide the confirmation modal
		$('#confirmationModal').modal('hide');

		// Get the selected status ID from the data attribute
		var candidateId = $(this).data('candidate-id');
		var newStatusId = $(this).data('status-id');

		// Update the candidate status on the server
		updateCandidateStatus(candidateId, newStatusId);

		// Prevent default behavior of checkbox selection
		e.stopPropagation();
	});

	// Event handler for the "Cancel" button in the confirmation modal
	$(document).on('click', '#cancelStatusChange', function() {
		// Hide the confirmation modal
		$('#confirmationModal').modal('hide');
	});

	// Attach click event to changeStatusButton elements (using delegated event handler)
	$(document).on('click', '#changeStatusButton', function() {
		// Get the data-id from the clicked button
		const dataId = $(this).data('id');

		// Show the modal
		$('#statusModal').modal('show');

		$('#confirmButton').data('id', dataId);
	});

	$('#confirmButton').click(function() {
		// Get the selected status from the radio buttons
		const selectedStatus = $('input[name="status"]:checked').val();
		const interviewDate = $('#interviewDate').val();
		const candidateId = $(this).data('id');
		$.ajax({
			type: 'GET',
			url: '/interviewer/get-interview-id',
			data: {
				candidateId: candidateId
			},
			success: function(interviewId) {
				// Perform actions based on the selected status and obtained interviewId
				if (selectedStatus && interviewId) {
					$.ajax({
						type: 'GET',
						url: '/interviewer/set-interview-status',
						data: {
							status: selectedStatus,
							candidateId: candidateId,
							interviewId: interviewId,
							date: interviewDate
						},
						success: function() {
							$('#reviewModal').modal('hide');

							$('#successAlert').show();

							setTimeout(function() {
								$('#successAlert').hide();
							}, 3000);

							table.ajax.reload();
						},
						error: function(error) {
							console.log(error.responseText); // Log the error response
							// Handle error if any.
						}
					});

					$('#statusModal').modal('hide');
				}
			},
			error: function(error) {
				console.log(error.responseText); // Log the error response
				// Handle error if any.
			}
		});
	});

	$("#candidateTable tbody").on("click", ".info-btn", function() {
		var rowId = $(this).data("id");

		$.ajax({
			url: "/interviewer/getCandidateInfo",
			type: "GET",
			data: { id: rowId },
			success: function(response) {
				updateUpdateModelContent(response);
				$("#updateModel").modal("show");
			},
			error: function(xhr, status, error) {
				console.log("Error fetching candidate details:", error);
			}
		});
	});

	// Function to update the content of 'updateModel'
	function updateUpdateModelContent(candidateData) {

		var modalBody = $("#updateModel .modal-body");
		var genderDisplay = candidateData.gender === true ? "Female" : "Male";
		var submittedDateTime = candidateData.submitDate + " " + candidateData.submitTime;

		var content = `
      <p>Name: ${candidateData.name}</p>
      <p>Date of Birth: ${candidateData.dob}</p>
      <p>Gender: ${genderDisplay}</p>
      <p>Phone: ${candidateData.phone}</p>
      <p>Education: ${candidateData.education}</p>
      <p>Email: ${candidateData.email}</p>
      <p>Technical Skill: ${candidateData.techSkill}</p>
      <p>Language Skill: ${candidateData.languageSkill}</p>
      <p>Main Technology: ${candidateData.mainTech}</p>
      <p>Experience: ${candidateData.exp}</p>
      <p>Level: ${candidateData.level}</p>
      <p>Expected Salary: ${candidateData.expectedSalary}</p>
      <p>Submitted Date and Time: ${submittedDateTime}</p>
    `;
		modalBody.html(content);
	}

	// Hide the warning modal
	function hideWarningModal() {
		$('#warningModal').modal('hide');
	}


	$(document).on('change', '.status-select-class', function() {
		var candidateId = $(this).data('candidate-id');
		var candidateName = $(this).data('candidate-name');
		var vacancyId = $(this).data('vacancy-id');
		var selectedOption = $(this).val();
		console.log(candidateId);
		// Determine the templateId based on selectedOption
		var templateId = (selectedOption === 'online') ? '4' : '3';

		$.ajax({
			type: "GET",
			url: "/hr/interview-stages",
			data: {
				candidateId: candidateId
			},
			success: function(response) {

				var stage = response;
				console.log(stage);
				$.ajax({
					type: "GET",
					url: "/hr/choose-interview",
					data: {
						interviewType: selectedOption,
						candidateId: candidateId,
						vacancyId: vacancyId,
						stage: stage
					},
					success: function(response) {
						$("#candidateName").text(candidateName);
						$("#successModal").modal("show");
						console.log(response);

						var emailPrepFormUrl = "/hr/email-prepare-form/" + templateId + "?type=" + selectedOption + "&candidateId=" + candidateId;

						$("#sendEmailBtn").on("click", function() {
							// Navigate to the email preparation form URL
							window.location.href = emailPrepFormUrl;
						});

					},
					error: function(error) {
						console.log(error.responseText); // Log the error response
						var errorMessage = error.responseText;
						showWarningModal(errorMessage);
					}
				});
			},
			error: function(error) {
				console.log(error.responseText); // Log the error response
				var errorMessage = error.responseText;
				showWarningModal(errorMessage);
			}
		});
		function showWarningModal(errorMessage) {
			$("#warningMessage").text(errorMessage);
			$('#warningModal').modal('show');
		}
	});

});
