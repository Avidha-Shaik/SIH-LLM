// --- Global State ---
let currentQuestionIndex = 0;
let userAnswers = {};

// --- Data ---
const questions = [
  {
    question:
      "Hey, what subjects do you find super interesting or fun in school?",
    options: ["Science", "Mathematics", "Arts", "Commerce"],
    id: "q1",
  },
  {
    question:
      "Imagine you're working on a cool project – would you love it to be more about:",
    options: [
      "Solving puzzles with numbers",
      "Creating something artistic",
      "Figuring out how things work",
      "Exploring ideas with friends",
    ],
    id: "q2",
  },
  {
    question: "Do you think you'd enjoy a career where you're mostly:",
    options: [
      "Learning new tech stuff",
      "Working with people",
      "Doing something creative(like designing)",
      "Exploring nature or environment",
    ],
    id: "q3",
  },
  {
    question: "When you tackle a problem, do you like:",
    options: [
      "Breaking it down step-by-step logically",
      "Going with your gut feeling and creativity",
      "Asking others for a different perspective",
      "Mixing both logic and creativity",
    ],
    id: "q4",
  },
  {
    question: "Are you someone who prefers:",
    options: [
      "Hands-on activities and making things",
      "Reading and discussing ideas",
      "Observing and analyzing before acting",
      "Mixing both practical and theoretical approaches",
    ],
    id: "q5",
  },
  {
    question: "Would you rather:",
    options: [
      "Work on a team project",
      "Go solo on something you're passionate about",
      "Start alone and then collaborate",
      "Support others as they lead",
    ],
    id: "q6",
  },
  {
    question: "If you could pick any job in the world, what would it be?",
    options: [
      "Scientist",
      "Engineer",
      "Writer",
      "Designer/Artist",
      "Entrepreneur",
      "Teacher",
      "Doctor",
      "Environmentalist",
    ],
    id: "q7",
  },
  {
    question:
      "Do careers like Data Science, Environmental Work, or AI sound exciting?",
    options: [
      "Very exciting",
      "Somewhat exciting",
      "Not sure",
      "Not really my interest",
    ],
    id: "q8",
  },
  {
    question:
      "How important are skills like problem-solving, communication, or creativity for you?",
    options: [
      "Very important",
      "Important",
      "Somewhat important",
      "Not that important",
    ],
    id: "q9",
  },
  {
    question: "What do you think are your top strengths in school?",
    options: [
      "Strong subject knowledge",
      "Practical skills",
      "Problem-solving mindset",
      "Teamwork and communication",
    ],
    id: "q10",
  },
  {
    question: "Do you have any hobbies that connect to a future career?",
    options: [
      "Coding/Tech",
      "Arts(Drawing, music, writing)",
      "Sports/Outdoor",
      "Other hobbies",
    ],
    id: "q11",
  },
  {
    question: "When facing a tough challenge, do you prefer:",
    options: [
      "Figuring it out yourself",
      "Asking friends for help",
      "Looking for resources online",
      "Combining all approaches",
    ],
    id: "q12",
  },
];

// --- DOM Elements ---
const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");
const startAssessmentBtn = document.getElementById("start-assessment-btn");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");
const restartAssessmentBtn = document.getElementById("restart-assessment-btn");
const recommendationsContainer = document.getElementById(
  "recommendations-container"
);
const coursesWrapper = document.getElementById("courses-wrapper");
const coursesContainer = document.getElementById("courses-container");
const collegeFilterForm = document.getElementById("college-filter-form");
const collegesContainer = document.getElementById("colleges-container");
const loginForm = document.getElementById("login-form");
const authLink = document.getElementById("auth-link");
const loadingOverlay = document.getElementById("loading-overlay");
const toastEl = document.getElementById("toast");
const useMyLocationBtn = document.getElementById("use-my-location");
const radiusKmSelect = document.getElementById("radius-km");
const nearbyWrapper = document.getElementById("nearby-wrapper");
const nearbyCollegesContainer = document.getElementById("nearby-colleges");

// --- Page Navigation Functions ---
function showPage(id) {
  pages.forEach((page) => {
    page.classList.remove("active");
  });
  navLinks.forEach((link) => {
    link.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
  const correspondingLink = document.querySelector(`a[href="#${id}"]`);
  if (correspondingLink) {
    correspondingLink.classList.add("active");
  }
}

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const pageId = link.getAttribute("href").substring(1);
    showPage(pageId);
  });
});

startAssessmentBtn.addEventListener("click", () => {
  showPage("assessment");
  loadQuestion();
});

restartAssessmentBtn.addEventListener("click", () => {
  currentQuestionIndex = 0;
  userAnswers = {};
  showPage("assessment");
  loadQuestion();
});

// --- Assessment Functions ---
function loadQuestion() {
  const currentQuestion = questions[currentQuestionIndex];
  questionText.textContent = currentQuestion.question;
  optionsContainer.innerHTML = "";

  currentQuestion.options.forEach((option, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "option";
    const radioInput = document.createElement("input");
    radioInput.type = "radio";
    radioInput.name = currentQuestion.id;
    radioInput.value = option;
    radioInput.id = `${currentQuestion.id}-option-${index}`;
    radioInput.checked = userAnswers[currentQuestion.id] === option;
    radioInput.addEventListener("change", (e) => {
      userAnswers[currentQuestion.id] = e.target.value;
    });

    const label = document.createElement("label");
    label.htmlFor = radioInput.id;
    label.textContent = option;

    optionDiv.appendChild(radioInput);
    optionDiv.appendChild(label);
    optionsContainer.appendChild(optionDiv);
  });

  updateNavigationButtons();
}

function updateNavigationButtons() {
  prevBtn.classList.toggle("hidden", currentQuestionIndex === 0);
  nextBtn.classList.toggle(
    "hidden",
    currentQuestionIndex === questions.length - 1
  );
  submitBtn.classList.toggle(
    "hidden",
    currentQuestionIndex !== questions.length - 1
  );
}

prevBtn.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    loadQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    loadQuestion();
  }
});

submitBtn.addEventListener("click", async () => {
  await submitQuiz();
});

async function submitQuiz() {
  // Send all collected answers to the backend
  try {
    showLoader(true);

    // Try to get user location for nearby college suggestions
    let userLocation = null;
    try {
      const coords = await getBrowserLocation();
      userLocation = { latitude: coords.lat, longitude: coords.lon };
      console.log("User location detected:", userLocation);
    } catch (e) {
      console.log("Could not get user location:", e.message);
      // Try to get location from city input as fallback
      const cityCoords = getCoordsFromCityInput();
      if (cityCoords) {
        userLocation = { latitude: cityCoords.lat, longitude: cityCoords.lon };
        console.log("Using city coordinates as fallback:", userLocation);
      } else {
        console.log("No location available - nearby colleges will be disabled");
      }
    }

    const response = await fetch("http://127.0.0.1:5000/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: userAnswers,
        location: userLocation,
      }),
    });
    const data = await response.json();

    // Display recommendations
    displayRecommendations(data.recommendations);

    // Display courses
    const fallbackCourses = generateCoursesFromRecommendations(
      data.recommendations || []
    );
    const courses =
      Array.isArray(data.courses) && data.courses.length > 0
        ? data.courses
        : fallbackCourses;
    displayCourses(courses);

    // Display nearby colleges from Geoapify API
    console.log("Backend response data:", data);
    console.log("Nearby colleges data:", data.nearby_colleges);
    console.log(
      "Nearby colleges length:",
      data.nearby_colleges ? data.nearby_colleges.length : "undefined"
    );

    if (data.nearby_colleges && data.nearby_colleges.length > 0) {
      console.log(
        "Displaying nearby colleges from backend:",
        data.nearby_colleges
      );
      displayNearbyColleges(data.nearby_colleges);
    } else {
      console.log("No nearby colleges from backend, using local fallback");
      // Fallback to local college search
      await autoShowNearbyAfterQuiz();
    }

    showPage("recommendations");
  } catch (error) {
    console.error("Error submitting quiz:", error);
    recommendationsContainer.innerHTML =
      "<p>Could not connect to the server. Please try again later.</p>";
    showPage("recommendations");
    showToast("We couldn't fetch recommendations. Check your connection.");
  } finally {
    showLoader(false);
  }
}

function displayRecommendations(recs) {
  recommendationsContainer.innerHTML = "";
  if (!recs || recs.length === 0) {
    recommendationsContainer.innerHTML =
      "<p>No recommendations were found based on your answers.</p>";
    return;
  }

  // Now loop through each recommendation to create a card
  recs.forEach((rec) => {
    const recCard = document.createElement("div");
    recCard.className = "result-card";
    recCard.innerHTML = `
            <h3>${rec.title}</h3>
            <p class="match-score">Match Score: ${rec.score}</p>
            <p>${rec.description}</p>
        `;
    recommendationsContainer.appendChild(recCard);
  });
}

function displayCourses(courses) {
  if (!courses || courses.length === 0) {
    if (coursesWrapper) coursesWrapper.style.display = "none";
    return;
  }
  coursesContainer.innerHTML = "";
  courses.forEach((course) => {
    const div = document.createElement("div");
    div.className = "result-card";
    div.innerHTML = `
            <h3>${course.title}</h3>
            <p>${course.description || ""}</p>
            ${
              course.eligibility
                ? `<p><strong>Eligibility:</strong> ${course.eligibility}</p>`
                : ""
            }
            ${
              course.entrance
                ? `<p><strong>Entrance:</strong> ${course.entrance}</p>`
                : ""
            }
            ${
              course.career_scope
                ? `<p><strong>Scope:</strong> ${course.career_scope}</p>`
                : ""
            }
        `;
    coursesContainer.appendChild(div);
  });
  coursesWrapper.style.display = "block";
}

function displayNearbyColleges(colleges) {
  if (!colleges || colleges.length === 0) {
    if (nearbyWrapper) nearbyWrapper.style.display = "none";
    return;
  }

  if (nearbyCollegesContainer) {
    nearbyCollegesContainer.innerHTML = "";
    colleges.forEach((college) => {
      const div = document.createElement("div");
      div.className = "result-card";
      div.innerHTML = `
        <h3>${college.name}</h3>
        <p><strong>Address:</strong> ${college.address}</p>
        ${
          college.distance
            ? `<p><strong>Distance:</strong> ${college.distance.toFixed(
                1
              )} km</p>`
            : ""
        }
        ${
          college.website
            ? `<p><strong>Website:</strong> <a href="${college.website}" target="_blank">${college.website}</a></p>`
            : ""
        }
        ${
          college.phone ? `<p><strong>Phone:</strong> ${college.phone}</p>` : ""
        }
        ${
          college.categories && college.categories.length > 0
            ? `<p><strong>Categories:</strong> ${college.categories.join(
                ", "
              )}</p>`
            : ""
        }
      `;
      nearbyCollegesContainer.appendChild(div);
    });
  }

  if (nearbyWrapper) nearbyWrapper.style.display = "block";
}

// Derive courses if backend didn't return them
function generateCoursesFromRecommendations(recs) {
  const catalog = [
    {
      key: "software",
      title: "B.Tech Computer Science",
      description: "Programming, data structures, AI basics",
      eligibility: "12th PCM",
      entrance: "JEE Main/Advanced",
      career_scope: "Excellent",
    },
    {
      key: "engineering",
      title: "B.Tech Mechanical Engineering",
      description: "Design, thermodynamics, manufacturing",
      eligibility: "12th PCM",
      entrance: "JEE Main",
      career_scope: "Very Good",
    },
    {
      key: "medicine",
      title: "MBBS",
      description: "Clinical sciences and patient care",
      eligibility: "12th PCB",
      entrance: "NEET",
      career_scope: "Excellent",
    },
    {
      key: "design",
      title: "B.Des",
      description: "Design thinking, UI/UX, prototyping",
      eligibility: "12th Any Stream",
      entrance: "NID/CEED",
      career_scope: "Very Good",
    },
    {
      key: "commerce",
      title: "B.Com (Hons)",
      description: "Accounting, finance, business",
      eligibility: "12th Any Stream (Maths preferred)",
      entrance: "University-specific",
      career_scope: "Good",
    },
    {
      key: "arts",
      title: "BA (Hons) Psychology",
      description: "Cognitive science, counseling, research methods",
      eligibility: "12th Any Stream",
      entrance: "University-specific",
      career_scope: "Good",
    },
    {
      key: "data",
      title: "B.Sc Data Science",
      description: "Statistics, ML, data engineering",
      eligibility: "12th PCM/PCMB",
      entrance: "University-specific",
      career_scope: "Excellent",
    },
  ];
  const text = recs
    .map((r) => `${r.title} ${r.description || ""}`)
    .join(" ")
    .toLowerCase();
  const picks = [];
  function addIfMatch(keys, item) {
    if (keys.some((k) => text.includes(k))) {
      picks.push(item);
    }
  }
  addIfMatch(["software", "computer", "cs", "it", "developer"], catalog[0]);
  addIfMatch(["engineer", "engineering"], catalog[1]);
  addIfMatch(["medicine", "doctor", "mbbs", "medical"], catalog[2]);
  addIfMatch(["design", "ux", "ui", "creative"], catalog[3]);
  addIfMatch(["commerce", "business", "finance", "b.com", "bcom"], catalog[4]);
  addIfMatch(["arts", "psychology", "humanities", "writing"], catalog[5]);
  addIfMatch(["data", "ai", "ml", "analytics"], catalog[6]);
  if (picks.length === 0) return catalog.slice(0, 3);
  const seen = new Set();
  return picks
    .filter((c) => {
      if (seen.has(c.title)) return false;
      seen.add(c.title);
      return true;
    })
    .slice(0, 5);
}

// --- College Search Functions ---
const allColleges = [
  {
    name: "IIT Bombay",
    city: "Mumbai",
    course: "Engineering",
    type: "Public",
    lat: 19.1334,
    lon: 72.9133,
    facilities: ["Library", "Hostel", "Research Labs"],
    courses: ["B.Tech CSE", "B.Tech EE", "M.Tech AI"],
  },
  {
    name: "Delhi University",
    city: "Delhi",
    course: "Arts",
    type: "Public",
    lat: 28.6892,
    lon: 77.209,
    facilities: ["Library", "Sports Complex"],
    courses: ["BA Economics", "BA English", "MA Political Science"],
  },
  {
    name: "St. Xavier's College",
    city: "Mumbai",
    course: "Arts",
    type: "Private",
    lat: 18.9368,
    lon: 72.8276,
    facilities: ["Library", "Cultural Center"],
    courses: ["BA Psychology", "BMM", "BCom"],
  },
  {
    name: "Vellore Institute of Technology",
    city: "Vellore",
    course: "Engineering",
    type: "Private",
    lat: 12.9692,
    lon: 79.1559,
    facilities: ["Hostel", "Incubation Center"],
    courses: ["B.Tech IT", "B.Tech Mechanical", "MCA"],
  },
  {
    name: "AIIMS Delhi",
    city: "Delhi",
    course: "Medicine",
    type: "Public",
    lat: 28.5665,
    lon: 77.21,
    facilities: ["Hospital", "Research Labs"],
    courses: ["MBBS", "MD", "Nursing"],
  },
  {
    name: "Amity University",
    city: "Noida",
    course: "Commerce",
    type: "Private",
    lat: 28.5449,
    lon: 77.3337,
    facilities: ["Hostel", "Sports Complex"],
    courses: ["BBA", "B.Com(H)", "MBA"],
  },
  {
    name: "SRM Institute of Science and Technology",
    city: "Chennai",
    course: "Engineering",
    type: "Private",
    lat: 12.823,
    lon: 80.0454,
    facilities: ["Hostel", "Library"],
    courses: ["B.Tech ECE", "B.Tech Civil", "MBA"],
  },
  {
    name: "Jawaharlal Nehru University",
    city: "Delhi",
    course: "Arts",
    type: "Public",
    lat: 28.5402,
    lon: 77.166,
    facilities: ["Library", "Research Centers"],
    courses: ["MA Sociology", "MA IR", "PhD Programs"],
  },
  {
    name: "Lady Shri Ram College for Women",
    city: "Delhi",
    course: "Commerce",
    type: "Public",
    lat: 28.5623,
    lon: 77.238,
    facilities: ["Library", "Auditorium"],
    courses: ["BA(H) Economics", "B.Com(H)", "BA(H) Psychology"],
  },
];

collegeFilterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const location = document.getElementById("location").value.toLowerCase();
  const course = document.getElementById("course").value.toLowerCase();
  const type = document.getElementById("college-type").value.toLowerCase();
  filterColleges(location, course, type);
});

function filterColleges(location, course, type) {
  const filtered = allColleges.filter((college) => {
    const matchesLocation =
      location === "" || college.city.toLowerCase().includes(location);
    const matchesCourse =
      course === "" || college.course.toLowerCase() === course;
    const matchesType = type === "" || college.type.toLowerCase() === type;
    return matchesLocation && matchesCourse && matchesType;
  });
  displayColleges(filtered);
}

function displayColleges(colleges) {
  collegesContainer.innerHTML = "";
  if (colleges.length === 0) {
    collegesContainer.innerHTML =
      "<p>No colleges found matching your criteria.</p>";
    return;
  }
  colleges.forEach((college) => {
    const collegeCard = document.createElement("div");
    collegeCard.className = "result-card";
    collegeCard.innerHTML = `
            <h3>${college.name}</h3>
            <p><strong>City:</strong> ${college.city}</p>
            <p><strong>Course:</strong> ${college.course}</p>
            <p><strong>Type:</strong> ${college.type}</p>
            ${
              college.courses
                ? `<p><strong>Courses:</strong> ${college.courses.join(
                    ", "
                  )}</p>`
                : ""
            }
            ${
              college.facilities
                ? `<p><strong>Facilities:</strong> ${college.facilities.join(
                    ", "
                  )}</p>`
                : ""
            }
            ${
              college.distanceKm !== undefined
                ? `<p><strong>Distance:</strong> ${college.distanceKm.toFixed(
                    1
                  )} km</p>`
                : ""
            }
        `;
    collegesContainer.appendChild(collegeCard);
  });
}

// --- Geolocation and Nearby Logic ---
function showLoader(show) {
  if (!loadingOverlay) return;
  loadingOverlay.classList.toggle("hidden", !show);
}

function showToast(message, timeout = 3000) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  setTimeout(() => toastEl.classList.add("hidden"), timeout);
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function filterByRadius(userLat, userLon, radiusKm, course = "", type = "") {
  const courseLower = course.toLowerCase();
  const typeLower = type.toLowerCase();
  return allColleges
    .map((c) => {
      if (typeof c.lat !== "number" || typeof c.lon !== "number") return null;
      const distanceKm = haversineDistanceKm(userLat, userLon, c.lat, c.lon);
      return { ...c, distanceKm };
    })
    .filter((c) => c && c.distanceKm <= radiusKm)
    .filter((c) => courseLower === "" || c.course.toLowerCase() === courseLower)
    .filter((c) => typeLower === "" || c.type.toLowerCase() === typeLower)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

// very small built-in city geocoder as fallback for common cities
const cityToCoords = {
  mumbai: { lat: 19.076, lon: 72.8777 },
  delhi: { lat: 28.6139, lon: 77.209 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  noida: { lat: 28.5355, lon: 77.391 },
  vellore: { lat: 12.9165, lon: 79.1325 },
};

function getCoordsFromCityInput() {
  const cityInput = document
    .getElementById("location")
    .value.trim()
    .toLowerCase();
  if (cityInput && cityToCoords[cityInput]) {
    return cityToCoords[cityInput];
  }
  return null;
}

async function autoShowNearbyAfterQuiz() {
  try {
    showLoader(true);
    const { lat, lon } = await getBrowserLocation();
    let radiusKm = 30;
    let nearby = filterByRadius(lat, lon, radiusKm);
    // expand search if nothing found
    if (nearby.length === 0) {
      radiusKm = 50;
      nearby = filterByRadius(lat, lon, radiusKm);
    }
    if (nearbyWrapper && nearbyCollegesContainer) {
      nearbyWrapper.style.display = "block";
      nearbyCollegesContainer.innerHTML = "";
      if (nearby.length === 0) {
        showToast("No colleges within 50 km. Showing top options instead.");
        renderCollegesTo(nearbyCollegesContainer, allColleges.slice(0, 4));
      } else {
        renderCollegesTo(nearbyCollegesContainer, nearby);
      }
    }
  } catch (e) {
    const cityCoords = getCoordsFromCityInput();
    if (cityCoords) {
      const nearby = filterByRadius(cityCoords.lat, cityCoords.lon, 30);
      if (nearbyWrapper && nearbyCollegesContainer) {
        nearbyWrapper.style.display = "block";
        nearbyCollegesContainer.innerHTML = "";
        if (nearby.length === 0) {
          renderCollegesTo(nearbyCollegesContainer, allColleges.slice(0, 4));
        } else {
          renderCollegesTo(nearbyCollegesContainer, nearby);
        }
      }
      showToast("Using city input to show nearby colleges.");
    } else {
      if (nearbyWrapper && nearbyCollegesContainer) {
        nearbyWrapper.style.display = "block";
        renderCollegesTo(nearbyCollegesContainer, allColleges.slice(0, 4));
      }
      showToast(
        "Location unavailable. Showing top colleges. Enter a city for better results."
      );
    }
  } finally {
    showLoader(false);
  }
}

function renderCollegesTo(container, colleges) {
  container.innerHTML = "";
  colleges.forEach((college) => {
    const div = document.createElement("div");
    div.className = "result-card";
    div.innerHTML = `
            <h3>${college.name}</h3>
            <p><strong>City:</strong> ${college.city}</p>
            <p><strong>Course:</strong> ${college.course}</p>
            <p><strong>Type:</strong> ${college.type}</p>
            ${
              college.courses
                ? `<p><strong>Courses:</strong> ${college.courses.join(
                    ", "
                  )}</p>`
                : ""
            }
            ${
              college.facilities
                ? `<p><strong>Facilities:</strong> ${college.facilities.join(
                    ", "
                  )}</p>`
                : ""
            }
            ${
              college.distanceKm !== undefined
                ? `<p><strong>Distance:</strong> ${college.distanceKm.toFixed(
                    1
                  )} km</p>`
                : ""
            }
        `;
    container.appendChild(div);
  });
}

useMyLocationBtn?.addEventListener("click", async () => {
  try {
    showLoader(true);
    let coords;
    try {
      coords = await getBrowserLocation();
    } catch (e) {
      const cityCoords = getCoordsFromCityInput();
      if (!cityCoords) throw e;
      coords = cityCoords;
    }
    const { lat, lon } = coords;
    const radiusKm = Number(radiusKmSelect?.value || 30);
    const course = document.getElementById("course").value;
    const type = document.getElementById("college-type").value;
    const nearby = filterByRadius(lat, lon, radiusKm, course, type);
    displayColleges(nearby);
    showToast(`Showing colleges within ${radiusKm} km of your location`);
  } catch (e) {
    showToast(
      "Couldn't access your location. Enter a city like Mumbai or Delhi."
    );
  } finally {
    showLoader(false);
  }
});

// --- Login Functions ---
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Login functionality is for demonstration only. No data is stored.");
  showPage("home");
});

// --- Initial Setup ---
document.addEventListener("DOMContentLoaded", () => {
  showPage("home");
  // Pre-populate colleges on page load
  displayColleges(allColleges);
});
