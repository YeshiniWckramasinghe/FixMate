package com.fixmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalUsers;
    private long totalCustomers;
    private long totalProviders;
    private long pendingProviderApprovals;
    private long totalServices;
    private long totalBookings;
    private long pendingBookings;
    private long completedBookings;
}
