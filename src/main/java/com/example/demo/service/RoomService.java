package com.example.demo.service;

import com.example.demo.dto.RoomDto;
import com.example.demo.dto.RoomFilterDto;
import com.example.demo.model.Room;
import com.example.demo.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    
    @Autowired
    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }
    
    public List<RoomDto> getAllRooms() {
        return roomRepository.findByIsActiveTrue()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public RoomDto getRoomById(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found with id: " + roomId));
        
        if (!room.getIsActive()) {
            throw new RuntimeException("Room is not active");
        }
        
        return convertToDto(room);
    }
    
    public List<RoomDto> filterRooms(RoomFilterDto filterDto) {
        List<Room> filteredRooms;
        
        if (filterDto.getLocation() != null && filterDto.getMinCapacity() != null) {
            filteredRooms = roomRepository.findByLocationAndCapacityGreaterThanEqual(
                    filterDto.getLocation(), filterDto.getMinCapacity());
        } else if (filterDto.getLocation() != null) {
            filteredRooms = roomRepository.findByLocation(filterDto.getLocation());
        } else if (filterDto.getMinCapacity() != null) {
            filteredRooms = roomRepository.findByCapacityGreaterThanEqual(filterDto.getMinCapacity());
        } else {
            filteredRooms = roomRepository.findByIsActiveTrue();
        }
        
        // 如果还需要按设施过滤
        if (filterDto.getFacilities() != null && !filterDto.getFacilities().isEmpty()) {
            filteredRooms = filteredRooms.stream()
                    .filter(room -> room.getFacilities().containsAll(filterDto.getFacilities()))
                    .collect(Collectors.toList());
        }
        
        return filteredRooms.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<String> getAllLocations() {
        return roomRepository.findByIsActiveTrue()
                .stream()
                .map(Room::getLocation)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public Set<String> getAllFacilities() {
        return roomRepository.findByIsActiveTrue()
                .stream()
                .flatMap(room -> room.getFacilities().stream())
                .collect(Collectors.toSet());
    }
    
    private RoomDto convertToDto(Room room) {
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
} 