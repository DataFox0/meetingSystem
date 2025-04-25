package com.example.demo.dto;

import lombok.Data;

import java.util.Set;

@Data
public class RoomFilterDto {
    private String location;
    private Integer minCapacity;
    private Set<String> facilities;
} 