package com.carpooling.controller;

import com.carpooling.model.Review;
import com.carpooling.model.User;
import com.carpooling.service.ReviewService;
import com.carpooling.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final ReviewService reviewService;

    public UserController(UserService userService, ReviewService reviewService) {
        this.userService = userService;
        this.reviewService = reviewService;
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(user);
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            Authentication authentication,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) MultipartFile photo) {
        
        User user = userService.getUserByEmail(authentication.getName());
        User updatedUser = userService.updateProfile(user.getId(), name, phone, photo);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<Review>> getUserReviews(Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        List<Review> reviews = reviewService.getUserReviews(user.getId());
        return ResponseEntity.ok(reviews);
    }

    @PostMapping("/{userId}/reviews")
    public ResponseEntity<Review> createReview(
            @PathVariable Long userId,
            @RequestBody CreateReviewRequest request,
            Authentication authentication) {
        
        User reviewer = userService.getUserByEmail(authentication.getName());
        User user = userService.getUserById(userId);
        
        Review review = reviewService.createReview(
            user,
            reviewer,
            request.getRating(),
            request.getComment()
        );
        
        return ResponseEntity.ok(review);
    }

    public static class CreateReviewRequest {
        private Integer rating;
        private String comment;

        public Integer getRating() {
            return rating;
        }

        public void setRating(Integer rating) {
            this.rating = rating;
        }

        public String getComment() {
            return comment;
        }

        public void setComment(String comment) {
            this.comment = comment;
        }
    }
} 