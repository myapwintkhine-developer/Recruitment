package com.ace.job.recruitment.service;

import java.time.LocalDate;
import java.util.List;

import javax.validation.Valid;

import org.springframework.data.jpa.datatables.mapping.DataTablesInput;
import org.springframework.data.jpa.datatables.mapping.DataTablesOutput;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.ace.job.recruitment.entity.Interview;

@Service
public interface InterviewService {

	public int getCurrentUserId(Authentication authentication);

	Interview addInterview(Interview interview);

	Interview updateInterview(Interview interview);

	List<Interview> getAllInterviews();

	Interview getInterviewById(Long id);

	DataTablesOutput<Interview> getDataTableData(@Valid DataTablesInput input);

	DataTablesOutput<Interview> getDataTableDataDate(DataTablesInput input, LocalDate startDate, LocalDate endDate);

	List<Interview> getInterviewByTypeStageVacancyIdStatus(String type, int stage, long vacancyId, boolean status);

	List<Interview> getInterviewByTypeAndStageAndStatus(String type, int stage, boolean status);

	public List<Interview> checkInterviewForExpired();

}