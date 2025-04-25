package com.example.demo.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ActivityDto {
    private Long id;
    private LocalDateTime time;
    private String type;
    private String target;
    private String description;
    private String admin;
} 