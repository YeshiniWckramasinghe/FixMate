package com.fixmate.service;

import com.fixmate.entity.PasswordResetToken;
import com.fixmate.entity.User;
import com.fixmate.exception.BadRequestException;
import com.fixmate.repository.PasswordResetTokenRepository;
import com.fixmate.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final long EXPIRY_MINUTES = 30;
    private static final String INVALID_LINK = "This reset link is invalid or has expired.";

    private final SecureRandom secureRandom = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String frontendUrl;
    private final String mailFrom;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
            @Value("${spring.mail.username:}") String mailFrom) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSenderProvider = mailSenderProvider;
        this.frontendUrl = frontendUrl;
        this.mailFrom = mailFrom;
    }

    // Always behaves the same from the caller's point of view, whether or not the email
    // exists, so nobody can use this endpoint to find out which emails are registered.
    @Transactional
    public void requestReset(String email) {
        Optional<User> found = userRepository.findByEmail(email.trim());
        if (found.isEmpty() || !found.get().isEnabled()) {
            return;
        }
        User user = found.get();

        // One active reset link per user: a new request invalidates the old one
        tokenRepository.deleteByUser(user);

        String rawToken = generateToken();
        tokenRepository.save(new PasswordResetToken(
                user, hash(rawToken), LocalDateTime.now().plusMinutes(EXPIRY_MINUTES)));

        sendResetLink(user, rawToken);
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = tokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new BadRequestException(INVALID_LINK));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException(INVALID_LINK);
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Single use: remove the token (and any other reset tokens) once it has worked
        tokenRepository.deleteByUser(user);
    }

    private void sendResetLink(User user, String rawToken) {
        String link = frontendUrl + "/reset-password?token=" + rawToken;

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            // Development mode: no SMTP configured, so show the link in the backend console instead
            log.warn("Mail is not configured. Password reset link for {}: {}", user.getEmail(), link);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (!mailFrom.isBlank()) {
                message.setFrom(mailFrom);
            }
            message.setTo(user.getEmail());
            message.setSubject("Reset your FixMate password");
            message.setText("Hi " + user.getName() + ",\n\n"
                    + "We got a request to reset your FixMate password. Open this link to choose a new one:\n\n"
                    + link + "\n\n"
                    + "The link works for " + EXPIRY_MINUTES + " minutes and can only be used once. "
                    + "If you didn't ask for this, you can ignore this email.");
            mailSender.send(message);
        } catch (MailException e) {
            // Don't tell the caller: the response must look the same whether or not an email was sent
            log.error("Could not send password reset email to {}", user.getEmail(), e);
        }
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}