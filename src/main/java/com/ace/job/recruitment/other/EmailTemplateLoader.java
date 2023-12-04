package com.ace.job.recruitment.other;

import java.io.IOException;
import java.util.ArrayList;

import javax.annotation.PostConstruct;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import com.ace.job.recruitment.model.EmailTemplate;
import com.ace.job.recruitment.model.EmailTemplates;

@Component
public class EmailTemplateLoader {
	private EmailTemplates emailTemplates;
	private static final String defaultTemplateId = "1";

	public EmailTemplateLoader(ResourceLoader resourceLoader) {
	}

	@PostConstruct
	public void init() throws IOException, JAXBException {
		try {
			// load xml file
			ClassPathResource resource = new ClassPathResource("static/xmlfiles/emailtemplate.xml");

			// use jaxb
			JAXBContext jaxbContext = JAXBContext.newInstance(EmailTemplates.class);
			Unmarshaller jaxbUnmarshaller = jaxbContext.createUnmarshaller();
			emailTemplates = (EmailTemplates) jaxbUnmarshaller.unmarshal(resource.getInputStream());
		} catch (IOException | JAXBException e) {
			// for exception
			emailTemplates = createDefaultTemplates();
			e.printStackTrace();
		}
	}

	public EmailTemplate getEmailTemplate(String templateId) {
		if (emailTemplates == null || emailTemplates.getTemplates() == null
				|| emailTemplates.getTemplates().isEmpty()) {
			return getDefaultTemplate();
		}

		// find template by id
		EmailTemplate template = emailTemplates.getTemplates().stream()
				.filter(t -> t.getId().trim().equals(templateId.trim())) // trim both templateId and id from xml
				.findFirst().orElse(null);

		// return the template or get default template
		return (template != null) ? template : getDefaultTemplate();
	}

	public EmailTemplate getDefaultTemplate() {
		return createDefaultTemplate();
	}

	private EmailTemplate createDefaultTemplate() {
		EmailTemplate template = new EmailTemplate();
		template.setId(defaultTemplateId);
		template.setSubject("Subject");
		template.setBody("<p>Email Content</p>");
		return template;
	}

	private EmailTemplates createDefaultTemplates() {
		EmailTemplates templates = new EmailTemplates();
		// an empty list for templates to avoid nullpointerexception
		templates.setTemplates(new ArrayList<>());
		templates.getTemplates().add(createDefaultTemplate());
		return templates;
	}
}