package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Date;

@Service
public class AdminService {

    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final AdminActionLogRepository adminActionLogRepository;

    @Autowired
    public AdminService(
            RoomRepository roomRepository,
            ReservationRepository reservationRepository,
            UserRepository userRepository,
            AdminRepository adminRepository,
            AdminActionLogRepository adminActionLogRepository) {
        this.roomRepository = roomRepository;
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
        this.adminActionLogRepository = adminActionLogRepository;
    }

    // 会议室管理方法
    public List<RoomDto> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(this::convertToRoomDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomDto createRoom(RoomCreateUpdateDto roomDto) {
        Room room = new Room();
        updateRoomFromDto(room, roomDto);
        
        Room savedRoom = roomRepository.save(room);
        
        // 记录管理员操作
        logAdminAction("CREATE", "ROOM", savedRoom.getId().toString(), 1, "Created new room: " + room.getName());
        
        return convertToRoomDto(savedRoom);
    }

    @Transactional
    public RoomDto updateRoom(Long id, RoomCreateUpdateDto roomDto) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found with id: " + id));
        
        updateRoomFromDto(room, roomDto);
        Room updatedRoom = roomRepository.save(room);
        
        // 记录管理员操作
        logAdminAction("UPDATE", "ROOM", id.toString(), 1, "Updated room: " + room.getName());
        
        return convertToRoomDto(updatedRoom);
    }

    @Transactional
    public void deleteRoom(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found with id: " + id));
        
        // 检查是否有未完成的预订
        List<Reservation> activeReservations = reservationRepository.findByRoomIdAndDateAfterAndCancelledFalse(
                id, java.time.LocalDate.now());
        
        if (!activeReservations.isEmpty()) {
            throw new RuntimeException("Cannot delete room with active reservations");
        }
        
        roomRepository.delete(room);
        
        // 记录管理员操作
        logAdminAction("DELETE", "ROOM", id.toString(), 1, "Deleted room: " + room.getName());
    }

    // 预订管理方法
    public List<ReservationDto> getAllReservations(Long roomId, String status) {
        List<Reservation> reservations;
        
        if (roomId != null && status != null) {
            reservations = reservationRepository.findByRoomIdAndStatus(roomId, ReservationStatus.valueOf(status));
        } else if (roomId != null) {
            reservations = reservationRepository.findByRoomId(roomId);
        } else if (status != null) {
            reservations = reservationRepository.findByStatus(ReservationStatus.valueOf(status));
        } else {
            reservations = reservationRepository.findAll();
        }
        
        return reservations.stream()
                .map(this::convertToReservationDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));
        
        reservationRepository.delete(reservation);
        
        // 记录管理员操作
        logAdminAction("DELETE", "RESERVATION", id.toString(), 1, 
                "Deleted reservation for room: " + reservation.getRoom().getName());
    }

    @Transactional
    public int batchDeleteReservations(List<Long> ids) {
        int count = 0;
        
        for (Long id : ids) {
            try {
                Reservation reservation = reservationRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));
                
                reservationRepository.delete(reservation);
                count++;
            } catch (Exception e) {
                // 记录错误但继续处理其他ID
                System.err.println("Error deleting reservation with ID " + id + ": " + e.getMessage());
            }
        }
        
        // 记录管理员操作（仅统计为一次删除操作）
        logAdminAction("BATCH_DELETE", "RESERVATION", String.join(",", ids.stream().map(String::valueOf).collect(Collectors.toList())), 
                count, "Batch deleted " + count + " reservations");
        
        return count;
    }

    // 用户管理方法
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToUserDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void lockUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        user.setEnabled(false);
        userRepository.save(user);
        
        // 记录管理员操作
        logAdminAction("LOCK", "USER", id.toString(), 1, "Locked user: " + user.getUsername());
    }

    @Transactional
    public void unlockUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        user.setEnabled(true);
        userRepository.save(user);
        
        // 记录管理员操作
        logAdminAction("UNLOCK", "USER", id.toString(), 1, "Unlocked user: " + user.getUsername());
    }

    @Transactional
    public void deleteUser(Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
            
            String username = user.getUsername(); // 先保存用户名，避免后面引用已删除的实体
            
            // 首先处理用户的预订 - 找到所有属于该用户的预订并标记为取消
            List<Reservation> userReservations = reservationRepository.findByUserId(id);
            if (!userReservations.isEmpty()) {
                for (Reservation reservation : userReservations) {
                    // 标记为取消
                    reservation.setCancelled(true);
                    // 设置状态为已拒绝，这样它们不会显示在活跃预订中
                    reservation.setStatus(ReservationStatus.REJECTED);
                }
                reservationRepository.saveAll(userReservations);
                System.out.println("Cancelled " + userReservations.size() + " reservations for user: " + username);
            }
            
            // 然后删除用户
            userRepository.deleteById(id);
            System.out.println("Deleted user: " + username);
            
            // 在事务完成后记录管理员操作
            try {
                // 使用新的事务记录管理员操作
                // 注意参数顺序已改变，以匹配新方法签名
                logAdminActionAfterCommit("DELETE", "USER", id.toString(), "Deleted user: " + username);
            } catch (Exception e) {
                // 记录失败不应影响主要操作
                System.err.println("Failed to log admin action: " + e.getMessage());
            }
        } catch (Exception e) {
            System.err.println("Error in deleteUser: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete user: " + e.getMessage());
        }
    }

    // 添加一个新方法，使用新的事务记录管理员操作
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAdminActionAfterCommit(String actionType, String targetType, String targetId, String details) {
        try {
            // 获取当前管理员，注意处理Optional
            Admin admin = adminRepository.findByUsername("admin")
                    .orElseThrow(() -> new RuntimeException("Admin not found for logging action"));
            
            AdminActionLog log = new AdminActionLog();
            log.setAdmin(admin);
            log.setActionType(actionType);
            log.setTargetType(targetType);
            log.setTargetId(targetId);
            log.setAffectedCount(1); // 默认影响1条记录
            log.setActionTime(LocalDateTime.now());
            log.setDetails(details);
            
            adminActionLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Error logging admin action: " + e.getMessage());
            e.printStackTrace();
            // 不抛出异常，以避免影响主要流程
        }
    }

    // 辅助方法
    private void updateRoomFromDto(Room room, RoomCreateUpdateDto dto) {
        room.setName(dto.getName());
        room.setLocation(dto.getLocation());
        room.setCapacity(dto.getCapacity());
        room.setImageUrl(dto.getImageUrl());
        room.setDescription(dto.getDescription());
        room.setIsActive(true);
        
        if (dto.getFacilities() != null) {
            room.setFacilities(new HashSet<>(dto.getFacilities()));
        }
    }

    private RoomDto convertToRoomDto(Room room) {
        RoomDto dto = new RoomDto();
        dto.setId(room.getId());
        dto.setName(room.getName());
        dto.setLocation(room.getLocation());
        dto.setCapacity(room.getCapacity());
        dto.setImageUrl(room.getImageUrl());
        dto.setFacilities(room.getFacilities());
        dto.setDescription(room.getDescription());
        return dto;
    }

    private ReservationDto convertToReservationDto(Reservation reservation) {
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
        
        // 添加用户学号
        if (reservation.getUser() != null) {
            dto.setUserStudentId(reservation.getUser().getStudentId());
        }
        
        return dto;
    }

    private UserDto convertToUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setStudentId(user.getStudentId());
        dto.setEnabled(user.isEnabled());
        dto.setEmailVerified(user.isEmailVerified());
        return dto;
    }

    private void logAdminAction(String actionType, String targetType, String targetId, int count, String details) {
        try {
            // 获取当前管理员（从SecurityContext中获取）
            // 这里简化处理，使用系统查找第一个管理员
            Admin admin = adminRepository.findAll().stream().findFirst().orElse(null);
            
            AdminActionLog log = new AdminActionLog();
            log.setAdmin(admin);
            log.setActionType(actionType);
            log.setTargetType(targetType);
            log.setTargetId(targetId);
            log.setAffectedCount(count);
            log.setActionTime(LocalDateTime.now());
            log.setDetails(details);
            
            adminActionLogRepository.save(log);
            System.out.println("Admin action logged: " + actionType + " " + targetType + " " + targetId);
        } catch (Exception e) {
            // 记录日志失败不应影响主要业务
            System.err.println("Failed to log admin action: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 