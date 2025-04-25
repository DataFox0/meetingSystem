package com.example.demo.dto;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String studentId;
    private boolean enabled;
    private boolean emailVerified;
} 