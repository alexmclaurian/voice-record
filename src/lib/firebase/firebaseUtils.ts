import { auth, db } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

// Firestore functions
export const addNote = async (data: { content: string; createdAt: Date }) => {

  return addDoc(collection(db, "notes"), {
    ...data,
  });
};

export const getNotes = async () => {
  try {
    console.log("Attempting to fetch notes...");
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    console.log("Notes fetched successfully. Count:", querySnapshot.size);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw new Error(`Failed to fetch notes: ${(error as Error).message}`);
  }
};

export const updateNote = (id: string, data: any) => {

  return updateDoc(doc(db, "notes", id), data);
};

export const deleteNote = (id: string) => {

  return deleteDoc(doc(db, "notes", id));
};
