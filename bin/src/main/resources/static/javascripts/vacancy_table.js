$(document).ready(function() {
	var baseAjaxUrl = '/hr/table-data';

	var table = $('#vacancyTable').DataTable({
		scrollX: true,
		processing: true,
		serverSide: true,
		ajax: {
			url: baseAjaxUrl,
			type: 'GET',
		},
		columns: [
			{ data: 'position.name', name: 'Position' },
			{ data: 'count', name: 'Required Vacancies' },
			{
				data: 'createdDate', name: 'Start Date', render: function(data) {
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
			{
				data: 'dueDate', name: 'End Date', render: function(data) {
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
			{
				data: 'id',
				render: function(data, type, row) {
					const daysLeft = calculateDaysLeft(new Date(row.dueDate));
					return `<div><b>${daysLeft}</b> days left</div>`;
				}, sortable: false
			},
			{ data: 'department.name', name: 'Department' },
			{
				data: 'active',
				data: 'reopened',
				data: 'urgent',
				render: function(data, type, row) {
					console.log(row.urgent + 'urgent')
					var statusButton = row.urgent ? `<button type="button" class="btn btn-warning text-white" >Urgent</button>` : row.active ? `<button type="button" class="btn btn-success" >Active</button>` : row.reopened ? `<button type="button" class="btn btn-secondary" >Reopened</button>` : `<button type="button" class="btn btn-danger text-center">Expired</button>`;
					if (!row.active && !row.reopened) {
						var statusActionButton = `<button type="button" class="btn btn-sm btn-secondary text-center" data-toggle="modal" data-target="#reopenModal"><i class="ti ti-reload"></i></button>`;
						return `
						<div class="btn-group text-center">
							${statusButton}
           					${statusActionButton}
           				</div>
						<div class="modal fade" id="reopenModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
							<div class="modal-dialog" role="document">
   								<div class="modal-content">
      								<div class="modal-header">
        								<h5 class="modal-title" id="exampleModalLabel">Reopen Vacancy</h5>
        								<button type="button" class="close" data-dismiss="modal" aria-label="Close">
          								<span aria-hidden="true">&times;</span>
        								</button>
   									</div>
      								<div class="modal-body">
										Reopen ${row.position.name}?	
      								</div>
      								<div class="modal-footer">
        								<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        								<button type="button" class="btn btn-primary reopen-btn" data-id="${row.id}">Confirm</button>
      								</div>
    							</div>
  							</div>`;
					};
					return `
					<div class="text-center">${statusButton}</div>`;
				},
				sortable: false
			},
			{
				data: 'id',
				render: function(data, type, row) {
					var infoButton = `<button type="button" class="btn btn-info info-btn" data-id="${row.id}"><i class="ti ti-info"></i></button>`;
					var editButton = `<button type="button" class="btn btn-primary edit-btn" data-id="${row.id}"><i class="ti ti-pencil"></i></button>`;
					var deleteButton = `<button type="button" class="btn btn-danger delete-btn" data-id="${row.id}"><i class="ti ti-trash"></i></button>`;
					return `
                        <div class="btn-group">
                            ${infoButton}
                            ${editButton}
                            ${deleteButton}
                        </div>
                    `;
				},
				sortable: false
			},
			{
				data: 'id',
				render: function(data, type, row) {
					var excelCandidateSummary = `<button class="btn btn-success excel" data-id="${data}">
            <i class="fa-regular fa-file-excel"></i>
        </button>`;

					var pdfCandidateSummary = `<button class="btn btn-danger pdf" data-id="${data}">
            <i class="fa-regular fa-file-pdf"></i>
        </button>`;




					return `
    <div class="btn-group">
        ${excelCandidateSummary}
        ${pdfCandidateSummary}

    </div>
`;

				},
				sortable: false
			},


		],
		order: [[0, 'asc']],
		paging: true,
		language: {
			"infoFiltered": ""
		},
		lengthMenu: [5, 10, 20],
		pageLength: 5,
	});
	$(document).on('click', '.excel,.pdf', function() {
		var id = $(this).data('id');
		var type = '';

		if ($(this).hasClass('excel')) {
			type = 'excel';
		} else if ($(this).hasClass('pdf')) {
			type = 'pdf';
		}
		url = "/hr/download-candidate-summary-vacancy/" + type
			+ "?vacancyId=" + id;

		$.ajax({
			url: url,
			method: "GET",
			success: function() {
				$('#messageContainer').html('<div class="alert alert-success alert-dismissible fade show" role="alert">' +
					'Download Successful! <button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
					'<span aria-hidden="true">&times;</span></button></div>');

				setTimeout(function() {
					$('#messageContainer').empty();
				}, 2000);
			},
			error: function(jqxhr) {
				$('#messageContainer').html('<div class="alert alert-danger alert-dismissible fade show" role="alert">' +
					'No data available for the selected criteria. <button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
					'<span aria-hidden="true">&times;</span></button></div>');

				setTimeout(function() {
					$('#messageContainer').empty();
				}, 2000);
			}
		});

		var iframe = $('<iframe/>', {
			style: 'display:none',
			src: url
		});
		$('body').append(iframe);
	});


	$('#excelReportButton,#pdfReportButton').click(function() {
		var startDateFrom = $('#startDateFrom').val();
		var endDateTo = $('#endDateTo').val();
		var url = '';
		var type = '';
		var status = $('#statusFilter').val();
		var selectedOptionPosition = $('#positionSort option:selected');
		var hiddenPositionId = selectedOptionPosition.data('position-id');
		var selectedOptionDepartment = $('#departmentSort option:selected');
		var hiddenDepartmentId = selectedOptionDepartment.data('department-id');

		console.log("Status Filter value----" + status);

		if ($(this).attr('id') === 'excelReportButton') {
			type = 'excel';
		} else if ($(this).attr('id') === 'pdfReportButton') {
			type = 'pdf';
		}
		if (!startDateFrom) {
			startDateFrom = null;
		}
		if (!endDateTo) {
			endDateTo = null;
		}
		url = "/hr/download-interview-summary/" + type
			+ "?startDateFrom=" + startDateFrom
			+ "&endDateTo=" + endDateTo
			+ "&status=" + status + "&positionId=" + hiddenPositionId + "&departmentId=" + hiddenDepartmentId;

		$.ajax({
			url: url,
			method: "GET",
			success: function() {
				$('#messageContainer').html('<div class="alert alert-success alert-dismissible fade show" role="alert">' +
					'Download Successful! <button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
					'<span aria-hidden="true">&times;</span></button></div>');

				setTimeout(function() {
					$('#messageContainer').empty();
				}, 2000);
			},
			error: function(jqxhr) {
				$('#messageContainer').html('<div class="alert alert-danger alert-dismissible fade show" role="alert">' +
					'No data available for the selected criteria. <button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
					'<span aria-hidden="true">&times;</span></button></div>');

				setTimeout(function() {
					$('#messageContainer').empty();
				}, 2000);
			}
		});

		var iframe = $('<iframe/>', {
			style: 'display:none',
			src: url
		});
		$('body').append(iframe);

	});




	$('#startDateFrom, #endDateTo,#statusFilter').on('change', function() {
		var startDateFrom = $('#startDateFrom').val();
		var endDateTo = $('#endDateTo').val();
		var selectedStatus = $('#statusFilter').val();

		if (!startDateFrom || !endDateTo) {

			if (selectedStatus !== "All") {
				console.log("status !=All")
				updateDataTableOnlyStatus(selectedStatus);
			}
			else {
				console.log("At least one date is selected, redrawing the table.");
				table.draw();
			}


		} else {
			// Clear the filter if end date becomes higher than start date
			if (new Date(endDateTo) > new Date(startDateFrom)) {
				clearEndDateFilter();
			}



			if (selectedStatus !== "All") {
				updateDataTableWithStatus(startDateFrom, endDateTo, selectedStatus);
			}
			else {

				console.log("Both start and end dates are selected.");
				updateDataTable(startDateFrom, endDateTo);
			}
		}
	});



	function redrawTable() {
		table.draw();
	}

	function clearFilter() {
		console.log("Clearing filter.");
		table.column(2).search("").draw();
		table.column(3).search("").draw();
	}

	function clearEndDateFilter() {
		console.log("Clearing end date filter.");
		table.column(3).search("").draw();
	}

	function updateDataTable(startDate, endDate) {
		// Update the URL with both start and end dates
		table.ajax.url(baseAjaxUrl + '?startDateFrom=' + startDate + '&endDateTo=' + endDate).load();
	}

	function updateDataTableOnlyStatus(status) {
		console.log("updateDataTableOnlyStatus");
		table.ajax.url(baseAjaxUrl + '?status=' + status).load();
	}

	function updateDataTableWithStatus(startDate, endDate, status) {
		console.log("updateDataTableWithStatusAll");
		table.ajax.url(baseAjaxUrl + '?startDateFrom=' + startDate + '&endDateTo=' + endDate + '&status=' + status).load();
	}


	function loadPositionsForSort(targetSelect) {

		$.ajax({
			url: "/hr/position-for-sort",
			type: "GET",
			success: function(response) {
				var positionSelect = $(targetSelect);
				positionSelect.empty();
				positionSelect.append($('<option>')
					.val('all')
					.text('All')
					.data('position-id', 0)
				);
				response.forEach(function(position) {
					var option = $("<option>")
						.val(position.name)
						.text(position.name)
						.data('position-id', position.id);
					positionSelect.append(option);
				});
			},
			error: function(xhr, status, error) {
				console.error(error);
			}
		});
	}

	function loadDepartmentsForSort(targetSelect) {
		$.ajax({
			url: "/hr/department-for-sort",
			type: "GET",
			success: function(response) {
				var departmentSelect = $(targetSelect);

				departmentSelect.empty();

				departmentSelect.append($('<option>')
					.val('all')
					.text('All')
					.data('department-id', 0)
				);
				response.forEach(function(department) {
					var option = $("<option>")
						.val(department.name)
						.text(department.name)
						.data('department-id', department.id);;
					departmentSelect.append(option);
				});
			},
			error: function(xhr, status, error) {
				console.error(error);
			}
		});
	}



	loadPositionsForSort("#positionSort");


	loadDepartmentsForSort("#departmentSort");


	$('#departmentSort, #positionSort').on('change', function() {
		var selectedDepartment = $('#departmentSort').val();
		var selectedPosition = $('#positionSort').val();
		filterData(selectedDepartment, selectedPosition);
	});

	function filterData(department, position) {
		var departmentFilter = department === 'All' ? '' : department;
		var positionFilter = position === 'All' ? '' : position;


		table.column(5).search(departmentFilter);
		table.column(0).search(positionFilter);

		table.draw();
	}


});


function calculateDaysLeft(dueDate) {
	const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

	const currentDate = new Date();
	const timeDifference = Math.abs(dueDate - currentDate); // Get the time difference in milliseconds
	const daysLeft = Math.ceil(timeDifference / millisecondsPerDay); // Calculate the number of days left

	return daysLeft;
}

// Click event listener for the "Info" button
$('#vacancyTable').on('click', '.info-btn', function() {
	var vacancyId = $(this).data('id');
	// Do something with the vacancyId, e.g., redirect to the info page using window.location.href
	window.location.href = '/hr/vacancy-info/' + vacancyId;
	console.log('Info button clicked for vacancy ID:', vacancyId);
});

// Click event listener for the "Edit" button
$('#vacancyTable').on('click', '.edit-btn', function() {
	var vacancyId = $(this).data('id');
	// Do something with the vacancyId, e.g., redirect to the edit page using window.location.href
	window.location.href = '/hr/setup-edit-vacancy/' + vacancyId;
	console.log('Edit button clicked for vacancy ID:', vacancyId);
});

// Click event listener for the "Delete" button
$('#vacancyTable').on('click', '.delete-btn', function() {
	var vacancyId = $(this).data('id');
	// Do something with the vacancyId, e.g., show a confirmation modal and delete the vacancy
	console.log('Delete button clicked for vacancy ID:', vacancyId);
});

// Click event listener for the "Reopen" button
$('#vacancyTable').on('click', '.reopen-btn', function() {
	var reopenPositionId = $(this).data('id');
	window.location.href = '/hr/reopen-vacancy/' + reopenPositionId;
	console.log('Reopen button clicked for ', reopenPositionId);
});

$(document).ready(function() {
	$('.dataTables_length').addClass('bs-select');
});