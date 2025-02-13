import * as SQLite from "expo-sqlite";
import { Message, Community, Course, Plan } from "./components/types";

// Custom type for SQLiteDatabase to include transaction method
interface SQLiteDatabaseWithTransaction extends SQLite.SQLiteDatabase {
  transaction: (txCallback: (tx: SQLite.SQLTransaction) => void, errorCallback?: (error: SQLError) => void, successCallback?: () => void) => void;
}

// Open the database using openDatabaseSync
const db = SQLite.openDatabaseSync("app.db") as SQLiteDatabaseWithTransaction;

// ✅ Initialize the database
export const initDatabase = (): void => {
  db.transaction((tx) => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        community TEXT,
        sender TEXT,
        message TEXT,
        sent_at TEXT,
        status TEXT DEFAULT 'pending'
      );
    `);
    
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS lastMessages (
        community TEXT PRIMARY KEY,
        messageData TEXT
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS communities (
        id TEXT PRIMARY KEY,
        name TEXT,
        image_url TEXT
      );
    `);
    
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        level TEXT,
        url TEXT,
        category INTEGER
      );
    `);
    
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        due_date TEXT,
        due_time_start TEXT,
        due_time_end TEXT,
        category INTEGER
      );
    `);
    
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS course_categories (
        id INTEGER PRIMARY KEY,
        name TEXT
      );
    `);
  }, (error) => {
    console.error("DB init error:", error);
  }, () => {
    console.log("Database initialized successfully");
  });
};

// ✅ Insert or update a message
export const insertOrUpdateMessage = (message: Message): void => {
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT OR REPLACE INTO messages (id, community, sender, message, sent_at, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [message.id, message.community, message.sender, message.message, message.sent_at, message.status || "pending"]
    );
  });
};

// ✅ Fetch messages for a community
export const getMessages = (communityId: string): Message[] => {
  let messages: Message[] = [];
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM messages WHERE community = ? ORDER BY sent_at DESC`,
      [communityId],
      (_, { rows }) => {
        messages = rows._array as Message[];
      }
    );
  });
  return messages;
};

// ✅ Insert or update last message
export const insertOrUpdateLastMessage = (communityId: string, messageData: Message): void => {
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT OR REPLACE INTO lastMessages (community, messageData) VALUES (?, ?)`,
      [communityId, JSON.stringify(messageData)]
    );
  });
};

// ✅ Fetch last message for a community
export const getLastMessage = (communityId: string): Message | null => {
  let lastMessage: Message | null = null;
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT messageData FROM lastMessages WHERE community = ?`,
      [communityId],
      (_, { rows }) => {
        if (rows.length > 0) {
          lastMessage = JSON.parse(rows.item(0).messageData) as Message;
        }
      }
    );
  });
  return lastMessage;
};

// ✅ Insert or update a community
export const insertOrUpdateCommunity = (community: Community): void => {
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT OR REPLACE INTO communities (id, name, image_url) VALUES (?, ?, ?)`,
      [community.id, community.name, community.image_url]
    );
  });
};

// ✅ Fetch all communities
export const getCommunities = (): Community[] => {
  let communities: Community[] = [];
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM communities`,
      [],
      (_, { rows }) => {
        communities = rows._array as Community[];
      }
    );
  });
  return communities;
};

// ✅ Insert or update a course
export const insertOrUpdateCourse = (course: Course): void => {
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT OR REPLACE INTO courses (id, title, description, level, url, category) VALUES (?, ?, ?, ?, ?, ?)`,
      [course.id, course.title, course.description, course.level, course.url, course.category[0]] // Assuming category is an array
    );
  });
};

// ✅ Fetch all courses
export const getCourses = (): Course[] => {
  let courses: Course[] = [];
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM courses`,
      [],
      (_, { rows }) => {
        courses = rows._array as Course[];
      }
    );
  });
  return courses;
};

// ✅ Insert or update a plan
export const insertOrUpdatePlan = (plan: Plan): void => {
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT OR REPLACE INTO plans (id, title, description, due_date, due_time_start, due_time_end, category) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [plan.id, plan.title, plan.description, plan.due_date, plan.due_time_start, plan.due_time_end, plan.category]
    );
  });
};

// ✅ Fetch plans for a specific date
export const getPlansByDate = (date: string): Plan[] => {
  let plans: Plan[] = [];
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM plans WHERE due_date = ?`,
      [date],
      (_, { rows }) => {
        plans = rows._array as Plan[];
      }
    );
  });
  return plans;
};

export default {
  initDatabase,
  insertOrUpdateMessage,
  getMessages,
  insertOrUpdateLastMessage,
  getLastMessage,
  insertOrUpdateCommunity,
  getCommunities,
  insertOrUpdateCourse,
  getCourses,
  insertOrUpdatePlan,
  getPlansByDate,
  db,
};