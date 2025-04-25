package com.example.demo.security;

import com.example.demo.model.Admin;
import com.example.demo.model.User;
import com.example.demo.repository.AdminRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    public CustomUserDetailsService(UserRepository userRepository, AdminRepository adminRepository) {
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameWithRole) throws UsernameNotFoundException {
        String[] parts = usernameWithRole.split(":");
        String username = parts[0];
        String role = parts.length > 1 ? parts[1] : "USER";

        if ("ADMIN".equals(role)) {
            Optional<Admin> adminOptional = adminRepository.findByUsername(username);
            if (adminOptional.isPresent()) {
                Admin admin = adminOptional.get();
                return new org.springframework.security.core.userdetails.User(
                        admin.getUsername(),
                        admin.getPassword(),
                        admin.isEnabled(),
                        true, true, true,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
            }
        } else {
            Optional<User> userOptional = userRepository.findByUsername(username);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                return new org.springframework.security.core.userdetails.User(
                        user.getUsername(),
                        user.getPassword(),
                        user.isEnabled() && user.isEmailVerified(),
                        true, true, true,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                );
            }
        }
        
        throw new UsernameNotFoundException("User not found with username: " + username);
    }
    
    public UserDetails loadUserByUsername(String username, String role) {
        return loadUserByUsername(username + ":" + role);
    }
} 