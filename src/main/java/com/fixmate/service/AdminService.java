package com.fixmate.service;

import com.fixmate.dto.DashboardStatsResponse;
import com.fixmate.dto.UserResponse;
import com.fixmate.entity.BookingStatus;
import com.fixmate.entity.Role;
import com.fixmate.entity.User;
import com.fixmate.exception.BadRequestException;
import com.fixmate.exception.ResourceNotFoundException;
import com.fixmate.repository.BookingRepository;
import com.fixmate.repository.ReviewRepository;
import com.fixmate.repository.ServiceRepository;
import com.fixmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    @Transactional
    public UserResponse approveProvider(Long userId) {
        User user = findUserOrThrow(userId);
        if (user.getRole() != Role.PROVIDER) {
            throw new BadRequestException("User is not a provider");
        }
        user.setApproved(true);
        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserResponse setUserEnabled(Long userId, boolean enabled) {
        User user = findUserOrThrow(userId);
        user.setEnabled(enabled);
        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = findUserOrThrow(userId);
        userRepository.delete(user);
    }

    public DashboardStatsResponse getDashboardStats() {
        List<User> allUsers = userRepository.findAll();
        long totalCustomers = allUsers.stream().filter(u -> u.getRole() == Role.CUSTOMER).count();
        long totalProviders = allUsers.stream().filter(u -> u.getRole() == Role.PROVIDER).count();
        long pendingApprovals = allUsers.stream()
                .filter(u -> u.getRole() == Role.PROVIDER && !u.isApproved())
                .count();

        long totalBookings = bookingRepository.count();
        long pendingBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING)
                .count();
        long completedBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .count();

        return DashboardStatsResponse.builder()
                .totalUsers(allUsers.size())
                .totalCustomers(totalCustomers)
                .totalProviders(totalProviders)
                .pendingProviderApprovals(pendingApprovals)
                .totalServices(serviceRepository.count())
                .totalBookings(totalBookings)
                .pendingBookings(pendingBookings)
                .completedBookings(completedBookings)
                .build();
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
}
