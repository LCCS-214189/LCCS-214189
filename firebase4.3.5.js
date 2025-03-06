// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDoo0KLLYI8kaBRcRHkc-ZHJkZG-5Lnd_8",
  authDomain: "leaving-cert-d2547.firebaseapp.com",
  databaseURL: "https://leaving-cert-d2547-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "leaving-cert-d2547",
  storageBucket: "leaving-cert-d2547.firebasestorage.app",
  messagingSenderId: "1014780217550",
  appId: "1:1014780217550:web:74b4a54c6914006b40689f"
};

// Import Firebase functions
const { initializeApp } = firebase;
const { getDatabase, ref, onValue, push, set } = firebase.database;

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Function to Fetch Data and Update Summary Table
function updateSummaryTable() {
  database.ref("license-form-submissions").on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      console.log("⚠️ No data available in Firebase.");
      return;
    }

    // Process Data
    const ageGroupCounts = {};
    let pressureCount = 0;
    let stopDrivingCount = 0;

    Object.values(data).forEach(entry => {
      // Count age groups
      ageGroupCounts[entry.ageGroup] = (ageGroupCounts[entry.ageGroup] || 0) + 1;

      // Count people under pressure
      if (entry.pressureLicense === "Yes") {
        pressureCount++;
      }

      // Count people who would stop driving
      if (entry.reliablePt === "Yes") {
        stopDrivingCount++;
      }
    });

    // Find the most popular age group
    let mostPopularAgeGroup = Object.keys(ageGroupCounts).reduce((a, b) =>
      ageGroupCounts[a] > ageGroupCounts[b] ? a : b, ""
    );

    // Update HTML Table
    document.getElementById("popular-age-group").textContent = mostPopularAgeGroup || "No Data";
    document.getElementById("pressure-count").textContent = pressureCount;
    document.getElementById("stop-driving-count").textContent = stopDrivingCount;
  }, (error) => {
    console.error("❌ Error fetching data:", error);
  });
}

// Function to Fetch Data and Update Plotly Graph
function updateGraph() {
  database.ref("license-form-submissions").on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      console.log("⚠️ No data available in Firebase.");
      return;
    }

    // Process data for Plotly
    const ageGroups = {};

    Object.values(data).forEach(entry => {
      ageGroups[entry.ageGroup] = (ageGroups[entry.ageGroup] || 0) + 1;
    });

    // Convert processed data into Plotly format
    const labels = Object.keys(ageGroups);
    const values = Object.values(ageGroups);

    const trace = {
      x: labels,
      y: values,
      type: "bar",
      marker: {
        color: values,
        colorscale: [
          ['0.0', '#006400'],
          ['1.0', '#90EE90']
        ],
        showscale: true
      },
      hoverinfo: 'y' // Only show y value on hover
    };

    const layout = {
      title: "Number of Full Driving Licenses by Age Group",
      xaxis: { title: "Age Group" },
      yaxis: { title: "Number of Licenses" }
    };

    // Render the graph inside the "chart" div
    Plotly.newPlot("chart", [trace], layout);
  }, (error) => {
    console.error("❌ Error fetching data:", error);
  });
}

// Call functions to update in real-time
updateSummaryTable();
updateGraph();


window.onload = function() {
  const licenseForm = document.getElementById("license-form");

  if (!licenseForm) {
    console.error("❌ Form not found in the DOM.");
    return;
  }

  licenseForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent default form submission

    // Capture form data
    const name = document.getElementById("name").value;
    const licenseDate = document.getElementById("license-date").value;
    const ageGroup = document.getElementById("age-group").value;
    const mileage = document.getElementById("mileage").value;
    const pressureLicense = document.querySelector('input[name="pressure-license"]:checked')?.value;
    const publicTransportDistance = document.getElementById("public-transport-distance").value;
    const reliablePt = document.querySelector('input[name="reliable-pt"]:checked')?.value;

    if (!name || !licenseDate || !ageGroup || !mileage || !pressureLicense || !publicTransportDistance || !reliablePt) {
      alert("⚠️ Please fill in all fields before submitting.");
      return;
    }

    // Push data to Firebase inside the event listener
    database.ref("license-form-submissions").push({
      name,
      licenseDate,
      ageGroup,
      mileage,
      pressureLicense,
      publicTransportDistance,
      reliablePt,
    }).then(() => {
      alert("✅ Form submitted successfully!");
      licenseForm.reset(); // Clear the form
    }).catch((error) => {
      console.error("❌ Error submitting form:", error);
    });
  });
};