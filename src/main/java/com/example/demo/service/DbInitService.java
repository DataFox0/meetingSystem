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
        }
    }

    private void initRooms() {
        // 创建会议室 A
        Room roomA = new Room();
        roomA.setName("会议室 A");
        roomA.setLocation("主楼一层");
        roomA.setCapacity(10);
        roomA.setImageUrl("/images/rooms/room-a.jpg");
        roomA.setDescription("适合小型会议和讨论");
        roomA.setFacilities(new HashSet<>(Arrays.asList("投影仪", "WiFi", "白板")));

        // 创建会议室 B
        Room roomB = new Room();
        roomB.setName("会议室 B");
        roomB.setLocation("主楼一层");
        roomB.setCapacity(20);
        roomB.setImageUrl("/images/rooms/room-b.jpg");
        roomB.setDescription("配备投影仪和音响系统");
        roomB.setFacilities(new HashSet<>(Arrays.asList("投影仪", "WiFi", "白板", "音响系统")));

        // 创建会议室 C
        Room roomC = new Room();
        roomC.setName("会议室 C");
        roomC.setLocation("主楼二层");
        roomC.setCapacity(30);
        roomC.setImageUrl("/images/rooms/room-c.jpg");
        roomC.setDescription("适合中型会议和演讲");
        roomC.setFacilities(new HashSet<>(Arrays.asList("投影仪", "WiFi", "白板", "音响系统", "视频会议设备")));

        // 创建会议室 D
        Room roomD = new Room();
        roomD.setName("会议室 D");
        roomD.setLocation("主楼二层");
        roomD.setCapacity(50);
        roomD.setImageUrl("/images/rooms/room-d.jpg");
        roomD.setDescription("大型会议室，配备完整的多媒体系统");
        roomD.setFacilities(new HashSet<>(Arrays.asList("投影仪", "WiFi", "白板", "音响系统", "视频会议设备", "舞台")));

        // 创建会议室 E
        Room roomE = new Room();
        roomE.setName("会议室 E");
        roomE.setLocation("附楼一层");
        roomE.setCapacity(15);
        roomE.setImageUrl("/images/rooms/room-e.jpg");
        roomE.setDescription("安静舒适，适合小组讨论");
        roomE.setFacilities(new HashSet<>(Arrays.asList("投影仪", "WiFi", "白板")));

        // 创建会议室 F
        Room roomF = new Room();
        roomF.setName("会议室 F");
        roomF.setLocation("附楼二层");
        roomF.setCapacity(25);
        roomF.setImageUrl("/images/rooms/room-f.jpg");
        roomF.setDescription("配备白板和演示设备");
        roomF.setFacilities(new HashSet<>(Arrays.asList("投影仪", "WiFi", "白板", "音响系统")));

        // 保存所有会议室
        List<Room> rooms = Arrays.asList(roomA, roomB, roomC, roomD, roomE, roomF);
        roomRepository.saveAll(rooms);
    }
} 