package com.example.demo.repository;

import com.example.demo.model.Admin;
import com.example.demo.model.AdminActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, Long> {
    
    List<AdminActionLog> findByAdminOrderByActionTimeDesc(Admin admin);
    
    List<AdminActionLog> findByActionTypeOrderByActionTimeDesc(String actionType);
    
    List<AdminActionLog> findTop10ByOrderByActionTimeDesc();
} 