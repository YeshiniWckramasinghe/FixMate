package com.fixmate.config;

import com.fixmate.entity.Role;
import com.fixmate.entity.User;
import com.fixmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// Seeds a default Admin account on first startup since Admin accounts cannot self-register.
// Change these credentials immediately after first login in a real deployment.
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@fixmate.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail(adminEmail)) {
            return;
        }

        User admin = User.builder()
                .name("FixMate Admin")
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .phone("0000000000")
                .role(Role.ADMIN)
                .approved(true)
                .enabled(true)
                .build();

        userRepository.save(admin);
        System.out.println("=========================================================");
        System.out.println(" Default Admin created -> email: " + adminEmail + " | password: " + adminPassword);
        System.out.println(" Change this password after first login!");
        System.out.println("=========================================================");
    }
}
