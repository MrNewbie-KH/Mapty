'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-9);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
  _setDescription() {
    // prettier-ignore =>
    // to tell prettier not to format a line
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } #${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
// =====================================================================================
// the main APP ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    // to get position
    this._getPosition();
    // to get local storage from local storage API
    this._getLocalStorage();
    // handling
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    // input of this function is two callback Functions   1->success callBack  2->error callback

    //                                ======================= API geolocation ===========================
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('couldnot get your position');
        }
      );
  }
  _loadMap(position) {
    // we make it as object to destruct the attribute instead of
    // latitude =position.coords.latitude
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    // next ccords is the array of longitude and latitude =>
    // L.map is a map factory
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // this on instead of addEventListner to handle clicks on map
    this.#map.on('click', this._showForm.bind(this));
    // ====================================
    // we have to call it here because the map must be rendered first
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      // not working cuz of sync => map not created
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus(); //this one when you click the input distance field is activated}
  }
  _hideForm() {
    // Empty inputs
    inputCadence.value =
      inputDuration.value =
      inputDistance.value =
      inputElevation.value =
        '';
    // hide form immediately
    form.style.display = 'none';
    // add hidden
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 100);
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // some helper functions
    // 1 validate number
    const validateInput = (...inputs) =>
      inputs.every(one => Number.isFinite(one));
    // 2 validate positive
    const isPositive = (...inputs) => inputs.every(one => one > 0);
    e.preventDefault();
    //          --- ALL THE LOGIC TO BE IMPLEMENTED new workout---
    // 1-Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // 3-if Running -> create running object
    if (type === 'running') {
      const cadance = +inputCadence.value;
      // validate
      if (
        !validateInput(duration, cadance, distance) ||
        !isPositive(duration, cadance, distance)
      ) {
        return alert('Inputs have to be positive numbers!');
      }
      workout = new Running(distance, duration, [lat, lng], cadance);
    }
    // 4-if Cycling -> create Cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validateInput(duration, elevation, distance) ||
        !isPositive(duration, distance)
      ) {
        return alert('Please enter a valid number');
      }
      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }
    // 5-Add new object to Workout Array which will be shown
    this.#workouts.push(workout);
    console.log(workout);
    // 6-Render workout on map as a marker
    this._renderWorkoutMarker(workout);
    // 7-Render workout to the list of works
    this._renderWorkout(workout);
    // 8-Hide form + clear input fields
    this._hideForm();
    // 9-set local storage
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      Animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
// ------------------      launch our app      --------------------------
const app = new App();
// app.reset();
