import React, {useState} from 'react'
import 'react-modern-calendar-datepicker/lib/DatePicker.css';
import { Calendar } from "react-modern-calendar-datepicker";   
import './components/css/Date.css'  

export default function DateSorting(props) {
    const [selectedDayRange, setSelectedDayRange] = useState({
        from: null,
        to: null
      });

    
      return (
        <div style={{fontSize: '1px'}}>
        
        <Calendar
          value={selectedDayRange}
          onChange={setSelectedDayRange}
          calendarClassName="small-calendar"
          colorPrimary="#324785" 
          colorPrimaryLight="#7583b0" 
          shouldHighlightWeekends
        />

        </div>
      );
 
}