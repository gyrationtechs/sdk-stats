import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const startDate = request.nextUrl.searchParams.get('start');
    const endDate = request.nextUrl.searchParams.get('end');
    
    // Packagist doesn't support date range filtering in their API
    // We'll return the general stats but note the limitation
    const response = await axios.get(
      'https://packagist.org/packages/sendlayer/sendlayer-php/stats.json'
    );
    
    const data = response.data;
    
    // If date range is provided, we'll add a note that this is general stats
    if (startDate && endDate) {
      data.dateRangeNote = `Note: PHP stats shown are general statistics. Date range ${startDate} to ${endDate} requested but not supported by Packagist API.`;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch PHP stats' },
      { status: 500 }
    );
  }
}

