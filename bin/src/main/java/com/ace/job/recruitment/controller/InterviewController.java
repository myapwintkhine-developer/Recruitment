package com.ace.job.recruitment.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.datatables.mapping.DataTablesInput;
import org.springframework.data.jpa.datatables.mapping.DataTablesOutput;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ace.job.recruitment.dto.InterviewDTO;
import com.ace.job.recruitment.dto.VacancyDto;
import com.ace.job.recruitment.dto.VacancyForInterviewDTO;
import com.ace.job.recruitment.entity.Department;
import com.ace.job.recruitment.entity.Interview;
import com.ace.job.recruitment.entity.Position;
import com.ace.job.recruitment.entity.User;
import com.ace.job.recruitment.entity.Vacancy;
import com.ace.job.recruitment.service.DepartmentService;
import com.ace.job.recruitment.service.InterviewService;
import com.ace.job.recruitment.service.PositionService;
import com.ace.job.recruitment.service.UserService;
import com.ace.job.recruitment.service.VacancyService;

@Controller
@RequestMapping("/hr")
public class InterviewController {
	@Autowired
	InterviewService interviewService;
	@Autowired
	VacancyService vacancyService;
	@Autowired
	UserService userService;
	@Autowired
	PositionService positionService;
	@Autowired
	DepartmentService departmentService;

	@GetMapping("/email")
	public String email() {
		return "emailtemplate/job-offer-mail";
	}

	// get userids from the department of the chosen vacancy
	@GetMapping("/choose-interviwers")
	public ResponseEntity<List<User>> chooseInterviewer(@RequestParam("vacancyId") long vacancy_id) {
		// get vacancy info with the chosen vacancy id
		VacancyDto chosenVacancy = vacancyService.getVacancyById(vacancy_id);
		Department department = chosenVacancy.getDepartment();
		List<User> userList = new ArrayList<User>();
		userList = department.getUsers();
		if (!userList.isEmpty()) {
			return ResponseEntity.ok(userList);
		} else {
			return ResponseEntity.notFound().build();
		}

	}

	@PostMapping("/vacancies-for-interview")
	public ResponseEntity<List<VacancyForInterviewDTO>> chooseVacancy() {
		List<VacancyForInterviewDTO> vacancyList = new ArrayList<VacancyForInterviewDTO>();
		vacancyList = vacancyService.getVacanciesForInterview();

		return ResponseEntity.ok(vacancyList);
	}

	@PostMapping("/add-interview")
	public ResponseEntity<String> addInterviewPost(@ModelAttribute("interviewDTO") InterviewDTO interviewDTO,

			@RequestParam("vacancyId") long vacancyId, @RequestParam("interviewerId") Integer[] interviewerId,
			Authentication authentication) {
		DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		LocalDate startDate = LocalDate.parse(interviewDTO.getStartDate(), dateFormatter);
		LocalDate endDate = LocalDate.parse(interviewDTO.getEndDate(), dateFormatter);

		Interview interview = new Interview(startDate, endDate, interviewDTO.getStartTime(), interviewDTO.getEndTime(),
				interviewDTO.getType(), interviewDTO.getLocation(), interviewDTO.getStage());
		// status
		interview.setStatus(true);

		// format datetime
		LocalDateTime currentDateTime = LocalDateTime.now();
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
		String formattedDateTime = currentDateTime.format(formatter);
		interview.setCreatedDateTime(formattedDateTime);

		// created user id
		interview.setCreatedUserId(interviewService.getCurrentUserId(authentication));

		// for vacancy
		Vacancy vacancy = vacancyService.getVacancyByIdForInterview(vacancyId);
		interview.setVacancy(vacancy);

		// for interviewers
		List<User> userList = new ArrayList<>();
		for (int userId : interviewerId) {
			User user = userService.getUserById(userId);
			userList.add(user);
		}

		interview.setUsers(userList);

		// store in db
		interviewService.addInterview(interview);

		return ResponseEntity.ok().build();
	}

	// show list of interview
	@GetMapping("/interview-list")
	public String showInterviewList(Model model) {
		List<Interview> interviewList = new ArrayList<Interview>();
		interviewList = interviewService.getAllInterviews();
		model.addAttribute("interviewList", interviewList);
		return "interview/interview-list";
	}

	@GetMapping("/interviews-data")
	@ResponseBody
	public DataTablesOutput<Interview> getDataTableData(@Valid DataTablesInput input,
			@RequestParam("startDateFrom") Optional<String> startDateFrom,
			@RequestParam("endDateTo") Optional<String> endDateTo) {
		if (startDateFrom.isPresent() || endDateTo.isPresent()) {
			DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
			LocalDate startDate = startDateFrom.map(s -> LocalDate.parse(s, dateFormatter)).orElse(null);
			LocalDate endDate = endDateTo.map(s -> LocalDate.parse(s, dateFormatter)).orElse(null);
			return interviewService.getDataTableDataDate(input, startDate, endDate);
		} else {
			return interviewService.getDataTableData(input);
		}
	}

	// show interview details
	@GetMapping("/interview-detail")
	public ResponseEntity<Object> getInterviewDetail(@RequestParam("id") Long id) {
		Interview interview = interviewService.getInterviewById(id);
		if (interview != null) {
			InterviewDTO interviewDetail = new InterviewDTO(interview.getId(), (interview.getStartDate().toString()),
					(interview.getEndDate().toString()), interview.getStartTime(), interview.getEndTime(),
					interview.getType(), interview.getLocation(), interview.getStage(), interview.isStatus(),
					interview.getCreatedUserId(), interview.getCreatedDateTime(), interview.getUpdatedUserId(),
					interview.getUpdatedDateTime(), interview.getCanceledUserId(), interview.getCanceledDateTime(),
					interview.getVacancy(), interview.getUsers());

			interviewDetail.setCreatedUserName((userService.getUserById(interview.getCreatedUserId())).getName());
			if (interview.getUpdatedUserId() != 0) {
				interviewDetail.setUpdatedUserName((userService.getUserById(interview.getUpdatedUserId())).getName());
			}
			if (interview.getCanceledUserId() != 0) {
				interviewDetail.setCanceledUsername((userService.getUserById(interview.getCanceledUserId())).getName());
			}
			return ResponseEntity.ok(interviewDetail);
		} else {
			return ResponseEntity.notFound().build();
		}
	}

	// update interview
	@PostMapping("/update-interview")
	public ResponseEntity<String> updateInterview(@ModelAttribute("interviewDTO") InterviewDTO interviewDTO,
			@RequestParam("vacancyId") long vacancyId, @RequestParam("interviewerId") Integer[] interviewerId) {
		Interview interview = interviewService.getInterviewById(interviewDTO.getId());

		DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		LocalDate startDate = LocalDate.parse(interviewDTO.getStartDate(), dateFormatter);
		LocalDate endDate = LocalDate.parse(interviewDTO.getEndDate(), dateFormatter);
		interview.setStartDate(startDate);
		interview.setEndDate(endDate);
		interview.setStartTime(interviewDTO.getStartTime());
		interview.setEndTime(interviewDTO.getEndTime());
		interview.setStage(interviewDTO.getStage());
		interview.setType(interviewDTO.getType());
		interview.setLocation(interviewDTO.getLocation());

		// for vacancy
		Vacancy vacany = vacancyService.getVacancyByIdForInterview(vacancyId);
		interview.setVacancy(vacany);

		// for interviewers
		List<User> userList = new ArrayList<User>();
		for (int userId : interviewerId) {
			User user = userService.getUserById(userId);
			userList.add(user);
		}
		interview.setUsers(userList);

		// format datetime for update datetime
		LocalDateTime currentDateTime = LocalDateTime.now();
		DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
		String formattedDateTime = currentDateTime.format(dateTimeFormatter);
		interview.setUpdatedDateTime(formattedDateTime);

		// updated user id
		interview.setUpdatedUserId(0);

		// update in db
		interviewService.updateInterview(interview);

		return ResponseEntity.ok().build();

	}

	// cancel interview
	@GetMapping("/cancel-interview")
	public ResponseEntity<String> cancelInterview(@RequestParam("id") Long id, Authentication authentication) {
		Interview interview = interviewService.getInterviewById(id);
		interview.setStatus(false);

		// format datetime for cancel datetime
		LocalDateTime currentDateTime = LocalDateTime.now();
		DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
		String formattedDateTime = currentDateTime.format(dateTimeFormatter);
		interview.setCanceledDateTime(formattedDateTime);

		// updated user id
		interview.setCanceledUserId(interviewService.getCurrentUserId(authentication));
		interviewService.updateInterview(interview);
		return ResponseEntity.ok().build();

	}

	@GetMapping("/position-for-sort")
	@ResponseBody
	public List<Position> getAllPositions() {
		List<Position> list = positionService.getAllPositions();
		return list;
	}

	@GetMapping("/department-for-sort")
	@ResponseBody
	public List<Department> getAllDepartment() {
		List<Department> list = departmentService.getDepartments();
		return list;
	}
}