package com.fixmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DashboardStatsResponse {
    private long totalUsers;
    private long totalCustomers;
    private long totalProviders;
    private long pendingProviderApprovals;
    private long totalServices;
    private long totalBookings;
    private long pendingBookings;
    private long completedBookings;

    @Builder
    public DashboardStatsResponse(long totalUsers, long totalCustomers, long totalProviders,
                                  long pendingProviderApprovals, long totalServices, long totalBookings,
                                  long pendingBookings, long completedBookings) {
        this.totalUsers = totalUsers;
        this.totalCustomers = totalCustomers;
        this.totalProviders = totalProviders;
        this.pendingProviderApprovals = pendingProviderApprovals;
        this.totalServices = totalServices;
        this.totalBookings = totalBookings;
        this.pendingBookings = pendingBookings;
        this.completedBookings = completedBookings;
    }
}
