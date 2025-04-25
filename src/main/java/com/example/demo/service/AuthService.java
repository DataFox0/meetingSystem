package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.model.Admin;
import com.example.demo.model.User;
import com.example.demo.repository.AdminRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtTokenUtil;
import jakarta.mail.MessagingException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, AdminRepository adminRepository,
                      PasswordEncoder passwordEncoder, JwtTokenUtil jwtTokenUtil,
                      AuthenticationManager authenticationManager, EmailService emailService) {
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenUtil = jwtTokenUtil;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    public User registerUser(UserRegistrationDto registrationDto) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(registrationDto.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(registrationDto.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        if (userRepository.existsByStudentId(registrationDto.getStudentId())) {
            throw new RuntimeException("Student ID already exists");
        }

        // Create new user
        User user = new User();
        user.setStudentId(registrationDto.getStudentId());
        user.setUsername(registrationDto.getUsername());
        user.setEmail(registrationDto.getEmail());
        user.setPassword(passwordEncoder.encode(registrationDto.getPassword()));
        user.setAvatarUrl(registrationDto.getAvatarUrl());
        
        // Generate verification token
        user.setVerificationToken(UUID.randomUUID().toString());
        
        User savedUser = userRepository.save(user);
        
        // Send verification email
        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getVerificationToken());
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email", e);
        }
        
        return savedUser;
    }
    
    public Admin registerAdmin(AdminRegistrationDto registrationDto) {
        // 验证邀请码
        if (!"CPT202".equals(registrationDto.getInvitationCode())) {
            throw new RuntimeException("Invalid invitation code");
        }
        
        // Check if username or email already exists
        if (adminRepository.existsByUsername(registrationDto.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (adminRepository.existsByEmail(registrationDto.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Create new admin
        Admin admin = new Admin();
        admin.setUsername(registrationDto.getUsername());
        admin.setEmail(registrationDto.getEmail());
        admin.setPassword(passwordEncoder.encode(registrationDto.getPassword()));
        admin.setAvatarUrl(registrationDto.getAvatarUrl());
        
        // Generate verification token
        admin.setVerificationToken(UUID.randomUUID().toString());
        
        Admin savedAdmin = adminRepository.save(admin);
        
        // Send verification email
        try {
            emailService.sendVerificationEmail(admin.getEmail(), admin.getVerificationToken());
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email", e);
        }
        
        return savedAdmin;
    }
    
    public JwtResponseDto loginUser(LoginDto loginDto) {
        // 通过email查找用户
        Optional<User> userOptional = userRepository.findByEmail(loginDto.getEmail());
        if (!userOptional.isPresent()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOptional.get();
        
        // 验证密码
        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        
        // 检查邮箱是否已验证
        if (!user.isEmailVerified()) {
            throw new RuntimeException("Email not verified");
        }
        
        // 创建Authentication对象
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getUsername() + ":USER",
                        loginDto.getPassword()
                )
        );
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        // 生成JWT token
        String jwt = jwtTokenUtil.generateToken(userDetails, "USER");
        
        return new JwtResponseDto(jwt, user.getUsername(), "USER");
    }
    
    public JwtResponseDto loginAdmin(LoginDto loginDto) {
        // 通过email查找管理员
        Optional<Admin> adminOptional = adminRepository.findByEmail(loginDto.getEmail());
        if (!adminOptional.isPresent()) {
            throw new RuntimeException("Admin not found");
        }
        
        Admin admin = adminOptional.get();
        
        // 验证密码
        if (!passwordEncoder.matches(loginDto.getPassword(), admin.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        
        // 检查邮箱是否已验证
        if (!admin.isEmailVerified()) {
            throw new RuntimeException("Email not verified");
        }
        
        // 创建Authentication对象
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        admin.getUsername() + ":ADMIN",
                        loginDto.getPassword()
                )
        );
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        // 生成JWT token
        String jwt = jwtTokenUtil.generateToken(userDetails, "ADMIN");
        
        return new JwtResponseDto(jwt, admin.getUsername(), "ADMIN");
    }
    
    public boolean verifyEmail(String token) {
        Optional<User> userOptional = userRepository.findByVerificationToken(token);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setEmailVerified(true);
            user.setVerificationToken(null);
            userRepository.save(user);
            return true;
        }
        
        Optional<Admin> adminOptional = adminRepository.findByVerificationToken(token);
        
        if (adminOptional.isPresent()) {
            Admin admin = adminOptional.get();
            admin.setEmailVerified(true);
            admin.setVerificationToken(null);
            adminRepository.save(admin);
            return true;
        }
        
        return false;
    }
    
    public boolean requestPasswordReset(PasswordResetRequestDto requestDto, String role) {
        if ("USER".equalsIgnoreCase(role)) {
            Optional<User> userOptional = userRepository.findByEmail(requestDto.getEmail());
            
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                String token = UUID.randomUUID().toString();
                user.setResetPasswordToken(token);
                user.setResetPasswordTokenExpiry(new Date(System.currentTimeMillis() + 3600000)); // 1 hour
                userRepository.save(user);
                
                try {
                    emailService.sendPasswordResetEmail(user.getEmail(), token);
                    return true;
                } catch (MessagingException e) {
                    throw new RuntimeException("Failed to send password reset email", e);
                }
            }
        } else if ("ADMIN".equalsIgnoreCase(role)) {
            Optional<Admin> adminOptional = adminRepository.findByEmail(requestDto.getEmail());
            
            if (adminOptional.isPresent()) {
                Admin admin = adminOptional.get();
                String token = UUID.randomUUID().toString();
                admin.setResetPasswordToken(token);
                admin.setResetPasswordTokenExpiry(new Date(System.currentTimeMillis() + 3600000)); // 1 hour
                adminRepository.save(admin);
                
                try {
                    emailService.sendPasswordResetEmail(admin.getEmail(), token);
                    return true;
                } catch (MessagingException e) {
                    throw new RuntimeException("Failed to send password reset email", e);
                }
            }
        }
        
        return false;
    }
    
    public boolean resetPassword(PasswordResetDto resetDto, String role) {
        if ("USER".equalsIgnoreCase(role)) {
            Optional<User> userOptional = userRepository.findByResetPasswordToken(resetDto.getToken());
            
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                if (user.getResetPasswordTokenExpiry().after(new Date())) {
                    user.setPassword(passwordEncoder.encode(resetDto.getPassword()));
                    user.setResetPasswordToken(null);
                    user.setResetPasswordTokenExpiry(null);
                    userRepository.save(user);
                    return true;
                }
            }
        } else if ("ADMIN".equalsIgnoreCase(role)) {
            Optional<Admin> adminOptional = adminRepository.findByResetPasswordToken(resetDto.getToken());
            
            if (adminOptional.isPresent()) {
                Admin admin = adminOptional.get();
                if (admin.getResetPasswordTokenExpiry().after(new Date())) {
                    admin.setPassword(passwordEncoder.encode(resetDto.getPassword()));
                    admin.setResetPasswordToken(null);
                    admin.setResetPasswordTokenExpiry(null);
                    adminRepository.save(admin);
                    return true;
                }
            }
        }
        
        return false;
    }

    @Transactional
    public String saveAvatarForUnverifiedUser(String email, MultipartFile file, String role) {
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
            
            // 根据角色更新相应的用户或管理员
            if ("ADMIN".equalsIgnoreCase(role)) {
                Optional<Admin> adminOptional = adminRepository.findByEmail(email);
                if (adminOptional.isPresent()) {
                    Admin admin = adminOptional.get();
                    admin.setAvatarUrl(avatarUrl);
                    adminRepository.save(admin);
                } else {
                    throw new RuntimeException("Admin not found");
                }
            } else {
                Optional<User> userOptional = userRepository.findByEmail(email);
                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    user.setAvatarUrl(avatarUrl);
                    userRepository.save(user);
                } else {
                    throw new RuntimeException("User not found");
                }
            }
            
            return avatarUrl;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload avatar: " + e.getMessage());
        }
    }
} 