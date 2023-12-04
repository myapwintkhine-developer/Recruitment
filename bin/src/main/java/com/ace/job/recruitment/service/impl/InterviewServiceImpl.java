package com.ace.job.recruitment.service.impl;

import java.time.LocalDate;
import java.util.List;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.datatables.mapping.DataTablesInput;
import org.springframework.data.jpa.datatables.mapping.DataTablesOutput;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.ace.job.recruitment.entity.Interview;
import com.ace.job.recruitment.model.AppUserDetails;
import com.ace.job.recruitment.repository.InterviewRepository;
import com.ace.job.recruitment.service.InterviewService;

@Service
public class InterviewServiceImpl implements InterviewService {
	@Autowired
	InterviewRepository interviewRepository;

	@Override
	public int getCurrentUserId(Authentication authentication) {
		AppUserDetails appUserDetails = (AppUserDetails) authentication.getPrincipal();
		return appUserDetails.getId();
	}

	@Override
	public Interview addInterview(Interview interview) {
		return interviewRepository.save(interview);
	}

	@Override
	public Interview updateInterview(Interview interview) {
		return interviewRepository.save(interview);
	}

	@Override
	public List<Interview> getAllInterviews() {
		return interviewRepository.findAll();
	}

	@Override
	public Interview getInterviewById(Long id) {
		return interviewRepository.findById(id).get();
	}

	@Override
	public DataTablesOutput<Interview> getDataTableData(@Valid DataTablesInput input) {
		return interviewRepository.findAll(input);
	}

	@Override
	public List<Interview> getInterviewByTypeStageVacancyIdStatus(String type, int stage, long vacancyId,
			boolean status) {
		return interviewRepository.findAllByTypeAndStageAndVacancyIdAndStatus(type, stage, vacancyId, status);
	}

	@Override
	public List<Interview> getInterviewByTypeAndStageAndStatus(String type, int stage, boolean status) {
		return interviewRepository.findByTypeAndStageAndStatus(type, stage, status);
	}

	@Override
	public DataTablesOutput<Interview> getDataTableDataDate(DataTablesInput input, LocalDate startDate,
			LocalDate endDate) {
		Specification<Interview> dateRangeSpecification = (root, query, criteriaBuilder) -> criteriaBuilder.and(
				criteriaBuilder.greaterThanOrEqualTo(root.get("startDate"), startDate),
				criteriaBuilder.lessThan(root.get("startDate"), endDate.plusDays(1)),
				criteriaBuilder.lessThanOrEqualTo(root.get("endDate"), endDate));

		return interviewRepository.findAll(input, dateRangeSpecification);
	}

	@Override
	public List<Interview> checkInterviewForExpired() {
		return interviewRepository.getInterviewForExpired();
	}

}