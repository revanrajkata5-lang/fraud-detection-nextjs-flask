// All text below comes from the project presentation (MINI_PROJECT_PPT.pptx).
export const project = {
  college: "Methodist College of Engineering and Technology",
  title: "Credit Card Fraud Detection",
  tagline: "A web-based system that uses machine learning to flag potentially fraudulent credit card transactions.",
};

export const abstract =
  "Credit Card Fraud Detection is a web-based system designed to identify potentially fraudulent credit card transactions and help users detect suspicious financial activities. The website allows users to enter transaction details and analyze whether a transaction is legitimate or potentially fraudulent. It uses machine learning techniques to analyze transaction patterns and classify transactions based on their characteristics. The system provides a simple and user-friendly interface to display prediction results, helping users understand possible fraud risks. By integrating web development with machine learning, the project aims to improve fraud detection, reduce manual effort, and support faster decision-making. The proposed system can be further enhanced with transaction history, fraud statistics, and real-time monitoring features.";

export const introduction = [
  "Credit Card Fraud Detection is a web-based system that uses machine learning techniques to identify potentially fraudulent credit card transactions. With the growth of online payments and digital banking, detecting fraudulent activities has become increasingly important.",
  "The proposed website analyzes transaction details and predicts whether a transaction is legitimate or potentially fraudulent. It provides a simple interface for displaying prediction results, helping users identify suspicious transactions efficiently. The system integrates web development and machine learning to support faster and more effective fraud detection.",
  "The website aims to reduce manual effort and simplify transaction analysis. It can help users understand suspicious transaction patterns through clear prediction results, and can be enhanced with transaction history and fraud statistics. Overall, the project demonstrates the practical use of machine learning in improving digital payment security.",
];

export const existingSystem = [
  "Traditional fraud detection systems use predefined rules to identify suspicious credit card transactions.",
  "Some systems depend on fixed transaction limits and manually configured conditions.",
  "Transaction details may require manual verification when suspicious activity is detected.",
  "Detecting new and complex fraud patterns can be difficult using rule-based methods alone.",
  "Large volumes of transactions can make continuous monitoring challenging.",
  "Fraudulent transactions may remain undetected if they do not match existing rules.",
  "Legitimate transactions may sometimes be incorrectly flagged as fraudulent.",
  "Existing approaches may require frequent updates to detection rules.",
];

export const limitations = [
  "Time-consuming manual verification",
  "Difficulty detecting unfamiliar fraud patterns",
  "False-positive and false-negative predictions",
  "Dependence on predefined rules in some systems",
  "Limited transaction analysis and reporting",
  "Difficulty monitoring large transaction volumes",
];

export const layers = [
  { n: 1, title: "User Layer", text: "Customers, bank staff or admins access the system through a responsive web browser UI." },
  { n: 2, title: "Web Application Layer", text: "Next.js frontend plus a Flask backend that handles requests, preprocessing and API calls." },
  { n: 3, title: "Model Serving Layer", text: "Prediction API that receives transaction data and returns Fraud / Legitimate." },
  { n: 4, title: "Database Layer", text: "Stores user data, transaction records, prediction results and logs." },
  { n: 5, title: "Output Layer", text: "Fraud detection result displayed on the web interface: flagged or approved." },
  { n: 6, title: "Model Training Pipeline", text: "Offline pipeline: raw data, preprocessing, model training and a saved .pkl model." },
];

export const proposedIntro =
  "The proposed system is a web-based Credit Card Fraud Detection system that uses machine learning techniques to analyze transaction details and identify potentially fraudulent activities. It provides a centralized platform where users can enter transaction information and receive prediction results through an interactive website.";

export const proposedPoints = [
  { title: "User-friendly interface", text: "A web interface for entering credit card transaction details and analyzing transaction data." },
  { title: "Frontend + backend integration", text: "Processes user inputs and communicates with the trained machine learning model." },
  { title: "Data preprocessing", text: "Handles missing values, encodes categorical data when required, and prepares transaction features for prediction." },
  { title: "ML classification", text: "A trained model analyzes transaction patterns and classifies transactions as legitimate or potentially fraudulent." },
  { title: "Clear prediction results", text: "Shows whether a transaction is legitimate or potentially fraudulent." },
  { title: "Analytics dashboard", text: "Total transactions analyzed, legitimate vs potentially fraudulent counts." },
  { title: "Data visualization", text: "Charts and graphs present fraud statistics and transaction patterns." },
  { title: "Scalable and flexible", text: "Designed to allow future integration of advanced machine learning models." },
];

export const objectives = [
  "Reduce manual effort",
  "Enable faster analysis",
  "Improve accessibility through a web-based platform",
  "Improve fraud detection accuracy and overall performance",
];

// Reproduced exactly as shown on the literature survey slide.
export const literature = [
  { n: 1, author: "Kumar & Singh", title: "Challenges and Opportunities of Event Management System", pub: "Event Management Journal", year: 2025 },
  { n: 2, author: "Garcia et al.", title: "Event Planning and Organizing Portal", pub: "International Journal of Web Applications", year: 2025 },
  { n: 3, author: "Lee & Brown", title: "Event Management System", pub: "Journal of Information Technology", year: 2023 },
  { n: 4, author: "Patel et al.", title: "Exploring the Role of Technology in Event Management", pub: "Journal of Convention & Event Tourism", year: 2025 },
  { n: 5, author: "Wong et al.", title: "Advancements in Online Event Management", pub: "Journal of Online Event Solutions", year: 2025 },
];

export const conclusion =
  "The Credit Card Fraud Detection website provides a web-based approach to identifying potentially fraudulent credit card transactions using machine learning techniques. By integrating a user-friendly interface with transaction analysis and prediction, the system helps users understand suspicious activities more efficiently. It reduces dependence on manual analysis and demonstrates how web development and machine learning can work together to address financial fraud detection.";

export const futureScope = [
  "Real-time monitoring",
  "Improved classification models",
  "Fraud analytics",
  "Secure transaction management",
];
