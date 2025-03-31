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

export interface User {
  id: number;
  username: string; // or any other relevant field
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string; // Assuming profile_picture is a URL
}

export interface Message {
  id: number;
  community: string; // Assuming community is identified by an ID or similar string
  sender: string; // Email or username of the sender
  message: string;
  sent_at: string; // ISO 8601 date string
  image: string;
  status: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
  isMember: boolean;
  shareable_link: string;
  membersCount: number;
  allowMessages: boolean;
  lastMessageTime: string; // ISO 8601 date string
  lastMessage: string;
  lastMessageSender: string; // Email or username of the sender
  members?: User[]; // Array of detailed user objects
  messages?: Message[]; // Array of detailed message objects
}

export interface RecommendedCourse {
  title: string;
  description: string;
  level: string;
  url: string;
  category: number[];
  id: string;
  topicsCount: number;
  questionsCount: number;
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
  duration: string;
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
export interface SlideMaterial {
  name: string;
  type: "slides";
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
  profile_picture: string;
  profileName: string;
  score: string;
}

export interface GameDetailsResponse {
  creator: { first_name: string; id: number };
  players: {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture: string;
  }[];
  questions: Question[];
  code: string;
  ended: string;
  duration: number;
}
export interface Plan {
  id: number;
  title: string;
  description: string;
  due_date: string;
  due_time_start: string;
  due_time_end: string;
  category: number;
}

export interface Community {
  id: string;
  name: string;
  image_url: string;
  created_by: string;
}
