package com.example.demo.controller;

import com.example.demo.dto.RoomDto;
import com.example.demo.dto.RoomFilterDto;
import com.example.demo.model.Reservation;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    
    private final RoomService roomService;
    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    
    @Autowired
    public RoomController(RoomService roomService, 
                         ReservationRepository reservationRepository,
                         RoomRepository roomRepository) {
        this.roomService = roomService;
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
    }
    
    @GetMapping
    public ResponseEntity<List<RoomDto>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<RoomDto> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }
    
    @PostMapping("/filter")
    public ResponseEntity<List<RoomDto>> filterRooms(@RequestBody RoomFilterDto filterDto) {
        return ResponseEntity.ok(roomService.filterRooms(filterDto));
    }
    
    @GetMapping("/locations")
    public ResponseEntity<List<String>> getAllLocations() {
        return ResponseEntity.ok(roomService.getAllLocations());
    }
    
    @GetMapping("/facilities")
    public ResponseEntity<Set<String>> getAllFacilities() {
        return ResponseEntity.ok(roomService.getAllFacilities());
    }
    
    @GetMapping("/{id}/availability")
    public ResponseEntity<Map<String, String>> getRoomAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        try {
            // 使用正确的对象检查房间是否存在
            if (!roomRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            // 获取该会议室在该日期的所有预订
            List<Reservation> reservations = reservationRepository.findByRoomIdAndDateAndCancelledFalse(id, date);
            
            // 创建时间段可用性映射
            Map<String, String> availability = new HashMap<>();
            
            // 获取当前时间
            LocalTime now = LocalTime.now();
            LocalDate today = LocalDate.now();
            
            // 对于8:00到22:00的每个小时
            for (int hour = 8; hour < 22; hour++) {
                LocalTime timeSlot = LocalTime.of(hour, 0);
                String timeKey = timeSlot.format(DateTimeFormatter.ofPattern("HH:mm"));
                
                // 如果是今天且时间已经过去，则标记为不可用
                if (date.equals(today) && timeSlot.isBefore(now)) {
                    availability.put(timeKey, "unavailable");
                    continue;
                }
                
                // 检查该时间段是否有预订
                final LocalTime currentTimeSlot = timeSlot; // 为lambda表达式创建final变量
                boolean isBooked = reservations.stream().anyMatch(reservation -> 
                    (currentTimeSlot.equals(reservation.getStartTime()) || currentTimeSlot.isAfter(reservation.getStartTime()))
                    && currentTimeSlot.isBefore(reservation.getEndTime())
                );
                
                if (isBooked) {
                    availability.put(timeKey, "unavailable");
                } else {
                    availability.put(timeKey, "available");
                }
            }
            
            return ResponseEntity.ok(availability);
        } catch (Exception e) {
            // 记录异常并返回500错误
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch availability: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
} 