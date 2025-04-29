package com.carpooling.service;

import com.carpooling.model.User;
import com.carpooling.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(String name, String email, String phone, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(passwordEncoder.encode(password));

        return userRepository.save(user);
    }

    public User updateProfile(Long userId, String name, String phone, MultipartFile photo) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (name != null && !name.isEmpty()) {
            user.setName(name);
        }
        if (phone != null && !phone.isEmpty()) {
            user.setPhone(phone);
        }
        if (photo != null && !photo.isEmpty()) {
            // TODO: Implement photo upload and storage
            // user.setPhotoUrl(uploadedPhotoUrl);
        }

        return userRepository.save(user);
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    public User getDefaultUser() {
        List<User> users = userRepository.findAll();
        if (users.isEmpty()) {
            // Create a default user if none exists
            return registerUser(
                "Default User",
                "default@example.com",
                "+380123456789",
                "password"
            );
        }
        return users.get(0);
    }
    
    public boolean authenticate(String email, String password) {
        return userRepository.findByEmail(email)
                .map(user -> passwordEncoder.matches(password, user.getPassword()))
                .orElse(false);
    }
} 