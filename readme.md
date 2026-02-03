# AI Proctored Exam System – Backend

This project implements the backend of an AI-based proctored examination system developed to monitor candidates during online examinations and detect suspicious activities using computer vision and machine learning techniques.

The backend is responsible for authentication, real-time video frame processing, malpractice detection, exam data management, and communication with the frontend through REST APIs. The system aims to ensure secure, fair, and reliable remote examinations.

---

## Features

- Secure user authentication (Login/Register)
- Real-time webcam frame processing
- Face detection and verification
- Multiple face detection
- No-face and suspicious activity alerts
- Malpractice monitoring
- REST API services for frontend integration
- Exam and user data management
- Database storage

---

## Technology Stack

- Python
- Flask / FastAPI
- OpenCV
- NumPy
- Face Detection algorithms
- SQLite / MySQL
- REST APIs
- JSON

---

## Project Structure

BACKEND/
│── app.py              Main application server  
│── routes/             API route handlers  
│── models/             Database models  
│── proctoring/         AI monitoring logic  
│── utils/              Helper functions  
│── requirements.txt  
│── README.md  

---

## Installation and Setup

### Step 1: Clone the repository

git clone <repository-link>  
cd BACKEND  

### Step 2: Create a virtual environment

python -m venv venv  

### Step 3: Activate environment

Windows:
venv\Scripts\activate  

Mac/Linux:
source venv/bin/activate  

### Step 4: Install dependencies

pip install -r requirements.txt  

### Step 5: Run the server

python app.py  

Server will start at:
http://localhost:5000  

---

## Sample API Endpoints

POST   /login           User login  
POST   /register        User registration  
POST   /upload-frame    Upload webcam frame  
GET    /alerts          Fetch malpractice alerts  
POST   /submit          Submit exam  

---

## Monitoring Workflow

1. The frontend captures webcam frames during the exam.
2. Frames are sent to the backend server.
3. OpenCV processes each frame to detect faces and activities.
4. Suspicious behavior such as multiple faces or absence of face is flagged.
5. Alerts are stored and displayed on the admin dashboard.

---

## Use Cases

- Online college and university examinations
- Placement and recruitment tests
- Certification assessments
- Remote learning evaluations

The system improves exam integrity and reduces the chances of cheating.

---

## Future Enhancements

- Deep learning based face recognition
- Eye gaze tracking
- Emotion detection
- Screen recording
- Cloud deployment
- Real-time analytics dashboard

---

## Author

Ambrish Jeyan T 
B.Tech IT
---

## License

This project is developed for academic and educational purposes.
