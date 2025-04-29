package com.carpooling.repository;

import com.carpooling.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByDepartureLocationAndArrivalLocationAndDepartureDateTimeGreaterThanEqual(
        String departureLocation, String arrivalLocation, LocalDateTime departureDateTime);
    
    List<Trip> findByDepartureLocationAndArrivalLocation(
        String departureLocation, String arrivalLocation);
        
    List<Trip> findByDepartureLocationAndArrivalLocationAndDepartureDateTimeBetween(
        String departureLocation, String arrivalLocation, 
        LocalDateTime startDateTime, LocalDateTime endDateTime);
} 