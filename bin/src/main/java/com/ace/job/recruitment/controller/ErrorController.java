package com.ace.job.recruitment.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ErrorController {
	@GetMapping("/404")
	public String notFoundPage() {
		return "404";
	}
}
