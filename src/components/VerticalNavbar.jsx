// Navbar.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faBook, faClipboardCheck, faEnvelope, faCalendarAlt, faChartBar, faQuestionCircle, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './css/Navbar.css'; // Import CSS file for styling

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="nav-menu">
        <li className="nav-item">
          <FontAwesomeIcon icon={faHome} />
          <span>Dashboard</span>
        </li>
        <li className="nav-item">
          <FontAwesomeIcon icon={faBook} />
          <span>Courses</span>
        </li>
        <li className="nav-item">
          <FontAwesomeIcon icon={faClipboardCheck} />
          <span>Assignments</span>
        </li>
        <li className="nav-item">
          <FontAwesomeIcon icon={faEnvelope} />
          <span>Messages</span>
        </li>
        <li className="nav-item">
          <FontAwesomeIcon icon={faCalendarAlt} />
          <span>Calendar</span>
        </li>
        <li className="nav-item">
          <FontAwesomeIcon icon={faChartBar} />
          <span>Insights</span>
        </li>
        <li className="nav-item">
          <FontAwesomeIcon icon={faQuestionCircle} />
          <span>Help Centre</span>
        </li>
        <li className="nav-item">
          <FontAwesomeIcon icon={faCog} />
          <span>Settings</span>
        </li>
        <li className="nav-item">
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span>Log out</span>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
