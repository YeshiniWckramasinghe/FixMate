package com.fixmate.controller;

import com.fixmate.dto.ApiResponse;
import com.fixmate.dto.BookingResponse;
import com.fixmate.dto.DashboardStatsResponse;
import com.fixmate.dto.UserResponse;
import com.fixmate.entity.Role;
import com.fixmate.service.AdminService;
import com.fixmate.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final BookingService bookingService;

    @GetMapping("/users")
    public List<UserResponse> getAllUsers(@RequestParam(required = false) Role role) {
        if (role != null) {
            return adminService.getUsersByRole(role);
        }
        return adminService.getAllUsers();
    }

    @PutMapping("/providers/{id}/approve")
    public UserResponse approveProvider(@PathVariable Long id) {
        return adminService.approveProvider(id);
    }

    @PutMapping("/users/{id}/enable")
    public UserResponse enableUser(@PathVariable Long id) {
        return adminService.setUserEnabled(id, true);
    }

    @PutMapping("/users/{id}/disable")
    public UserResponse disableUser(@PathVariable Long id) {
        return adminService.setUserEnabled(id, false);
    }

    @DeleteMapping("/users/{id}")
    public ApiResponse deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ApiResponse.of(true, "User deleted successfully");
    }

    @GetMapping("/bookings")
    public List<BookingResponse> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @GetMapping("/dashboard")
    public DashboardStatsResponse getDashboard() {
        return adminService.getDashboardStats();
    }
}
