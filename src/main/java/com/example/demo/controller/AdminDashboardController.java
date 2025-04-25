package com.example.demo.controller;

import com.example.demo.dto.ActivityDto;
import com.example.demo.model.AdminActionLog;
import com.example.demo.repository.AdminActionLogRepository;
import com.example.demo.repository.AdminRepository;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final AdminActionLogRepository actionLogRepository;

    @Autowired
    public AdminDashboardController(
            RoomRepository roomRepository,
            ReservationRepository reservationRepository,
            UserRepository userRepository,
            AdminRepository adminRepository,
            AdminActionLogRepository actionLogRepository) {
        this.roomRepository = roomRepository;
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
        this.actionLogRepository = actionLogRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // 计算会议室数量
        long roomCount = roomRepository.count();
        stats.put("roomCount", roomCount);
        
        // 计算活跃预订数量
        long activeReservations = reservationRepository.countByDateAfterAndCancelledFalse(LocalDate.now());
        stats.put("activeReservations", activeReservations);
        
        // 计算用户数量
        long userCount = userRepository.count();
        stats.put("userCount", userCount);
        
        // 计算今天的预订数量
        long todayReservations = reservationRepository.countByDateAndCancelledFalse(LocalDate.now());
        stats.put("todayReservations", todayReservations);
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/activity")
    public ResponseEntity<List<ActivityDto>> getRecentActivity() {
        // 获取最近的活动记录
        List<AdminActionLog> recentLogs = actionLogRepository.findTop10ByOrderByActionTimeDesc();
        
        // 转换为DTO
        List<ActivityDto> activities = recentLogs.stream()
                .map(log -> {
                    ActivityDto dto = new ActivityDto();
                    dto.setId(log.getId());
                    dto.setTime(log.getActionTime());
                    dto.setType(log.getActionType());
                    dto.setTarget(log.getTargetType());
                    dto.setDescription(log.getDetails());
                    dto.setAdmin(log.getAdmin() != null ? log.getAdmin().getUsername() : "System");
                    return dto;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(activities);
    }
} 