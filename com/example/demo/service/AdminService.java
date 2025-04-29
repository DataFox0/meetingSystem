public void logAdminActionAfterCommit(String action, String username) {
    try {
        // 使用用户名查找用户而不是使用传递的用户对象
        // 或者完全避免在此函数中引用已删除的用户
        
        AdminLog log = new AdminLog();
        log.setAction(action);
        log.setAdminUsername(getCurrentUsername());
        log.setTargetUsername(username);  // 保存用户名而不是整个用户对象
        log.setTimestamp(new Date());
        
        adminLogRepository.save(log);
    } catch (Exception e) {
        // 记录异常但不要阻止主要操作完成
        System.err.println("Error logging admin action: " + e.getMessage());
        e.printStackTrace();
    }
}

// 修改 deleteUser 方法
public void deleteUser(Long userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    
    // 保存用户名以供日志使用
    String username = user.getUsername();
    
    // 删除用户相关的预订
    List<Reservation> reservations = reservationRepository.findByUserId(userId);
    if (!reservations.isEmpty()) {
        System.out.println("Cancelled " + reservations.size() + " reservations for user: " + username);
        reservationRepository.deleteAll(reservations);
    }
    
    // 删除用户
    userRepository.delete(user);
    System.out.println("Deleted user: " + username);
    
    // 使用保存的用户名而不是用户对象
    logAdminActionAfterCommit("Delete user", username);
} 