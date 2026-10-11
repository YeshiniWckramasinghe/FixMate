package com.fixmate.service;

import com.fixmate.dto.AuthResponse;
import com.fixmate.dto.LoginRequest;
import com.fixmate.dto.RegisterRequest;
import com.fixmate.entity.Role;
import com.fixmate.entity.User;
import com.fixmate.exception.BadRequestException;
import com.fixmate.repository.UserRepository;
import com.fixmate.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        if (request.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be self-registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                // Providers must be approved by an Admin before they can list services
                .approved(request.getRole() != Role.PROVIDER)
                .enabled(true)
                .build();

        User saved = userRepository.save(user);

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(saved.getEmail())
                .password(saved.getPassword())
                .authorities("ROLE_" + saved.getRole().name())
                .build();

        String token = jwtUtil.generateToken(userDetails, saved.getId(), saved.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String token = jwtUtil.generateToken(userDetails, user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
