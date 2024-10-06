'use client';

import { useState, useEffect } from 'react';
import { getNotes } from '../lib/firebase/firebaseUtils';

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching notes...");
        const fetchedNotes = await getNotes();
        console.log("Fetched notes:", fetchedNotes);
        setNotes(fetchedNotes as Note[]);
        setError(null);
      } catch (error) {
        console.error('Error fetching notes:', error);
        setError(`Failed to load notes. Error: ${(error as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, []);

  if (isLoading) {
    return <div className="w-full max-w-md mt-8">Loading notes...</div>;
  }

  if (error) {
    return (
      <div className="w-full max-w-md mt-8 p-4 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mt-8">
      <h2 className="text-2xl font-bold mb-4">Your Notes</h2>
      {notes.length === 0 ? (
        <p className="text-gray-600">No notes yet. Start recording to create your first note!</p>
      ) : (
        <ul className="space-y-4">
          {notes.map((note) => (
            <li key={note.id} className="bg-white shadow rounded-lg p-4">
              <p className="text-gray-800">{note.content}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}