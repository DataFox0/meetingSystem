package com.example.demo.repository;

import com.example.demo.model.Reservation;
import com.example.demo.model.ReservationStatus;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    
    List<Reservation> findByUserOrderByDateDescStartTimeDesc(User user);
    
    @Query("SELECT r FROM Reservation r WHERE r.room.id = :roomId AND r.date = :date " +
            "AND ((r.startTime <= :endTime AND r.endTime > :startTime) OR " +
            "(r.startTime < :endTime AND r.endTime >= :startTime)) " +
            "AND r.cancelled = false")
    List<Reservation> findConflictingReservations(
            @Param("roomId") Long roomId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    List<Reservation> findByRoomIdAndDateAndCancelledFalse(Long roomId, LocalDate date);

    List<Reservation> findByRoomIdAndDateAfterAndCancelledFalse(Long roomId, LocalDate date);

    List<Reservation> findByRoomIdAndStatus(Long roomId, ReservationStatus status);

    List<Reservation> findByStatus(ReservationStatus status);

    List<Reservation> findByRoomId(Long roomId);

    @Query("SELECT r FROM Reservation r WHERE r.user.id = :userId")
    List<Reservation> findByUserId(@Param("userId") Long userId);

    default List<Reservation> findByUser(User user) {
        if (user == null) {
            return new ArrayList<>();
        }
        return findByUserId(user.getId());
    }

    long countByDateAfterAndCancelledFalse(LocalDate date);
    long countByDateAndCancelledFalse(LocalDate date);

    @Modifying
    @Query("UPDATE Reservation r SET r.user = null, r.cancelled = true WHERE r.user.id = :userId")
    int detachUserFromReservations(@Param("userId") Long userId);
} 