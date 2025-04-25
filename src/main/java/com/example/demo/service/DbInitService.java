package com.example.demo.service;

import com.example.demo.dto.AdminRegistrationDto;
import com.example.demo.model.Admin;
import com.example.demo.model.Room;
import com.example.demo.repository.RoomRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.logging.Logger;

@Service
public class DbInitService implements CommandLineRunner {

    private static final Logger logger = Logger.getLogger(DbInitService.class.getName());
    
    private final AuthService authService;
    private final RoomRepository roomRepository;

    @Autowired
    public DbInitService(AuthService authService, RoomRepository roomRepository) {
        this.authService = authService;
        this.roomRepository = roomRepository;
    }

    @PostConstruct
    public void initDb() {
        try {
            // 创建一个默认管理员账户，如果不存在的话
            AdminRegistrationDto adminDto = new AdminRegistrationDto();
            adminDto.setUsername("admin");
            adminDto.setEmail("admin@example.com");
            adminDto.setPassword("admin123");
            
            try {
                Admin admin = authService.registerAdmin(adminDto);
                logger.info("Default admin account created: " + admin.getUsername());
            } catch (Exception e) {
                // 管理员可能已经存在，这是正常的
                logger.info("Default admin already exists: " + e.getMessage());
            }
            
            logger.info("Database initialized successfully");
        } catch (Exception e) {
            logger.severe("Failed to initialize database: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    @Transactional
    public void run(String... args) {
        // 只有当会议室表为空时才初始化数据
        if (roomRepository.count() == 0) {
            initRooms();
            System.out.println("Rooms initialized successfully.");
        }
    }

    private void initRooms() {
        // 创建会议室 A
        Room roomA = new Room();
        roomA.setName("Room A");
        roomA.setLocation("SA869");
        roomA.setCapacity(10);
        roomA.setImageUrl("/images/rooms/room-a.jpg");
        roomA.setDescription("Suitable for small meetings and discussions");
        roomA.setFacilities(new HashSet<>(Arrays.asList("Projector", "WiFi", "Whiteboard")));

        // 创建会议室 B
        Room roomB = new Room();
        roomB.setName("Room B");
        roomB.setLocation("SB814");
        roomB.setCapacity(20);
        roomB.setImageUrl("/images/rooms/room-b.jpg");
        roomB.setDescription("Equipped with projector and sound system");
        roomB.setFacilities(new HashSet<>(Arrays.asList("Projector", "WiFi", "Whiteboard", "Speaker System")));

        // 创建会议室 C
        Room roomC = new Room();
        roomC.setName("Room C");
        roomC.setLocation("SC854");
        roomC.setCapacity(30);
        roomC.setImageUrl("/images/rooms/room-c.jpg");
        roomC.setDescription("Suitable for medium-sized conferences and speeches");
        roomC.setFacilities(new HashSet<>(Arrays.asList("Projector", "WiFi", "Whiteboard", "Speaker System", "Video Conferencing Equipment")));

        // 创建会议室 D
        Room roomD = new Room();
        roomD.setName("Room D");
        roomD.setLocation("SD876");
        roomD.setCapacity(50);
        roomD.setImageUrl("/images/rooms/room-d.jpg");
        roomD.setDescription("Large conference room equipped with a complete multimedia system");
        roomD.setFacilities(new HashSet<>(Arrays.asList("Projector", "WiFi", "Whiteboard", "Speaker System", "Video Conferencing Equipment", "Stage")));

        // 创建会议室 E
        Room roomE = new Room();
        roomE.setName("Room E");
        roomE.setLocation("EE810");
        roomE.setCapacity(15);
        roomE.setImageUrl("/images/rooms/room-e.jpg");
        roomE.setDescription("Quiet and comfortable, suitable for group discussions");
        roomE.setFacilities(new HashSet<>(Arrays.asList("Projector", "WiFi", "Whiteboard")));

        // 创建会议室 F
        Room roomF = new Room();
        roomF.setName("Room F");
        roomF.setLocation("EB814");
        roomF.setCapacity(25);
        roomF.setImageUrl("/images/rooms/room-f.jpg");
        roomF.setDescription("Equipped with whiteboard and demonstration equipment");
        roomF.setFacilities(new HashSet<>(Arrays.asList("Projector", "WiFi", "Whiteboard", "Speaker System")));

        // 保存所有会议室
        List<Room> rooms = Arrays.asList(roomA, roomB, roomC, roomD, roomE, roomF);
        roomRepository.saveAll(rooms);
    }
} 