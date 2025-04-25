package com.example.demo.controller;

import com.example.demo.dto.ReservationDto;
import com.example.demo.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reservations")
public class AdminReservationController {

    private final AdminService adminService;

    @Autowired
    public AdminReservationController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    public ResponseEntity<List<ReservationDto>> getAllReservations(
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminService.getAllReservations(roomId, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteReservation(@PathVariable Long id) {
        adminService.deleteReservation(id);
        return ResponseEntity.ok(Map.of("message", "Reservation deleted successfully"));
    }

    @DeleteMapping("/batch")
    public ResponseEntity<Map<String, String>> batchDeleteReservations(@RequestBody List<Long> ids) {
        int count = adminService.batchDeleteReservations(ids);
        return ResponseEntity.ok(Map.of(
                "message", "Successfully deleted " + count + " reservations",
                "count", String.valueOf(count)
        ));
    }
} 