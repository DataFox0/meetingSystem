package com.example.demo.dto;

import com.example.demo.model.ReservationStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ReservationDto {
    private Long id;
    private Long roomId;
    private String roomName;
    private String roomLocation;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String purpose;
    private Integer attendeesCount;
    private ReservationStatus status;
    private Boolean cancelled;
    
    // 添加用户学号字段
    private String userStudentId;
} 