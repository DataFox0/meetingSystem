package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.model.Admin;
import com.example.demo.model.User;
import com.example.demo.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/user")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationDto registrationDto) {
        try {
            User user = authService.registerUser(registrationDto);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User registered successfully. Please check your email to verify your account.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/register/admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody AdminRegistrationDto registrationDto) {
        try {
            Admin admin = authService.registerAdmin(registrationDto);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Admin registered successfully.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/login/user")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginDto loginDto) {
        try {
            JwtResponseDto response = authService.loginUser(loginDto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Invalid username or password");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/login/admin")
    public ResponseEntity<?> loginAdmin(@Valid @RequestBody LoginDto loginDto) {
        try {
            JwtResponseDto response = authService.loginAdmin(loginDto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Invalid username or password");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        boolean verified = authService.verifyEmail(token);
        
        if (verified) {
            return ResponseEntity.ok(Map.of("message", "Email verified successfully. You can now login."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired token"));
        }
    }

    @PostMapping("/reset-password-request/user")
    public ResponseEntity<?> requestPasswordResetUser(@Valid @RequestBody PasswordResetRequestDto requestDto) {
        boolean sent = authService.requestPasswordReset(requestDto, "USER");
        
        if (sent) {
            return ResponseEntity.ok(Map.of("message", "Password reset email sent"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Email not found"));
        }
    }

    @PostMapping("/reset-password-request/admin")
    public ResponseEntity<?> requestPasswordResetAdmin(@Valid @RequestBody PasswordResetRequestDto requestDto) {
        boolean sent = authService.requestPasswordReset(requestDto, "ADMIN");
        
        if (sent) {
            return ResponseEntity.ok(Map.of("message", "Password reset email sent"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Email not found"));
        }
    }

    @PostMapping("/reset-password/user")
    public ResponseEntity<?> resetPasswordUser(@Valid @RequestBody PasswordResetDto resetDto) {
        boolean reset = authService.resetPassword(resetDto, "USER");
        
        if (reset) {
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired token"));
        }
    }

    @PostMapping("/reset-password/admin")
    public ResponseEntity<?> resetPasswordAdmin(@Valid @RequestBody PasswordResetDto resetDto) {
        boolean reset = authService.resetPassword(resetDto, "ADMIN");
        
        if (reset) {
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired token"));
        }
    }

    @PostMapping(value = "/upload-avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatarForRegistration(
            @RequestParam("avatar") MultipartFile file,
            @RequestParam("email") String email,
            @RequestParam(value = "role", defaultValue = "USER") String role) {
        
        try {
            String avatarUrl = authService.saveAvatarForUnverifiedUser(email, file, role);
            return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
} 