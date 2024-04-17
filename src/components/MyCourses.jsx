// MyCourses.js

import React from 'react';
import './css/MyCourses.css'; // Import CSS file for styling

const MyCourses = () => {
    return (
      <div className="my-courses-section">
        <h1>My Courses <a><span className='see_all'>See all →</span></a></h1>
        
        <div className="course-cards">
          <div className="course-card">
            <h3>Interaction Design</h3>
            <progress value="60" max="100"></progress>
            <span className="progress-label">60%</span>
            <div className="course-icons">
              <span>12</span>
            </div>
          </div>
          <div className="course-card">
            <h3>Photography</h3>
            <progress value="35" max="100"></progress>
            <span className="progress-label">35%</span>
            <div className="course-icons">
              <span>5</span>
            </div>
          </div>
          <div className="course-card">
            <h3>UX Writing</h3>
            <progress value="80" max="100"></progress>
            <span className="progress-label">80%</span>
            <div className="course-icons">
              <span>3</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default MyCourses;