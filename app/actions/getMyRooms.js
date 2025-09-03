'use server';
import { createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
// Use Query to get the documents of the current user
import { Query } from 'node-appwrite';
import { redirect } from 'next/navigation';

async function getMyRooms() {
  const sessionCookie = cookies().get('appwrite-session');
  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    // Destructure the account and databases objects from the session client
    const { account, databases } = await createSessionClient(
      sessionCookie.value
    );

    // Get user's ID
    const user = await account.get();
    const userId = user.$id;

    // Fetch users rooms
    const { documents: rooms } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ROOMS,
      // Match the user_id field from the database with the userId from the session
      [Query.equal('user_id', userId)]
    );

    return rooms;
  } catch (error) {
    console.log('Failed to get user rooms', error);
    redirect('/error');
  }
}

export default getMyRooms;