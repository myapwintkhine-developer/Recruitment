$(document).ready(function() {

	var baseAjaxUrl = '/hr/canceled-candidate-data';

	function loadPositionsForSort(targetSelect) {

		$.ajax({
			url: "/hr/position-for-sort",
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
			url: "/hr/department-for-sort",
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





	var table = $('#candidateTable').DataTable({
		processing: true,
		serverSide: true,
		ajax: {
			url: baseAjaxUrl,
			type: 'GET',
		},
		language: {
			"infoFiltered": ""
		},
		columns: [
			{ data: "name", responsivePriority: 1 },
			{ data: "vacancy.position.name", responsivePriority: 2 },
			{ data: "vacancy.department.name" },
			{ data: "mainTech", responsivePriority: 3 },
			{
				data: 'submitDate',
				responsivePriority: 4,
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
			{ data: "exp" },
			{
				data: "candidateInterviews",
				render: function(data, type, row) {
					var lastStatus = data[data.length - 1];
					if (lastStatus) {
						var statusName = lastStatus.interview.stage;
						return '<div class="status-badge stage-info"> Stage ' + statusName + '</div>';
					}
					return '<div class="dash">-</div>';
				},
				sortable: false,
				responsivePriority: 9
			},

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
							statusClass = "";
						}
						return '<div class="status-badge ' + statusClass + '">' + statusName + '</div>';
					}
					return '<div class="dash">-</div>';
				},
				sortable: false,
				responsivePriority: 8
			},

			{
				data: "id",
				render: function(data, type, row) {
					var callBack = `<button type="button" class="btn btn-info call-back-btn" data-id="${row.id}" data-name="${row.name}" id="callBackBtn">Recall</button>`;

					return `<div class="btn-group">${callBack} </div>`;
				},
			},


			{
				data: "id",
				render: function(data, type, row) {
					var infoButton = `<button type="button" class="btn btn-info info-btn" data-id="${row.id}" id="infoButton"><i class="ti ti-info"></i></button>`;

					// Add the new button with the icon and action URL
					var historyButton = `<a href="/hr/candidate-history/${row.id}" class="btn btn-primary"><i class="bi bi-clock-history text-white"></i></a>`;

					return `<div class="btn-group">${infoButton} ${historyButton}</div>`;
				},
				sortable: false, responsivePriority: 8
			},
		],
		order: [[4, 'asc']],
		paging: true,
		lengthMenu: [5, 10, 20],
		pageLength: 10,
		responsive: true,




	});

	$('#startDateFrom, #endDateTo,#interviewStageSelect').on('change', function() {
		var startDateFrom = $('#startDateFrom').val();
		var endDateTo = $('#endDateTo').val();
		var stage = $('#interviewStageSelect').val();
		table.ajax.url(baseAjaxUrl + '?startDateFrom=' + startDateFrom + '&endDateTo=' + endDateTo + '&stage=' + stage).load();

	});

	$("#resetButton").click(function() {

		$("#interviewStageSelect").val("All");

		$("#positionSort").val("all");
		$("#departmentSort").val("all");

		$("#startDateFrom").val("");
		$("#endDateTo").val("");
		table.clear().draw();
		table.columns().search('').draw();
		table.ajax.url(baseAjaxUrl).load();
	});


	var candidateIdForModal, candidateNameForModal;
	function generateRadioButtons(vacancies) {
		const modalBody = $('#modalBody'); // Use jQuery to select the modal body

		// Clear existing radio buttons (if any) except for "Online" and "Onsite"
		modalBody.find('input[name="recallType"][value!="Online"][value!="Onsite"]').remove();
		modalBody.find('input[name="vacancy"]').remove();

		// Generate the "Online" and "Onsite" radio buttons if not already present
		const onlineRadio = modalBody.find('input[name="recallType"][value="Online"]');
		if (onlineRadio.length === 0) {
			const onlineLabel = $('<label><input type="radio" name="recallType" value="Online"> Online</label><br>');
			modalBody.prepend(onlineLabel);
		}

		const onsiteRadio = modalBody.find('input[name="recallType"][value="In-person"]');
		if (onsiteRadio.length === 0) {
			const onsiteLabel = $('<label><input type="radio" name="recallType" value="In-person"> In-person</label><br>');
			modalBody.prepend(onsiteLabel);
		}

		// Generate the dynamically fetched radio buttons for vacancies
		vacancies.forEach(vacancy => {
			const label = $('<label></label>');
			const input = $('<input type="radio" name="vacancy" value="' + vacancy.id + '">');
			label.append(input, vacancy.position.name, '<br>');
			modalBody.append(label);
		});
	}


	// Event listener for the "Recall" button click
	$(document).on('click', '.call-back-btn', function(e) {
		e.preventDefault();
		var button = $(this);
		candidateIdForModal = button.data('id');
		candidateNameForModal = button.data('name');

		// Show the modal
		$('#recallModal').modal('show');
	});

	// Event listener for the modal's 'shown.bs.modal' event
	$('#recallModal').on('shown.bs.modal', function() {
		// Fetch active vacancies and generate radio buttons inside the modal
		$.ajax({
			url: '/hr/get-active-vacancy',
			type: 'GET',
			success: function(vacancies) {
				generateRadioButtons(vacancies);
			},
			error: function(error) {
				console.error('Error fetching vacancies:', error);
			}
		});
	});

	$(document).on('click', '#recallBtn', function(e) {
		e.preventDefault();

		// Set the candidate name in the confirmation modal
		$('#candidateNameSpan').text(candidateNameForModal);
		$('#candidateIdSpan').text(candidateIdForModal);

		var selectedType = $('input[name="recallType"]:checked').val();
		var selectedVacancy = $('input[name="vacancy"]:checked').val();

		var templateId = (selectedType === 'Online') ? '4' : '3';

		// Make the Ajax request to chooseInterview endpoint
		$.ajax({
			url: "/hr/choose-interview",
			type: "GET",
			data: {
				interviewType: selectedType,
				candidateId: candidateIdForModal,
				vacancyId: selectedVacancy,
				stage: 1
			},
			success: function(response) {
				// Success response, show the recall confirmation modal
				$('#recallConfirmationModal').modal('show');

				// Event listener for the "Yes, Recall" button click inside the confirmation modal
				$('#confirmRecallBtn').on('click', function() {
					// Redirect to emailPrepFormUrl
					var emailPrepFormUrl = "/hr/email-prepare-form/" + templateId + "?type=" + selectedType + "&candidateId=" + candidateIdForModal + "&stage=1&vacancyId=" + selectedVacancy;
					window.location.href = emailPrepFormUrl;
				});
			},
			error: function(xhr) {
				// Error response, show the error message in the error modal
				$('#errorMessage').text(xhr.responseText);
				$('#errorModal').modal('show');
			}
		});
	});

	//-------------------------------------------------

	function updateCandidateStatus(candidateId, newStatusId) {
		$.ajax({
			url: '/hr/changeSelectionStatus',
			type: 'POST',
			data: { candidateId: candidateId, statusId: newStatusId },
			success: function() {
				// If the update was successful, show the Bootstrap alert notification
				$('#successAlert').show();

				// Hide the alert after 3 seconds (3000 milliseconds)
				setTimeout(function() {
					$('#successAlert').hide();
				}, 3000);

				// Refresh the table data using AJAX
				table.ajax.reload();
			},
			error: function() {
				// Handle error if needed
				alert('Failed to update candidate status.');
				// Revert the table data to its original state
				table.ajax.reload();
			}
		});
	}



	$("#candidateTable tbody").on("click", ".info-btn", function() {
		var rowId = $(this).data("id");

		// Make the AJAX call to get candidate details
		$.ajax({
			url: "/hr/getCandidateInfo",
			type: "GET",
			data: { id: rowId },
			success: function(response) {
				// Update the 'updateModel' content with the received candidate details
				updateUpdateModelContent(response);
				// Show the 'updateModel'
				$("#updateModel").modal("show");
			},
			error: function(xhr, status, error) {
				// Handle the error, e.g., show an error message
				console.log("Error fetching candidate details:", error);
			}
		});
	});

	// Function to update the content of 'updateModel'
	function updateUpdateModelContent(candidateData) {
		// Assuming 'updateModel' has a <div> with class 'modal-body' to display the content
		var modalBody = $("#updateModel .modal-body");
		// Customize how you want to display the candidate details in 'updateModel'

		// Determine the gender value to display
		var genderDisplay = candidateData.gender === true ? "Female" : "Male";

		// Combine submitDate and submitTime to show submitted date and time
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

						var emailPrepFormUrl = "/hr/email-prepare-form/" + templateId + "?type=" + selectedOption + "&candidateId=" + candidateId + "&stage=" + stage;

						$("#sendEmailBtn").on("click", function() {
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
		// Show the warning modal with the error message
		function showWarningModal(errorMessage) {
			$("#warningMessage").text(errorMessage);
			$('#warningModal').modal('show');
		}
	});

});
