package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;

public class VerificationDto {
    
    @NotBlank(message = "Email is required")
    private String email;
    
    @NotBlank(message = "Verification code is required")
    private String code;

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
} 