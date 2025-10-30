import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";

// Collection references
export const collectionsRef = {
  profiles: () => collection(db, "profiles"),
  invoices: () => collection(db, "invoices"),
  categories: () => collection(db, "invoice_categories"),
  reminders: () => collection(db, "reminders"),
  userRoles: () => collection(db, "user_roles"),
};

// Helper to convert Firestore timestamps to Date
export const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Helper to convert Date to Firestore timestamp
export const dateToTimestamp = (date: Date | string): Timestamp => {
  return Timestamp.fromDate(new Date(date));
};
