// TodayPlansContext.js
import React, { createContext, useState, useContext } from "react";

const TodayPlansContext = createContext();

export const TodayPlansProvider = ({ children }) => {
  const [todayPlans, setTodayPlans] = useState([]);

  const updateTodayPlans = (newPlans) => {
    setTodayPlans(newPlans);
  };

  return (
    <TodayPlansContext.Provider value={{ todayPlans, updateTodayPlans }}>
      {children}
    </TodayPlansContext.Provider>
  );
};

export const useTodayPlans = () => useContext(TodayPlansContext);
