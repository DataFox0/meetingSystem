package com.example.demo.controller;

import com.example.demo.dto.RoomCreateUpdateDto;
import com.example.demo.dto.RoomDto;
import com.example.demo.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/rooms")
public class AdminRoomController {

    private final AdminService adminService;

    @Autowired
    public AdminRoomController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    public ResponseEntity<List<RoomDto>> getAllRooms() {
        return ResponseEntity.ok(adminService.getAllRooms());
    }

    @PostMapping
    public ResponseEntity<RoomDto> createRoom(@Valid @RequestBody RoomCreateUpdateDto roomDto) {
        return ResponseEntity.ok(adminService.createRoom(roomDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoomDto> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody RoomCreateUpdateDto roomDto) {
        return ResponseEntity.ok(adminService.updateRoom(id, roomDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteRoom(@PathVariable Long id) {
        adminService.deleteRoom(id);
        return ResponseEntity.ok(Map.of("message", "Room deleted successfully"));
    }
} 