-- 用户表
CREATE TABLE users (
                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                       student_id VARCHAR(255) NOT NULL UNIQUE,
                       username VARCHAR(255) NOT NULL,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       avatar_url VARCHAR(255),
                       email_verified BOOLEAN DEFAULT FALSE,
                       verification_token VARCHAR(255),
                       reset_password_token VARCHAR(255),
                       reset_password_token_expiry DATETIME,
                       enabled BOOLEAN DEFAULT TRUE
);

-- 管理员表
CREATE TABLE admins (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(255) NOT NULL UNIQUE,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        password VARCHAR(255) NOT NULL,
                        avatar_url VARCHAR(255),
                        email_verified BOOLEAN DEFAULT FALSE,
                        verification_token VARCHAR(255),
                        reset_password_token VARCHAR(255),
                        reset_password_token_expiry DATETIME,
                        enabled BOOLEAN DEFAULT TRUE
);

-- 会议室表
CREATE TABLE rooms (
                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                       name VARCHAR(255) NOT NULL,
                       location VARCHAR(255) NOT NULL,
                       capacity INT NOT NULL,
                       image_url VARCHAR(255),
                       description TEXT,
                       is_active BOOLEAN DEFAULT TRUE
);

-- 会议室设施表 (与Room实体的facilities Set集合对应)
CREATE TABLE room_facilities (
                                 room_id BIGINT NOT NULL,
                                 facility VARCHAR(255) NOT NULL,
                                 PRIMARY KEY (room_id, facility),
                                 FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- 预约表
CREATE TABLE reservations (
                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                              user_id BIGINT,
                              room_id BIGINT NOT NULL,
                              date DATE NOT NULL,
                              start_time TIME NOT NULL,
                              end_time TIME NOT NULL,
                              purpose VARCHAR(255) NOT NULL,
                              attendees_count INT NOT NULL,
                              status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                              cancelled BOOLEAN DEFAULT FALSE,
                              created_date DATE DEFAULT (CURRENT_DATE),
                              cancel_reason VARCHAR(255),
                              FOREIGN KEY (user_id) REFERENCES users(id),
                              FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- 管理员操作日志表
CREATE TABLE admin_action_logs (
                                   id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                   admin_id BIGINT NOT NULL,
                                   action_type VARCHAR(255) NOT NULL,
                                   target_type VARCHAR(255) NOT NULL,
                                   target_id VARCHAR(255) NOT NULL,
                                   affected_count INT NOT NULL,
                                   action_time DATETIME NOT NULL,
                                   details TEXT,
                                   FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_room_location ON rooms(location);
CREATE INDEX idx_reservation_date ON reservations(date);
CREATE INDEX idx_reservation_status ON reservations(status);
CREATE INDEX idx_reservation_user ON reservations(user_id);
CREATE INDEX idx_reservation_room ON reservations(room_id);
CREATE INDEX idx_admin_action_admin ON admin_action_logs(admin_id);
CREATE INDEX idx_admin_action_time ON admin_action_logs(action_time);