// Testimonial HTML template with placeholders
export const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Text Testimonial</title>
  <style>
    :root {
      --accent-color: {{accentColor}};
      --accent-color-light: #e1f0fa;
      --accent-text-color: #333333;
    }
    body {
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
      font-family: Arial, sans-serif;
    }
    .testimonial-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .testimonial-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .company-logo {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      margin-right: 15px;
      border: 1px solid var(--accent-color);
    }
    .company-name {
      font-size: 18px;
      font-weight: bold;
      color: var(--accent-color);
      margin: 0;
    }
    .testimonial-content {
      margin-bottom: 20px;
      padding: 15px;
      background-color: var(--accent-color-light);
      border-radius: 6px;
    }
    .testimonial-question {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .testimonial-answer {
      font-size: 15px;
      line-height: 1.5;
      color: var(--accent-text-color);
    }
    .testimonial-author {
      display: flex;
      align-items: center;
      margin-top: 15px;
    }
    .author-image {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 10px;
    }
    .author-details {
      display: flex;
      flex-direction: column;
    }
    .author-name {
      font-size: 15px;
      font-weight: bold;
    }
    .author-designation {
      font-size: 13px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="testimonial-container">
    <div class="testimonial-header">
      <img src="{{companyLogo}}" alt="Company Logo" class="company-logo">
    </div>
    
    <div class="testimonial-content">
      <p class="testimonial-question">{{question}}</p>
      <p class="testimonial-answer">
        {{answer}}
      </p>
    </div>
    
    <div class="testimonial-author">
      <img src="{{author.image}}" alt="Author Image" class="author-image">
      <div class="author-details">
        <span class="author-name">{{author.name}}</span>
        <span class="author-designation">{{author.designation}}</span>
      </div>
    </div>
  </div>
</body>
</html>`;

// Default JSON data with placeholders
export const DEFAULT_JSON = {
  "question": "On a scale of 1 to 10, how likely are you to recommend Acme Labs to other businesses?",
  "companyLogo": "https://pub-283d55190c724937868ac6547276a459.r2.dev/guest/survey/email_logo.png",
  "options": [
    "Real-time collaboration",
    "Automation workflows",
    "Analytics dashboard",
    "Integration capabidwadawliawdwaties",
    "Integration capabidwadawliawdwaties"
  ],
  "selectedIndex": [
    1,
    2
  ],
  "author": {
    "name": "Michael Rodriguez",
    "designation": "VP of Operations, TechSolutions Inc.",
    "image": "https://placehold.co/120x120/0f349d/white?text=MR"
  },
  "accentColor": "#4d194d",
  "numberOfResponses": 100,
  "companyName": "TechSolutions Inc.",
  "ratingDistribution": {
    "values": [
      2,
      5,
      10,
      7,
      3
    ],
    "maxValue": 10,
    "labels": {
      "left": "Poor",
      "center": "Average",
      "right": "Excellent"
    }
  }
}; 