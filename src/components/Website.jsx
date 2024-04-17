import React from 'react';
import Header from './Header';
import MainSection from './MainSection';
import Footer from './Footer';

const Website = () => {
  return (
    <div>
      <Header first= "Home" second= "Features" third="Documentation" fourth= "About Us"/>
      <MainSection />
      <Footer />
    </div>
  );
};

export default Website;
