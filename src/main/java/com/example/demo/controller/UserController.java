package com.example.demo.controller;

import com.example.demo.dto.PasswordUpdateDto;
import com.example.demo.dto.ProfileUpdateDto;
import com.example.demo.dto.UserProfileDto;
import com.example.demo.security.JwtTokenUtil;
import com.example.demo.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    private final JwtTokenUtil jwtTokenUtil;
    
    public UserController(UserService userService, JwtTokenUtil jwtTokenUtil) {
        this.userService = userService;
        this.jwtTokenUtil = jwtTokenUtil;
    }
    
    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getUserProfile(@RequestHeader("Authorization") String token) {
        String username = jwtTokenUtil.extractUsername(token.replace("Bearer ", ""));
        UserProfileDto profile = userService.getUserProfile(username);
        return ResponseEntity.ok(profile);
    }
    
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody ProfileUpdateDto profileDto,
            @RequestHeader("Authorization") String token) {
        
        String username = jwtTokenUtil.extractUsername(token.replace("Bearer ", ""));
        userService.updateProfile(username, profileDto);
        
        // 返回包含成功消息的JSON对象，而不是空响应
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }
    
    @PutMapping("/password")
    public ResponseEntity<?> updatePassword(
            @Valid @RequestBody PasswordUpdateDto passwordDto,
            @RequestHeader("Authorization") String token) {
        
        String username = jwtTokenUtil.extractUsername(token.replace("Bearer ", ""));
        userService.updatePassword(username, passwordDto);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestParam("avatar") MultipartFile file,
            @RequestHeader("Authorization") String token) {
        
        String username = jwtTokenUtil.extractUsername(token.replace("Bearer ", ""));
        String avatarUrl = userService.updateAvatar(username, file);
        return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl));
    }
    
    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(@RequestHeader("Authorization") String token) {
        String username = jwtTokenUtil.extractUsername(token.replace("Bearer ", ""));
        userService.deleteAccount(username);
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }
} 