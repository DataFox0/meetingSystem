package com.example.demo.controller;

import com.example.demo.dto.ReservationDto;
import com.example.demo.dto.ReservationRequestDto;
import com.example.demo.security.JwtTokenUtil;
import com.example.demo.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    
    private final ReservationService reservationService;
    private final JwtTokenUtil jwtTokenUtil;
    
    @Autowired
    public ReservationController(ReservationService reservationService, JwtTokenUtil jwtTokenUtil) {
        this.reservationService = reservationService;
        this.jwtTokenUtil = jwtTokenUtil;
    }
    
    @GetMapping
    public ResponseEntity<List<ReservationDto>> getUserReservations(@RequestHeader("Authorization") String token) {
        String username = jwtTokenUtil.extractUsername(token.replace("Bearer ", ""));
        return ResponseEntity.ok(reservationService.getUserReservations(username));
    }
    
    @PostMapping
    public ResponseEntity<ReservationDto> createReservation(
            @Valid @RequestBody ReservationRequestDto requestDto,
            @RequestHeader("Authorization") String token) {
        
        String username = jwtTokenUtil.extractUsername(token.replace("Bearer ", ""));
        ReservationDto reservationDto = reservationService.createReservation(username, requestDto);
        return ResponseEntity.ok(reservationDto);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelReservation(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        
        String username = jwtTokenUtil.extractUsername(token.replace("Bearer ", ""));
        reservationService.cancelReservation(username, id);
        return ResponseEntity.ok(Map.of("message", "Reservation cancelled successfully"));
    }
} 