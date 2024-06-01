import { ImageSourcePropType } from "react-native";

export interface Category {
  id: number;
  name: string;
}

export interface Course {
  title: string;
  description: string;
  level: string;
  url: string;
  category: number[];
  id: string;
}

export interface Topic {
  title: string;
  description: string;
  id: number;
  completed?: boolean;
  isChecked?: boolean;
  color: string;
}
export interface Level {
  title: string;
  image: ImageSourcePropType;
}
export interface Question {
  text: string;
  id: number;
  level: string;
}
export interface Answer {
  text: string;
  id: number;
  isRight: boolean;
  question: number;
  isSelected: boolean;
  isCorrect: boolean;
}
export interface Result {
  question: string;
  allAnswers: Answer[];
  isCorrect: boolean;
}
export interface ArticleMaterial {
  name: string;
  type: "journal";
  link: string;
}
export interface BookMaterial {
  name: string;
  type: "book";
  link: string;
}
export interface Material {
  name: string;
  type: "video";
  link: string;
}
export interface Streak {
  name: string;
  streak: boolean;
}
export interface Player {
  id: number;
  profilePicture: string;
  profileName: string;
}

export interface GameDetailsResponse {
  creator: { first_name: string; id: number };
  players: { id: number; first_name: string; last_name: string }[];
  questions: Question[];
  code: string;
}
