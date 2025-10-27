import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const startDate = request.nextUrl.searchParams.get('start');
    const endDate = request.nextUrl.searchParams.get('end');
    const period = request.nextUrl.searchParams.get('period') || 'last-day';
    
    let url: string;
    
    // If date range is provided, use the range endpoint
    if (startDate && endDate) {
      url = `https://api.npmjs.org/downloads/range/${startDate}:${endDate}/sendlayer`;
    } else {
      url = `https://api.npmjs.org/downloads/point/${period}/sendlayer`;
    }
    
    const response = await axios.get(url);
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Node.js stats' },
      { status: 500 }
    );
  }
}

