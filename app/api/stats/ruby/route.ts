import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const startDate = request.nextUrl.searchParams.get('start');
    const endDate = request.nextUrl.searchParams.get('end');
    
    // RubyGems API doesn't support date range filtering for individual gems
    // We'll return the general stats but note the limitation
    const response = await axios.get(
      'https://rubygems.org/api/v1/downloads/sendlayer-1.0.0.json'
    );
    
    const data = response.data;
    
    // If date range is provided, we'll add a note that this is general stats
    if (startDate && endDate) {
      data.dateRangeNote = `Note: Ruby stats shown are general statistics. Date range ${startDate} to ${endDate} requested but not supported by RubyGems API.`;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Ruby stats' },
      { status: 500 }
    );
  }
}

