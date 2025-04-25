package com.example.demo.controller;

import com.example.demo.repository.UserRepository;
import com.example.demo.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    @Autowired
    public TestController(UserRepository userRepository, AdminRepository adminRepository) {
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
    }

    @GetMapping("/db-status")
    public ResponseEntity<Map<String, Object>> getDbStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            long userCount = userRepository.count();
            long adminCount = adminRepository.count();
            
            status.put("status", "connected");
            status.put("userCount", userCount);
            status.put("adminCount", adminCount);
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            status.put("status", "error");
            status.put("message", e.getMessage());
            return ResponseEntity.status(500).body(status);
        }
    }

    @GetMapping("/hello")
    public Map<String, String> hello() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Hello, Meeting System is working!");
        return response;
    }
} 