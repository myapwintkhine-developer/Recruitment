package com.ace.job.recruitment.config;

import java.io.IOException;
import java.util.Collection;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.ace.job.recruitment.entity.User;
import com.ace.job.recruitment.service.UserService;

@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

	@Autowired
	private UserService userService;

	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
			Authentication authentication) throws IOException {
		Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

		boolean isUserBanned = userIsBanned(request);

		if (isUserBanned) {
			response.sendRedirect("/signin?deny");
			return;
		}

		authorities.forEach(authority -> {
			if (authority.getAuthority().equals("Admin") || authority.getAuthority().equals("Default-Admin")
					|| authority.getAuthority().equals("Senior-Hr") || authority.getAuthority().equals("Junior-Hr")) {
				try {
					response.sendRedirect("/hr/dashboard");
				} catch (IOException e) {
					e.printStackTrace();
				}
			} else if (authority.getAuthority().equals("Interviewer")
					|| authority.getAuthority().equals("Department-head")) {
				try {
					response.sendRedirect("/interviewer/candidates");
				} catch (IOException e) {
					e.printStackTrace();
				}
			} else {
				throw new IllegalStateException();
			}
		});
	}

	private boolean userIsBanned(HttpServletRequest request) {
		String username = request.getParameter("username");
		List<User> user = userService.getUserByEmail(username);
		if (user.get(0).isStatus()) {
			return true;
		}
		return false;
	}

}
