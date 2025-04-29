document.addEventListener('DOMContentLoaded', function() {
    // Перевірка автентифікації
    //checkAuth();

    // Показуємо інформаційне повідомлення замість завантаження всіх поїздок
    showWelcomeMessage();

    // Обробка форми пошуку
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        searchTrips();
    });

    // Обробка форми створення поїздки
    document.getElementById('createTripForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createTrip(e);
    });

    // Обробка виходу
    document.getElementById('logoutLink').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Обробка переходу до профілю
    document.getElementById('profileLink').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/profile.html';
    });

    // Очищаємо список поїздок при завантаженні
    clearTripsList();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
}

function showWelcomeMessage() {
    const tripsList = document.getElementById('tripsList');
    tripsList.innerHTML = '<p>Будь ласка, введіть параметри пошуку поїздки для відображення результатів</p>';
}

async function getAllTrips() {
    try {
        const response = await fetch('/api/trips');
        if (response.ok) {
            const trips = await response.json();
            displayTrips(trips);
        }
    } catch (error) {
        console.error('Error fetching trips:', error);
    }
}

async function searchTrips() {
    const form = document.getElementById('searchForm');
    
    // Отримуємо значення з форми за допомогою атрибутів name
    const departureLocation = form.elements['departureLocation'].value;
    const arrivalLocation = form.elements['arrivalLocation'].value;
    const dateInput = form.elements['date'];
    
    let departureDateTime = null;
    
    // Перевіряємо, чи заповнена дата
    if (dateInput.value) {
        // Додаємо будь-який час (полудень), оскільки на сервері ми ігноруємо час
        departureDateTime = new Date(`${dateInput.value}T12:00:00`);
        console.log('Search date:', departureDateTime);
    }
    
    const searchData = {
        departureLocation: departureLocation,
        arrivalLocation: arrivalLocation,
        departureDateTime: departureDateTime ? departureDateTime.toISOString() : null
    };
    
    console.log('Search data:', JSON.stringify(searchData));
    
    try {
        const response = await fetch('/api/trips/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchData)
        });

        if (response.ok) {
            const trips = await response.json();
            console.log('Search results:', trips);
            displayTrips(trips);
        } else {
            alert('Помилка при пошуку поїздок');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Помилка при пошуку поїздок');
    }
}

function displayTrips(trips) {
    const tripsList = document.getElementById('tripsList');
    tripsList.innerHTML = '';
    
    if (trips.length === 0) {
        tripsList.innerHTML = '<p class="text-center">Поїздок не знайдено</p>';
        return;
    }
    
    trips.forEach(trip => {
        const tripElement = document.createElement('div');
        tripElement.className = 'trip-item';
        
        // Додаємо статус, якщо немає вільних місць
        if (trip.availableSeats === 0) {
            const statusBadge = document.createElement('div');
            statusBadge.className = 'trip-status no-seats';
            statusBadge.textContent = 'Немає вільних місць';
            tripElement.appendChild(statusBadge);
        }
        
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
        
        tripElement.innerHTML += `
            <h5>Маршрут: ${trip.departureLocation} - ${trip.arrivalLocation}</h5>
            <p>Дата: ${formattedDate}</p>
            <p>Час: ${formattedTime}</p>
            <p>Вільних місць: ${trip.availableSeats}</p>
            <p>Модель авто: ${trip.carModel}</p>
            <p>Ціна: ${trip.price} грн</p>
            ${trip.availableSeats > 0 ? 
                `<button class="btn btn-primary" onclick="bookTrip(${trip.id})">Забронювати</button>` :
                '<button class="btn btn-secondary" disabled>Заброньовано</button>'
            }
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

function clearTripsList() {
    const tripsList = document.getElementById('tripsList');
    tripsList.innerHTML = '<p class="text-center">Введіть параметри пошуку, щоб знайти поїздки</p>';
}

function createTrip(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const date = formData.get('date');
    const time = formData.get('time');
    const dateTime = new Date(date + 'T' + time);
    
    const tripData = {
        departureLocation: formData.get('departureLocation'),
        arrivalLocation: formData.get('arrivalLocation'),
        departureDateTime: dateTime.toISOString(),
        availableSeats: parseInt(formData.get('availableSeats')),
        carModel: formData.get('carModel'),
        price: parseFloat(formData.get('price'))
    };

    fetch('/api/trips', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tripData)
    })
    .then(response => {
        if (response.ok) {
            showNotification('Поїздку успішно створено!', 'success');
            form.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('createTripModal'));
            modal.hide();
            // Не оновлюємо список поїздок автоматично
            clearTripsList();
        } else {
            showNotification('Помилка при створенні поїздки', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Помилка при створенні поїздки', 'error');
    });
}

function bookTrip(tripId) {
    fetch(`/api/trips/${tripId}/book`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            showNotification('Поїздку успішно заброньовано!', 'success');
            getAllTrips();
        } else {
            showNotification('Помилка при бронюванні поїздки', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Помилка при бронюванні поїздки', 'error');
    });
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
} 