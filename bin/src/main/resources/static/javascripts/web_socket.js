var socket = new SockJS('/websocket');
var stompClient = Stomp.over(socket);

stompClient.connect({}, function(frame) {
	stompClient.subscribe('/topic/notification', function(message) {
		// Fetch notification count
		fetchNotificationCount();
	});
});

// Function to fetch and display the notification list
function fetchNotifications() {
	$.ajax({
		url: '/hr/notifications',
		type: 'GET',
		success: function(notifications) {
			console.log("hit");
			var notificationList = $('#notificationList');
			notificationList.empty(); // Clear existing notifications
			// Create and add new notifications to the list
			notifications.forEach(function(notification) {
				var listItem;
				const notiMessage = notification.message;
				const type1 = "Vacancy-Reopened:";
				const type2 = "Candidate-Status:";
				if(notification === null){
					listItem = $('<a>').text('No new notifications right now.')
					.attr('href', '#')
					.addClass('dropdown-item text-wrap');
					notificationList.prepend(listItem);
				}
				if (notiMessage.includes(type1)) {
					listItem = $('<a>').text(notification.message)
					.attr('href', '/hr/vacancy-list/')
					.addClass('dropdown-item text-wrap');
					notificationList.prepend(listItem);
				} else if (notification.vacancy==null){ 
					listItem = $('<a>').text(notification.message)
					.attr('href', '/hr/candidates/')
					.addClass('dropdown-item text-wrap');
					notificationList.prepend(listItem);
				} else {
				listItem = $('<a>').text(notification.message)
					.attr('href', '/hr/vacancy-info/' + notification.vacancy.id + '/' + notification.id)
					.addClass('dropdown-item text-wrap');
				notificationList.prepend(listItem);}
			});

			// Update the notification count
			updateNotificationCount(notifications.length);
		},
		error: function(xhr, status, error) {
			console.error('Error fetching notifications:', error);
		}
	});
}

// Function to fetch and update the notification count
function fetchNotificationCount() {
	$.ajax({
		url: '/hr/notifications/count',
		type: 'GET',
		success: function(count) {
			updateNotificationCount(count);
		},
		error: function(xhr, status, error) {
			console.error('Error fetching notification count:', error);
		}
	});
}

// Update the notification count on page load
$(document).ready(function() {
	fetchNotificationCount();
});

// Click event handler for the bell icon
$('#notificationDropdown').on('click', function() {
	fetchNotifications();
});

// Function to update the notification count
function updateNotificationCount(count) {
	var countElement = $('#count');
	countElement.text(count);
}

//Read all
function markNotificationsAsRead() {
        $.ajax({
            type: "GET",
            url: "/hr/mark-as-read",
            success: function(response) {
                console.log("succeed");
                fetchNotificationCount();
            },
            error: function(error) {
                // Handle error
                console.error(error);
            }
        });
    }