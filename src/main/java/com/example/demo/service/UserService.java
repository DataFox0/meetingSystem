package com.example.demo.service;

import com.example.demo.dto.ChangePasswordDto;
import com.example.demo.dto.PasswordUpdateDto;
import com.example.demo.dto.ProfileUpdateDto;
import com.example.demo.dto.UserProfileDto;
import com.example.demo.model.Reservation;
import com.example.demo.model.ReservationStatus;
import com.example.demo.model.User;
import com.example.demo.repository.ReservationRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {
    
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    public UserService(UserRepository userRepository, ReservationRepository reservationRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.reservationRepository = reservationRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    public UserProfileDto getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserProfileDto profileDto = new UserProfileDto();
        profileDto.setStudentId(user.getStudentId());
        profileDto.setUsername(user.getUsername());
        profileDto.setEmail(user.getEmail());
        profileDto.setAvatarUrl(user.getAvatarUrl());
        
        return profileDto;
    }
    
    @Transactional
    public boolean changePassword(String username, ChangePasswordDto passwordDto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 验证当前密码
        if (!passwordEncoder.matches(passwordDto.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        // 更新密码
        user.setPassword(passwordEncoder.encode(passwordDto.getNewPassword()));
        userRepository.save(user);
        
        return true;
    }
    
    @Transactional
    public void updateProfile(String username, ProfileUpdateDto profileDto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 如果用户名被修改，需要检查是否与其他用户名冲突
        if (!user.getUsername().equals(profileDto.getUsername()) && 
                userRepository.existsByUsername(profileDto.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        
        user.setUsername(profileDto.getUsername());
        userRepository.save(user);
    }
    
    @Transactional
    public void updatePassword(String username, PasswordUpdateDto passwordDto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 验证当前密码
        if (!passwordEncoder.matches(passwordDto.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        // 更新密码
        user.setPassword(passwordEncoder.encode(passwordDto.getNewPassword()));
        userRepository.save(user);
    }
    
    @Transactional
    public String updateAvatar(String username, MultipartFile file) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (file.isEmpty()) {
            throw new RuntimeException("Avatar file is empty");
        }
        
        try {
            // 生成唯一文件名
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            // 确保上传目录存在
            Path uploadDir = Paths.get("uploads/avatars");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            
            // 保存文件
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath);
            
            // 更新用户头像URL
            String avatarUrl = "/uploads/avatars/" + filename;
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);
            
            return avatarUrl;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload avatar: " + e.getMessage());
        }
    }
    
    @Transactional
    public void deleteAccount(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 首先处理用户的预订 - 找到所有属于该用户的预订并标记为取消
        List<Reservation> userReservations = reservationRepository.findByUserId(user.getId());
        if (!userReservations.isEmpty()) {
            for (Reservation reservation : userReservations) {
                // 标记为取消
                reservation.setCancelled(true);
                // 设置状态为已拒绝，这样它们不会显示在活跃预订中
                reservation.setStatus(ReservationStatus.REJECTED);
                // 可选：设置取消原因
                reservation.setCancelReason("User account deleted");
            }
            reservationRepository.saveAll(userReservations);
        }
        
        // 删除用户
        userRepository.delete(user);
    }
} 