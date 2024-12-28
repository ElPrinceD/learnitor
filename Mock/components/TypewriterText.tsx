import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, useColorScheme } from "react-native";


export const Typewriter = ({ text, delay = 100, onComplete, style }) => {
    const [displayText, setDisplayText] = useState("");
    const [index, setIndex] = useState(0);
  
    useEffect(() => {
      if (index < text.length) {
        const timeout = setTimeout(() => {
          setDisplayText((prev) => prev + text[index]);
          setIndex((prev) => prev + 1);
        }, delay);
  
        return () => clearTimeout(timeout);
      } else if (onComplete) {
        onComplete();  
      }
    }, [index, text, delay, onComplete]);
  
    return <Text style={style}>{displayText}</Text>;
  };