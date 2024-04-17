import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import "./css/Header.css";

const Header = (props) => {
  return (
    <header>
      <nav>
        <h1>eLearn</h1>
        <ul>
          <li><a href="#">{props.first}</a></li>
          <li><a href="#">{props.second}</a></li>
          <li><a href="#">{props.third}</a></li>
          <li><a href="#">{props.fourth}</a></li>
          <li><a href="#">{props.fifth}</a></li>
        </ul>
      </nav>
      <div>
        <button className='search'><FontAwesomeIcon icon={faSearch} /></button>
        <button>Start Free Trial</button>
      </div>
    </header>
  );
};

export default Header;
