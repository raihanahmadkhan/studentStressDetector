


function trapmf(x, params) {
  const [a, b, c, d] = params;
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > c && x < d) return (d - x) / (d - c);
  return 0;
}


function trimf(x, params) {
  const [a, b, c] = params;
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > b && x < c) return (c - x) / (c - b);
  return 0;
}


function getMembershipDegrees(inputs) {
  const { sleep, workload, screentime, extracurricular } = inputs;


  const sleepDegrees = {
    poor: trapmf(sleep, [0, 0, 4, 6]),
    moderate: trimf(sleep, [5, 6.5, 8]),
    good: trapmf(sleep, [7, 8.5, 12, 12])
  };


  const workloadDegrees = {
    low: trapmf(workload, [0, 0, 2, 4]),
    medium: trimf(workload, [3, 5, 7]),
    high: trapmf(workload, [6, 8, 10, 10])
  };


  const screentimeDegrees = {
    low: trapmf(screentime, [0, 0, 2, 4]),
    moderate: trimf(screentime, [3, 6, 9]),
    high: trapmf(screentime, [8, 12, 16, 16])
  };


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


function evaluateRules(degrees) {
  const { sleep, workload, screentime, extracurricular } = degrees;


  const and = (...values) => Math.min(...values);


  const rules = [

    { activation: and(sleep.good, workload.low, screentime.low, extracurricular.balanced), stress: 12.5 },


    { activation: and(sleep.good, workload.low, screentime.moderate, extracurricular.balanced), stress: 30 },


    { activation: and(sleep.good, workload.high, screentime.low), stress: 50 },


    { activation: and(sleep.good, workload.high, screentime.high), stress: 70 },


    { activation: and(sleep.poor, workload.low, screentime.low), stress: 50 },


    { activation: and(sleep.poor, workload.medium), stress: 70 },


    { activation: and(sleep.poor, workload.high), stress: 90 },


    { activation: and(sleep.poor, screentime.high), stress: 90 },


    { activation: and(sleep.moderate, workload.low, screentime.low, extracurricular.balanced), stress: 30 },


    { activation: and(sleep.moderate, workload.medium, screentime.moderate), stress: 50 },


    { activation: and(sleep.moderate, workload.high, screentime.high), stress: 70 },


    { activation: and(screentime.high, workload.high), stress: 90 },


    { activation: and(screentime.high, sleep.poor), stress: 90 },


    { activation: and(screentime.high, workload.medium, sleep.moderate), stress: 70 },


    { activation: and(extracurricular.excessive, workload.high), stress: 90 },


    { activation: and(extracurricular.excessive, sleep.poor), stress: 90 },


    { activation: and(extracurricular.low, workload.low, sleep.good), stress: 30 },


    { activation: and(sleep.moderate, workload.medium, screentime.low, extracurricular.balanced), stress: 30 },


    { activation: and(sleep.good, workload.medium, screentime.moderate, extracurricular.balanced), stress: 50 },


    { activation: and(workload.low, screentime.low, extracurricular.low), stress: 30 },


    { activation: and(workload.high, screentime.moderate, sleep.moderate), stress: 70 }
  ];

  return rules;
}


function defuzzify(rules) {
  let numerator = 0;
  let denominator = 0;

  rules.forEach(rule => {
    if (rule.activation > 0) {
      numerator += rule.activation * rule.stress;
      denominator += rule.activation;
    }
  });


  if (denominator === 0) return 50;

  return numerator / denominator;
}


function getStressLabel(stressValue) {
  if (stressValue < 25) return "Very Low Stress";
  if (stressValue < 45) return "Low Stress";
  if (stressValue < 65) return "Moderate Stress";
  if (stressValue < 85) return "High Stress";
  return "Very High Stress";
}


function getStressMembershipDegrees(stressValue) {
  return {
    very_low: trapmf(stressValue, [0, 0, 10, 25]),
    low: trimf(stressValue, [15, 30, 45]),
    moderate: trimf(stressValue, [35, 50, 65]),
    high: trimf(stressValue, [55, 70, 85]),
    very_high: trapmf(stressValue, [75, 90, 100, 100])
  };
}


export async function calculateStressLocal(inputs) {
  return new Promise((resolve) => {

    setTimeout(() => {

      const membershipDegrees = getMembershipDegrees(inputs);


      const rules = evaluateRules(membershipDegrees);


      const stressValue = defuzzify(rules);


      const stressLabel = getStressLabel(stressValue);


      const stressDegrees = getStressMembershipDegrees(stressValue);


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
