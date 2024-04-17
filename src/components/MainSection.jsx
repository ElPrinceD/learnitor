import React, { useState } from 'react';
import './css/MainSection.css';
import axios from 'axios'; // Import Axios
import Lady from './Images/Lady.jpg';

const MainSection = () => {
  const [showForm, setShowForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleRegisterClick = () => {
    setShowForm(true);
    setShowLoginForm(false); // Hide the login form when switching to registration form
  };

  const handleLoginClick = () => {
    setShowLoginForm(true);
    setShowForm(false); // Hide the registration form when switching to login form
  };

  const handleBackToTextContent = () => {
    setShowForm(false);
    setShowLoginForm(false);
  };
  
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phoneNumber: '',
      password: '',
    });
  
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    };
  
    const handleRegisterSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await axios.post('http://localhost:9001/api/v1/user/register/', formData);
        console.log(response.data); // Handle response from backend
        setRegistrationSuccess(true); // Set state to indicate successful registration
      } catch (error) {
        console.error('Error registering:', error);
      }
    }
    

  return (
    <section>
      <div className="content">
        {!showForm && !showLoginForm && (
          <div className="text-content">
            <h2>
              You have the <span style={{ color: '#a6a11e' }}>desire</span>,
              <br />
              We show you the <span style={{ color: '#ac449b' }}>way</span>
            </h2>
            <h4>
              We serve as a comprehensive roadmap for <br />
              students who aspire to learn a programming <br />
              language. It caters to beginners and those <br />
              looking to enhance their skills by providing <br />
              structured guidance and resources.
            </h4>
            <div className="actions">
              <button onClick={handleRegisterClick}>Register →</button>
              <button className='login' onClick={handleLoginClick}>Login  →</button>
            </div>
          </div>
        )}
        {showForm && (
          
          
          <div className="registration-form">
            <h3> <span className="back-button" onClick={handleBackToTextContent}>←Back</span>Registration Form</h3>
            
            <form onSubmit={handleRegisterSubmit}>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
              />
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                required
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              <input
                type="text"
                id="username"
                name="username"
                required
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button type="submit">Register</button>
            </form>
          </div>
        )}
        {showLoginForm && (
          <div className="registration-form">
            <h3><span className="back-button" onClick={handleBackToTextContent}>←Back</span>Login Form</h3>
            <form>
              <input type="text" id="username" name="username" required placeholder='Username'/>
              <input type="password" id="password" name="password" required placeholder='Password'/>
              <button type="submit">Login</button>
            </form>
          </div>
        )}
        <div className="image-content">
          <img src={Lady} alt="Image Description" className="irregular-shape" />
        </div>
      </div>
    </section>
  );
};
  


export default MainSection;
