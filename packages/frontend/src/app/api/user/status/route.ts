import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function GET(req: NextRequest) {
  try {
    // Get user ID from Clerk
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Return success response indicating user is authenticated and services are ready
    return NextResponse.json({ 
      status: 'active',
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 