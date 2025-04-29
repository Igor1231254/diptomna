package com.carpooling.controller;

import com.carpooling.model.Trip;
import com.carpooling.model.User;
import com.carpooling.service.TripService;
import com.carpooling.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;
    private final UserService userService;

    public TripController(TripService tripService, UserService userService) {
        this.tripService = tripService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Trip>> getAllTrips() {
        return ResponseEntity.ok(tripService.getAllTrips());
    }

    @PostMapping("/search")
    public ResponseEntity<List<Trip>> searchTrips(@RequestBody SearchTripRequest request) {
        try {
            // Якщо не вказана дата, і користувач не задав явно дані для пошуку, повертаємо пустий список
            if (request.getDepartureDateTime() == null && 
                (request.getDepartureLocation() == null || request.getDepartureLocation().isEmpty() ||
                 request.getArrivalLocation() == null || request.getArrivalLocation().isEmpty())) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            
            List<Trip> trips = tripService.searchTrips(
                request.getDepartureLocation(),
                request.getArrivalLocation(),
                request.getDepartureDateTime()
            );
            return ResponseEntity.ok(trips);
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @PostMapping
    public ResponseEntity<?> createTrip(@RequestBody CreateTripRequest request) {
        try {
            // For testing, we'll use a default user (first one in DB) or create one if none exists
            User driver;
            try {
                driver = userService.getDefaultUser();
            } catch (Exception e) {
                // Create a default user if none exists
                driver = userService.registerUser(
                    "Default User",
                    "default@example.com",
                    "+380123456789",
                    "password"
                );
            }
            
            Trip trip = tripService.createTrip(
                driver,
                request.getDepartureLocation(),
                request.getArrivalLocation(),
                request.getDepartureDateTime(),
                request.getAvailableSeats(),
                request.getCarModel(),
                request.getPrice()
            );
            return ResponseEntity.ok(trip);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating trip: " + e.getMessage());
        }
    }

    @PostMapping("/{tripId}/book")
    public ResponseEntity<?> bookTrip(@PathVariable Long tripId) {
        try {
            // For testing, we'll use a default user
            User passenger = userService.getDefaultUser();
            tripService.bookTrip(tripId, passenger);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error booking trip: " + e.getMessage());
        }
    }

    @GetMapping("/booked")
    public ResponseEntity<List<Trip>> getBookedTrips() {
        try {
            // Для тестування використовуємо дефолтного користувача
            User user = userService.getDefaultUser();
            List<Trip> trips = tripService.getBookedTrips(user.getId());
            return ResponseEntity.ok(trips);
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @DeleteMapping("/{tripId}")
    public ResponseEntity<?> deleteTrip(@PathVariable Long tripId) {
        try {
            tripService.deleteTrip(tripId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting trip: " + e.getMessage());
        }
    }

    @PostMapping("/{tripId}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long tripId) {
        try {
            // Для тестування використовуємо дефолтного користувача
            User passenger = userService.getDefaultUser();
            tripService.cancelBooking(tripId, passenger);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error canceling booking: " + e.getMessage());
        }
    }

    public static class SearchTripRequest {
        private String departureLocation;
        private String arrivalLocation;
        private LocalDateTime departureDateTime;

        public String getDepartureLocation() {
            return departureLocation;
        }

        public void setDepartureLocation(String departureLocation) {
            this.departureLocation = departureLocation;
        }

        public String getArrivalLocation() {
            return arrivalLocation;
        }

        public void setArrivalLocation(String arrivalLocation) {
            this.arrivalLocation = arrivalLocation;
        }

        public LocalDateTime getDepartureDateTime() {
            return departureDateTime;
        }

        public void setDepartureDateTime(LocalDateTime departureDateTime) {
            this.departureDateTime = departureDateTime;
        }
    }

    public static class CreateTripRequest {
        private String departureLocation;
        private String arrivalLocation;
        private LocalDateTime departureDateTime;
        private Integer availableSeats;
        private String carModel;
        private Double price;

        public String getDepartureLocation() {
            return departureLocation;
        }

        public void setDepartureLocation(String departureLocation) {
            this.departureLocation = departureLocation;
        }

        public String getArrivalLocation() {
            return arrivalLocation;
        }

        public void setArrivalLocation(String arrivalLocation) {
            this.arrivalLocation = arrivalLocation;
        }

        public LocalDateTime getDepartureDateTime() {
            return departureDateTime;
        }

        public void setDepartureDateTime(LocalDateTime departureDateTime) {
            this.departureDateTime = departureDateTime;
        }

        public Integer getAvailableSeats() {
            return availableSeats;
        }

        public void setAvailableSeats(Integer availableSeats) {
            this.availableSeats = availableSeats;
        }

        public String getCarModel() {
            return carModel;
        }

        public void setCarModel(String carModel) {
            this.carModel = carModel;
        }

        public Double getPrice() {
            return price;
        }

        public void setPrice(Double price) {
            this.price = price;
        }
    }
} 