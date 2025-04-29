package com.carpooling.service;

import com.carpooling.model.Trip;
import com.carpooling.model.User;
import com.carpooling.repository.TripRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Service
public class TripService {

    private final TripRepository tripRepository;

    public TripService(TripRepository tripRepository) {
        this.tripRepository = tripRepository;
    }

    public List<Trip> searchTrips(String departureLocation, String arrivalLocation, LocalDateTime departureDateTime) {
        if (departureDateTime == null) {
            // Якщо дата не вказана, шукаємо тільки за локаціями
            return tripRepository.findByDepartureLocationAndArrivalLocation(departureLocation, arrivalLocation);
        } else {
            // Якщо дата вказана, шукаємо поїздки на цю дату (ігноруючи час)
            LocalDate searchDate = departureDateTime.toLocalDate();
            LocalDateTime startOfDay = searchDate.atStartOfDay();
            LocalDateTime endOfDay = searchDate.atTime(23, 59, 59);
            
            return tripRepository.findByDepartureLocationAndArrivalLocationAndDepartureDateTimeBetween(
                departureLocation, arrivalLocation, startOfDay, endOfDay);
        }
    }

    @Transactional
    public Trip createTrip(User driver, String departureLocation, String arrivalLocation,
                          LocalDateTime departureDateTime, Integer availableSeats,
                          String carModel, Double price) {
        Trip trip = new Trip();
        trip.setDriver(driver);
        trip.setDepartureLocation(departureLocation);
        trip.setArrivalLocation(arrivalLocation);
        trip.setDepartureDateTime(departureDateTime);
        trip.setAvailableSeats(availableSeats);
        trip.setCarModel(carModel);
        trip.setPrice(price);

        return tripRepository.save(trip);
    }

    @Transactional
    public Trip bookTrip(Long tripId, User passenger) {
        Trip trip = getTrip(tripId);

        if (trip.getAvailableSeats() <= 0) {
            throw new RuntimeException("No available seats");
        }

        // Додаємо пасажира до списку
        trip.getPassengers().add(passenger);
        
        // Зменшуємо кількість доступних місць
        trip.setAvailableSeats(trip.getAvailableSeats() - 1);
        return tripRepository.save(trip);
    }

    public void deleteTrip(Long tripId) {
        Trip trip = getTrip(tripId);
        tripRepository.delete(trip);
    }

    private Trip getTrip(Long tripId) {
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
    }
    
    public List<Trip> getAllTrips() {
        return tripRepository.findAll();
    }

    public List<Trip> getBookedTrips(Long userId) {
        // Ми використовуємо спрощений підхід для демонстрації 
        // В реальному додатку краще використовувати окремий репозиторій для бронювань
        return tripRepository.findAll().stream()
               .filter(trip -> trip.getPassengers().stream()
                    .anyMatch(user -> user.getId().equals(userId)))
               .toList();
    }
    
    @Transactional
    public Trip cancelBooking(Long tripId, User passenger) {
        Trip trip = getTrip(tripId);
        
        // Перевіряємо, чи є користувач серед пасажирів
        boolean removed = trip.getPassengers().removeIf(user -> user.getId().equals(passenger.getId()));
        
        if (!removed) {
            throw new RuntimeException("User is not a passenger of this trip");
        }
        
        // Збільшуємо кількість доступних місць
        trip.setAvailableSeats(trip.getAvailableSeats() + 1);
        return tripRepository.save(trip);
    }
} 