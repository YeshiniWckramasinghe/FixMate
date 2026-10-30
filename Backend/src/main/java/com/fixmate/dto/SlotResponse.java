package com.fixmate.dto;

// time is "HH:mm", e.g. "09:00". available is false when the slot is already booked.
public record SlotResponse(String time, boolean available) {
}
