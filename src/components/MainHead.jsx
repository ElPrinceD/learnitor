// Header.js

import React from 'react';
import Profile from './Images/profile.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

import './css/MainHead.css'; // Import CSS file for styling

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <img src="/path/to/logo.png" alt="Loop Academy Logo" />
      </div>
      <div className="search-bar">  
      
        <input type="text" placeholder="Find your course..." />
        <button>Search</button>
      </div>
      <div className="user-profile">
        <button className='add_course'>Add new course</button>
       
        <button className="notification-btn">
          <FontAwesomeIcon icon={faBell} />
        </button>
        <img src={Profile} alt="User Profile" /> 
      </div>

    </header>
  );
};

export default Header;
