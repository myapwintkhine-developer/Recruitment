package com.ace.job.recruitment.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import com.ace.job.recruitment.dto.VacancyDto;
import com.ace.job.recruitment.entity.Department;
import com.ace.job.recruitment.entity.Position;
import com.ace.job.recruitment.entity.Vacancy;
import com.ace.job.recruitment.repository.VacancyRepository;
import com.ace.job.recruitment.service.VacancyService;

@Controller
@RequestMapping("/candidate")
public class MainController {

	@Autowired
	private VacancyService vacancyService;

	@Autowired
	private VacancyRepository vacancyRepository;

	@ModelAttribute("vacancyList")
	public List<Vacancy> getVacancyListByUrgent() {
		List<Vacancy> list = vacancyService.getUrgentVacancy();
		if (list.size() > 6) {
			list = list.subList(0, 6);
		}
		return list;
	}

	@ModelAttribute("vacancies")
	public List<Vacancy> getAllVacancies() {
		return vacancyService.getAllVacancy();
	}

	private List<Vacancy> getVacancyList() {
		return vacancyService.getAllVacancy();
	}

	@ModelAttribute("vacancyCountsByPosition")
	public Map<Position, Long> vacancyCountsByPosition() {
		Map<Position, Long> vacancyCountsByPosition = getVacancyList().stream()
				.collect(Collectors.groupingBy(Vacancy::getPosition, Collectors.counting()));
		return vacancyCountsByPosition;
	}

	@ModelAttribute("uniqueVacancyTypes")
	public Map<String, Long> uniqueVacancyTypes() {
		Map<String, Long> uniqueVacancyTypes = getVacancyList().stream()
				.collect(Collectors.groupingBy(Vacancy::getType, Collectors.counting()));
		return uniqueVacancyTypes;
	}

	@ModelAttribute("vacancyCountsByDepartment")
	public Map<Department, Long> vacancyCountsByDepartment() {
		Map<Department, Long> vacancyCountsByDepartment = getVacancyList().stream()
				.collect(Collectors.groupingBy(Vacancy::getDepartment, Collectors.counting()));
		return vacancyCountsByDepartment;
	}

	@GetMapping("/filter-by-position/{position}")
	public String filterByPosition(@PathVariable("position") String position,
			@RequestParam(name = "page", defaultValue = "0") int page,
			@RequestParam(name = "size", defaultValue = "10") int size,
			@RequestParam(value = "urgent", required = false) Boolean urgentFilter, Model model) {
		Pageable pageable = PageRequest.of(page, size);
		Page<Vacancy> vacancyPage;
		if (urgentFilter != null && urgentFilter) {
			vacancyPage = vacancyRepository.findByPositionNameAndUrgent(position, true, pageable);
			model.addAttribute("urgentFilter", true);
		} else {
			vacancyPage = vacancyRepository.findByPositionName(position, pageable);
		}
		model.addAttribute("vacancyPage", vacancyPage);
		return "vacancy_list";
	}

	@GetMapping("/filter-by-type/{type}")
	public String filterByType(@PathVariable("type") String type,
			@RequestParam(name = "page", defaultValue = "0") int page,
			@RequestParam(name = "size", defaultValue = "10") int size,
			@RequestParam(value = "urgent", required = false) Boolean urgentFilter, Model model) {
		Pageable pageable = PageRequest.of(page, size);
		Page<Vacancy> vacancyPage;
		if (urgentFilter != null && urgentFilter) {
			vacancyPage = vacancyRepository.findByTypeAndUrgent(type, true, pageable);
			model.addAttribute("urgentFilter", true);
		} else {
			vacancyPage = vacancyRepository.findByType(type, pageable);
		}
		model.addAttribute("vacancyPage", vacancyPage);
		return "vacancy_list";
	}

	@GetMapping("/filter-by-department/{department}")
	public String filterByDepartment(@PathVariable("department") String department,
			@RequestParam(name = "page", defaultValue = "0") int page,
			@RequestParam(name = "size", defaultValue = "10") int size,
			@RequestParam(value = "urgent", required = false) Boolean urgentFilter, Model model) {
		Pageable pageable = PageRequest.of(page, size);
		Page<Vacancy> vacancyPage;
		if (urgentFilter != null && urgentFilter) {
			vacancyPage = vacancyRepository.findByDepartmentNameAndUrgent(department, true, pageable);
			model.addAttribute("urgentFilter", true);
		} else {
			vacancyPage = vacancyRepository.findByDepartmentName(department, pageable);
		}
		model.addAttribute("vacancyPage", vacancyPage);
		return "vacancy_list";
	}

	@GetMapping("/jobs")
	public String jobs(@RequestParam(name = "page", defaultValue = "0") int page,
			@RequestParam(name = "size", defaultValue = "10") int size,
			@RequestParam(value = "urgent", required = false) Boolean urgentFilter, Model model) {
		model.addAttribute("currentDate", LocalDate.now());
		Pageable pageable = PageRequest.of(page, size);
		Page<Vacancy> vacancyPage;
		if (urgentFilter != null && urgentFilter) {
			vacancyPage = vacancyRepository.findByUrgentTrue(pageable);
			model.addAttribute("urgentFilter", true);
		} else {
			vacancyPage = vacancyRepository.findAll(pageable);
		}
		model.addAttribute("vacancyPage", vacancyPage);
		return "vacancy_list";
	}

	@GetMapping("/")
	public String showHomePage() {
		return "candidate/home";
	}

	@GetMapping("/about")
	public String about() {
		return "candidate/about";
	}

	@GetMapping("/vacancy-info/{id}")
	public ModelAndView showVacancyInfo(@PathVariable("id") long id, Model model) {
		VacancyDto vacancy = vacancyService.getVacancyById(id);
		vacancy.setStartWorkingHour(vacancyService.convertToFormattedTime(vacancy.getStartWorkingHour()));
		vacancy.setEndWorkingHour(vacancyService.convertToFormattedTime(vacancy.getEndWorkingHour()));
		String[] responsibilities = vacancy.getResponsibility().split("\\u2022");
		String[] requirements = vacancy.getResponsibility().split("\\u2022");
		String[] preferences = vacancy.getPreference().split("\\u2022");
		model.addAttribute("responsibilities", vacancyService.trimArray(responsibilities));
		model.addAttribute("requirements", vacancyService.trimArray(requirements));
		model.addAttribute("preferences", vacancyService.trimArray(preferences));
		model.addAttribute("vacancyId", id);
		return new ModelAndView("vacancy_info", "vacancyInfo", vacancy);
	}

}