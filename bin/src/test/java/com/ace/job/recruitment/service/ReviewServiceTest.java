package com.ace.job.recruitment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.annotation.Transactional;

import com.ace.job.recruitment.entity.Reviews;
import com.ace.job.recruitment.repository.ReviewRepository;
import com.ace.job.recruitment.service.ReviewService;

@SpringBootTest
@Transactional
@DirtiesContext
public class ReviewServiceTest {
	
	@Autowired
	private ReviewService reviewService;
	
	@Autowired
	private ReviewRepository reviewRepo; 
	
	@Test
	public void testSaveReview() {
		
		Reviews review = new Reviews();
		review.setReview("review");
		
		Reviews saveReview = reviewService.saveReview(review);
		
        Reviews fetchedReview = reviewRepo.findById(saveReview.getId()).orElse(null);
        
        assertEquals(saveReview.getId(), fetchedReview.getId());
		
	}
	

}
