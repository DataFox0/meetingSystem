package com.example.demo.repository;

import com.example.demo.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByEmail(String email);
    Optional<Admin> findByUsername(String username);
    Optional<Admin> findByResetPasswordToken(String token);
    Optional<Admin> findByVerificationToken(String token);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
} 