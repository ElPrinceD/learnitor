import React, { useState } from 'react';
import Header from './MainHead';
import Navbar from './VerticalNavbar';
import MyCourses from './MyCourses';
import DateSorting from '../DateComponent';

import  './css/Dashboard.css';

const Dashboard = () => {
 
  return (
    <div>
    <Header />
    <div className="content-container">
    <Navbar />
    <MyCourses />
    
    </div>
    </div>
  );
}
export default Dashboard;
