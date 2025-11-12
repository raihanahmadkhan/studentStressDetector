// Client-side stress calculator using simplified fuzzy logic
// Matches backend/main.py fuzzy logic implementation

// Trapezoidal membership function
function trapmf(x, params) {
  const [a, b, c, d] = params;
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > c && x < d) return (d - x) / (d - c);
  return 0;
}

// Triangular membership function
function trimf(x, params) {
  const [a, b, c] = params;
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > b && x < c) return (c - x) / (c - b);
  return 0;
}

// Calculate membership degrees for all fuzzy sets
function getMembershipDegrees(inputs) {
  const { sleep, workload, screentime, extracurricular } = inputs;

  // Sleep membership functions (matching backend lines 37-39)
  const sleepDegrees = {
    poor: trapmf(sleep, [0, 0, 4, 6]),
    moderate: trimf(sleep, [5, 6.5, 8]),
    good: trapmf(sleep, [7, 8.5, 12, 12])
  };

  // Workload membership functions (matching backend lines 40-42)
  const workloadDegrees = {
    low: trapmf(workload, [0, 0, 2, 4]),
    medium: trimf(workload, [3, 5, 7]),
    high: trapmf(workload, [6, 8, 10, 10])
  };

  // Screen time membership functions (matching backend lines 43-45)
  const screentimeDegrees = {
    low: trapmf(screentime, [0, 0, 2, 4]),
    moderate: trimf(screentime, [3, 6, 9]),
    high: trapmf(screentime, [8, 12, 16, 16])
  };

  // Extracurricular membership functions (matching backend lines 46-48)
  const extracurricularDegrees = {
    low: trapmf(extracurricular, [0, 0, 1, 3]),
    balanced: trimf(extracurricular, [2, 5, 8]),
    excessive: trapmf(extracurricular, [7, 9, 10, 10])
  };

  return {
    sleep: sleepDegrees,
    workload: workloadDegrees,
    screentime: screentimeDegrees,
    extracurricular: extracurricularDegrees
  };
}

// Evaluate fuzzy rules (matching backend lines 54-76)
function evaluateRules(degrees) {
  const { sleep, workload, screentime, extracurricular } = degrees;

  // Helper function for AND operation (minimum)
  const and = (...values) => Math.min(...values);

  // Define rules with their corresponding stress outputs
  // Each rule returns { activation, stressValue }
  const rules = [
    // Rule 1: sleep good & workload low & screentime low & extracurricular balanced -> very_low
    { activation: and(sleep.good, workload.low, screentime.low, extracurricular.balanced), stress: 12.5 },
    
    // Rule 2: sleep good & workload low & screentime moderate & extracurricular balanced -> low
    { activation: and(sleep.good, workload.low, screentime.moderate, extracurricular.balanced), stress: 30 },
    
    // Rule 3: sleep good & workload high & screentime low -> moderate
    { activation: and(sleep.good, workload.high, screentime.low), stress: 50 },
    
    // Rule 4: sleep good & workload high & screentime high -> high
    { activation: and(sleep.good, workload.high, screentime.high), stress: 70 },
    
    // Rule 5: sleep poor & workload low & screentime low -> moderate
    { activation: and(sleep.poor, workload.low, screentime.low), stress: 50 },
    
    // Rule 6: sleep poor & workload medium -> high
    { activation: and(sleep.poor, workload.medium), stress: 70 },
    
    // Rule 7: sleep poor & workload high -> very_high
    { activation: and(sleep.poor, workload.high), stress: 90 },
    
    // Rule 8: sleep poor & screentime high -> very_high
    { activation: and(sleep.poor, screentime.high), stress: 90 },
    
    // Rule 9: sleep moderate & workload low & screentime low & extracurricular balanced -> low
    { activation: and(sleep.moderate, workload.low, screentime.low, extracurricular.balanced), stress: 30 },
    
    // Rule 10: sleep moderate & workload medium & screentime moderate -> moderate
    { activation: and(sleep.moderate, workload.medium, screentime.moderate), stress: 50 },
    
    // Rule 11: sleep moderate & workload high & screentime high -> high
    { activation: and(sleep.moderate, workload.high, screentime.high), stress: 70 },
    
    // Rule 12: screentime high & workload high -> very_high
    { activation: and(screentime.high, workload.high), stress: 90 },
    
    // Rule 13: screentime high & sleep poor -> very_high
    { activation: and(screentime.high, sleep.poor), stress: 90 },
    
    // Rule 14: screentime high & workload medium & sleep moderate -> high
    { activation: and(screentime.high, workload.medium, sleep.moderate), stress: 70 },
    
    // Rule 15: extracurricular excessive & workload high -> very_high
    { activation: and(extracurricular.excessive, workload.high), stress: 90 },
    
    // Rule 16: extracurricular excessive & sleep poor -> very_high
    { activation: and(extracurricular.excessive, sleep.poor), stress: 90 },
    
    // Rule 17: extracurricular low & workload low & sleep good -> low
    { activation: and(extracurricular.low, workload.low, sleep.good), stress: 30 },
    
    // Rule 18: sleep moderate & workload medium & screentime low & extracurricular balanced -> low
    { activation: and(sleep.moderate, workload.medium, screentime.low, extracurricular.balanced), stress: 30 },
    
    // Rule 19: sleep good & workload medium & screentime moderate & extracurricular balanced -> moderate
    { activation: and(sleep.good, workload.medium, screentime.moderate, extracurricular.balanced), stress: 50 },
    
    // Rule 20: workload low & screentime low & extracurricular low -> low
    { activation: and(workload.low, screentime.low, extracurricular.low), stress: 30 },
    
    // Rule 21: workload high & screentime moderate & sleep moderate -> high
    { activation: and(workload.high, screentime.moderate, sleep.moderate), stress: 70 }
  ];

  return rules;
}

// Simplified centroid defuzzification
function defuzzify(rules) {
  let numerator = 0;
  let denominator = 0;

  rules.forEach(rule => {
    if (rule.activation > 0) {
      numerator += rule.activation * rule.stress;
      denominator += rule.activation;
    }
  });

  // If no rules activated, return middle value
  if (denominator === 0) return 50;

  return numerator / denominator;
}

// Get stress label based on value (matching backend lines 87-98)
function getStressLabel(stressValue) {
  if (stressValue < 25) return "Very Low Stress";
  if (stressValue < 45) return "Low Stress";
  if (stressValue < 65) return "Moderate Stress";
  if (stressValue < 85) return "High Stress";
  return "Very High Stress";
}

// Calculate stress membership degrees for output
function getStressMembershipDegrees(stressValue) {
  return {
    very_low: trapmf(stressValue, [0, 0, 10, 25]),
    low: trimf(stressValue, [15, 30, 45]),
    moderate: trimf(stressValue, [35, 50, 65]),
    high: trimf(stressValue, [55, 70, 85]),
    very_high: trapmf(stressValue, [75, 90, 100, 100])
  };
}

// Main calculation function
export async function calculateStressLocal(inputs) {
  return new Promise((resolve) => {
    // Add small delay to simulate API call
    setTimeout(() => {
      // Calculate membership degrees for inputs
      const membershipDegrees = getMembershipDegrees(inputs);

      // Evaluate fuzzy rules
      const rules = evaluateRules(membershipDegrees);

      // Defuzzify to get stress value
      const stressValue = defuzzify(rules);

      // Get stress label
      const stressLabel = getStressLabel(stressValue);

      // Calculate stress output membership degrees
      const stressDegrees = getStressMembershipDegrees(stressValue);

      // Build response matching backend StressOutput model
      const result = {
        stress_percentage: parseFloat(stressValue.toFixed(2)),
        stress_label: stressLabel,
        membership_degrees: {
          sleep: membershipDegrees.sleep,
          workload: membershipDegrees.workload,
          screentime: membershipDegrees.screentime,
          extracurricular: membershipDegrees.extracurricular,
          stress: stressDegrees
        },
        input_values: {
          sleep: inputs.sleep,
          workload: inputs.workload,
          screentime: inputs.screentime,
          extracurricular: inputs.extracurricular
        },
        fuzzy_details: {
          inference_type: "Mamdani",
          defuzzification: "centroid",
          total_rules: 21
        }
      };

      resolve(result);
    }, 100);
  });
}
