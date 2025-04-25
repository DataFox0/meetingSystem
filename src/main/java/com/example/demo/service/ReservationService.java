package com.example.demo.service;

import com.example.demo.dto.ReservationDto;
import com.example.demo.dto.ReservationRequestDto;
import com.example.demo.model.Reservation;
import com.example.demo.model.Room;
import com.example.demo.model.User;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class ReservationService {
    
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    
    @Autowired
    public ReservationService(
            ReservationRepository reservationRepository,
            UserRepository userRepository,
            RoomRepository roomRepository) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
    }
    
    public List<ReservationDto> getUserReservations(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return reservationRepository.findByUserOrderByDateDescStartTimeDesc(user)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ReservationDto createReservation(String username, ReservationRequestDto requestDto) {
        // 获取用户和会议室
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Room room = roomRepository.findById(requestDto.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));
        
        // 验证时间是否为整点
        validateHourlyTimes(requestDto.getStartTime(), requestDto.getEndTime());
        
        // 验证预订时长不超过3小时
        validateDuration(requestDto.getStartTime(), requestDto.getEndTime());
        
        // 验证预订时间没有冲突
        validateNoConflict(requestDto);
        
        // 验证参与人数不超过会议室容量
        if (requestDto.getAttendeesCount() > room.getCapacity()) {
            throw new RuntimeException("Number of attendees exceeds room capacity");
        }
        
        // 创建预订
        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setRoom(room);
        reservation.setDate(requestDto.getDate());
        reservation.setStartTime(requestDto.getStartTime());
        reservation.setEndTime(requestDto.getEndTime());
        reservation.setPurpose(requestDto.getPurpose());
        reservation.setAttendeesCount(requestDto.getAttendeesCount());
        
        return convertToDto(reservationRepository.save(reservation));
    }
    
    @Transactional
    public void cancelReservation(String username, Long reservationId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        
        // 验证预订属于该用户
        if (!reservation.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to cancel this reservation");
        }
        
        // 设置取消标志
        reservation.setCancelled(true);
        reservationRepository.save(reservation);
    }
    
    private void validateHourlyTimes(LocalTime startTime, LocalTime endTime) {
        if (startTime.getMinute() != 0 || startTime.getSecond() != 0 ||
                endTime.getMinute() != 0 || endTime.getSecond() != 0) {
            throw new RuntimeException("Reservation times must be on the hour (e.g., 13:00)");
        }
    }
    
    private void validateDuration(LocalTime startTime, LocalTime endTime) {
        if (startTime.compareTo(endTime) >= 0) {
            throw new RuntimeException("End time must be after start time");
        }
        
        Duration duration = Duration.between(startTime, endTime);
        if (duration.toHours() > 3) {
            throw new RuntimeException("Reservation cannot exceed 3 hours");
        }
    }
    
    private void validateNoConflict(ReservationRequestDto requestDto) {
        List<Reservation> conflictingReservations = reservationRepository.findConflictingReservations(
                requestDto.getRoomId(),
                requestDto.getDate(),
                requestDto.getStartTime(),
                requestDto.getEndTime());
        
        if (!conflictingReservations.isEmpty()) {
            throw new RuntimeException("The selected time slot is already booked");
        }
    }
    
    private ReservationDto convertToDto(Reservation reservation) {
        ReservationDto dto = new ReservationDto();
        dto.setId(reservation.getId());
        dto.setRoomId(reservation.getRoom().getId());
        dto.setRoomName(reservation.getRoom().getName());
        dto.setRoomLocation(reservation.getRoom().getLocation());
        dto.setDate(reservation.getDate());
        dto.setStartTime(reservation.getStartTime());
        dto.setEndTime(reservation.getEndTime());
        dto.setPurpose(reservation.getPurpose());
        dto.setAttendeesCount(reservation.getAttendeesCount());
        dto.setStatus(reservation.getStatus());
        dto.setCancelled(reservation.getCancelled());
        return dto;
    }
    
    public Map<String, String> checkRoomAvailability(Long roomId, LocalDate date) {
        // 创建时间段可用性映射
        Map<String, String> availability = new HashMap<>();
        
        // 获取当前时间
        LocalTime now = LocalTime.now();
        LocalDate today = LocalDate.now();
        
        // 获取该会议室在该日期的所有预订
        List<Reservation> reservations = reservationRepository.findByRoomIdAndDateAndCancelledFalse(roomId, date);
        
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
            boolean isBooked = reservations.stream().anyMatch(reservation -> 
                (timeSlot.equals(reservation.getStartTime()) || timeSlot.isAfter(reservation.getStartTime()))
                && timeSlot.isBefore(reservation.getEndTime())
            );
            
            if (isBooked) {
                availability.put(timeKey, "unavailable");
            } else {
                availability.put(timeKey, "available");
            }
        }
        
        return availability;
    }
} 