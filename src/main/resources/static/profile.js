document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    
    loadUserTrips();
    
    document.getElementById('logoutLink').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    setupPhotoUpload();
});

async function loadUserProfile() {
    try {
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');
        const userPhone = localStorage.getItem('userPhone');

        if (!userName || !userEmail) {
            window.location.href = '/login.html';
            return;
        }
        
        document.getElementById('userName').textContent = userName;
        document.getElementById('userEmail').textContent = userEmail;
        document.getElementById('userPhone').textContent = userPhone || '+380XXXXXXXXX';
        
    } catch (error) {
        console.error('Помилка при завантаженні профілю:', error);
    }
}

async function loadUserTrips() {
    try {
        const createdResponse = await fetch('/api/trips');
        if (createdResponse.ok) {
            const createdTrips = await createdResponse.json();
            displayCreatedTrips(createdTrips);
        }
        
        const bookedResponse = await fetch('/api/trips/booked');
        if (bookedResponse.ok) {
            const bookedTrips = await bookedResponse.json();
            displayBookedTrips(bookedTrips);
        }
    } catch (error) {
        console.error('Помилка при завантаженні поїздок:', error);
    }
}

function displayCreatedTrips(trips) {
    const tripsList = document.getElementById('createdTripsList');
    tripsList.innerHTML = '';

    if (!trips || trips.length === 0) {
        tripsList.innerHTML = '<p>У вас ще немає створених поїздок</p>';
        return;
    }

    trips.forEach(trip => {
        const tripElement = document.createElement('div');
        tripElement.className = 'card mb-2';
        tripElement.innerHTML = `
            <div class="card-body">
                <h6>${trip.departureLocation} → ${trip.arrivalLocation}</h6>
                <p class="mb-1">Дата: ${new Date(trip.departureDateTime).toLocaleString()}</p>
                <p class="mb-1">Вільних місць: ${trip.availableSeats}</p>
                <p class="mb-1">Авто: ${trip.carModel}</p>
                <p class="mb-1">Ціна: ${trip.price} грн</p>
                <button class="btn btn-danger btn-sm" onclick="deleteTrip(${trip.id})">Видалити</button>
            </div>
        `;
        tripsList.appendChild(tripElement);
    });
}

function displayBookedTrips(trips) {
    const tripsList = document.getElementById('bookedTripsList');
    tripsList.innerHTML = '';

    if (!trips || trips.length === 0) {
        tripsList.innerHTML = '<p>У вас ще немає заброньованих поїздок</p>';
        return;
    }

    trips.forEach(trip => {
        const tripElement = document.createElement('div');
        tripElement.className = 'card mb-2';
        
        const departureDate = new Date(trip.departureDateTime);
        const formattedDate = departureDate.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const formattedTime = departureDate.toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit'
        });

        tripElement.innerHTML = `
            <div class="card-body">
                <h6>${trip.departureLocation} → ${trip.arrivalLocation}</h6>
                <div class="row">
                    <div class="col-md-6">
                        <p class="mb-1">Дата: ${formattedDate}</p>
                        <p class="mb-1">Час: ${formattedTime}</p>
                        <p class="mb-1">Авто: ${trip.carModel}</p>
                        <p class="mb-1">Ціна: ${trip.price} грн</p>
                    </div>
                    <div class="col-md-6">
                        <div class="driver-info p-2 bg-light rounded">
                            <h6 class="mb-2"><i class="bi bi-person-circle me-2"></i>Інформація про водія:</h6>
                            <p class="mb-1"><strong>Ім'я:</strong> ${trip.driver ? trip.driver.name : 'Не вказано'}</p>
                            <p class="mb-1"><strong>Телефон:</strong> ${trip.driver ? trip.driver.phone : 'Не вказано'}</p>
                        </div>
                    </div>
                </div>
                <div class="mt-2">
                    <button class="btn btn-secondary btn-sm" onclick="cancelBooking(${trip.id})">Скасувати бронювання</button>
                </div>
            </div>
        `;
        tripsList.appendChild(tripElement);
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showConfirmDialog(message, confirmButtonText = 'Видалити') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog';
        
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        dialog.appendChild(messageElement);
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'buttons';
        
        const confirmButton = document.createElement('button');
        confirmButton.className = 'confirm-btn';
        confirmButton.textContent = confirmButtonText;
        confirmButton.onclick = () => {
            document.body.removeChild(overlay);
            resolve(true);
        };
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-btn';
        cancelButton.textContent = 'Відміна';
        cancelButton.onclick = () => {
            document.body.removeChild(overlay);
            resolve(false);
        };
        
        buttonsContainer.appendChild(cancelButton);
        buttonsContainer.appendChild(confirmButton);
        dialog.appendChild(buttonsContainer);
        
        overlay.appendChild(dialog);
        
        document.body.appendChild(overlay);
    });
}

async function deleteTrip(tripId) {
    const confirmed = await showConfirmDialog('Ви впевнені, що хочете видалити цю поїздку?', 'Видалити');
    if (confirmed) {
        fetch(`/api/trips/${tripId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                showNotification('Поїздку успішно видалено', 'success');
                loadUserTrips();
            } else {
                showNotification('Помилка при видаленні поїздки', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Помилка при видаленні поїздки', 'error');
        });
    }
}

async function cancelBooking(tripId) {
    const confirmed = await showConfirmDialog('Ви впевнені, що хочете скасувати бронювання?', 'Скасувати');
    if (confirmed) {
        fetch(`/api/trips/${tripId}/cancel`, {
            method: 'POST'
        })
        .then(response => {
            if (response.ok) {
                showNotification('Бронювання успішно скасовано', 'success');
                loadUserTrips();
            } else {
                showNotification('Помилка при скасуванні бронювання', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Помилка при скасуванні бронювання', 'error');
        });
    }
}

function logout() {
    window.location.href = '/';
}

function setupPhotoUpload() {
    const photoInput = document.getElementById('photoInput');
    const userPhoto = document.getElementById('userPhoto');
    const deleteOverlay = document.getElementById('deletePhotoOverlay');

    const savedPhoto = localStorage.getItem('userProfilePhoto');
    if (savedPhoto) {
        userPhoto.src = savedPhoto;
    }

    deleteOverlay.addEventListener('click', async function() {
        const confirmed = await showConfirmDialog('Ви впевнені, що хочете видалити фото профілю?', 'Видалити');
        if (confirmed) {
            localStorage.removeItem('userProfilePhoto');
            userPhoto.src = 'https://via.placeholder.com/150';
            showNotification('Фото профілю видалено', 'success');
        }
    });

    photoInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { 
                showNotification('Розмір файлу не повинен перевищувати 5MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                userPhoto.src = e.target.result;
                localStorage.setItem('userProfilePhoto', e.target.result);
                showNotification('Фото профілю успішно оновлено', 'success');
            };
            reader.onerror = function() {
                showNotification('Помилка при завантаженні фото', 'error');
            };
            reader.readAsDataURL(file);
        }
    });
} 
