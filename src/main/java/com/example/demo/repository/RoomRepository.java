package com.example.demo.repository;

import com.example.demo.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    
    List<Room> findByIsActiveTrue();
    
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.capacity >= :minCapacity")
    List<Room> findByCapacityGreaterThanEqual(@Param("minCapacity") Integer minCapacity);
    
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.location = :location")
    List<Room> findByLocation(@Param("location") String location);
    
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.capacity >= :minCapacity AND r.location = :location")
    List<Room> findByLocationAndCapacityGreaterThanEqual(
            @Param("location") String location, 
            @Param("minCapacity") Integer minCapacity);
} 