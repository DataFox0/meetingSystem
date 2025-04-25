package com.example.demo.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String to, String token) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject("Email Verification");
        
        String content = "<p>Please click on the link below to verify your email:</p>"
                + "<a href='http://localhost:8080/verify-email.html?token=" + token + "'>Verify email</a>";
        //localhost:8080; 121.40.73.249:8080
        helper.setText(content, true);
        
        mailSender.send(message);
    }
    
    public void sendPasswordResetEmail(String to, String token) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject("Password Reset Request");
        
        String content = "<p>Please click the link below to reset your password:</p>"
                + "<a href='http://localhost:8080/reset-password.html?token=" + token + "'>Reset Password</a>";
        //localhost:8080; 121.40.73.249:8080
        helper.setText(content, true);
        
        mailSender.send(message);
    }
} 