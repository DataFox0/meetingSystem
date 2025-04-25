package com.example.demo.dto;

import lombok.Data;

import java.util.Set;

@Data
public class RoomDto {
    private Long id;
    private String name;
    private String location;
    private Integer capacity;
    private String imageUrl;
    private Set<String> facilities;
    private String description;
} 