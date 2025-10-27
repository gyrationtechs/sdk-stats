import axios from 'axios';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const startDate = request.nextUrl.searchParams.get('start');
    const endDate = request.nextUrl.searchParams.get('end');
    
    let url = 'https://pypistats.org/api/packages/sendlayer/recent';
    
    // If date range is provided, use the range endpoint
    if (startDate && endDate) {
      url = `https://pypistats.org/api/packages/sendlayer?start_date=${startDate}&end_date=${endDate}`;
    }
    
    const response = await axios.get(url);
    const data = response.data;
    
    // If date range is provided, calculate totals from the data
    if (startDate && endDate) {
      let totalDownloads = 0;
      
      // Handle different response formats
      if (data.data && Array.isArray(data.data)) {
        // Array format: [{date: '2024-01-01', downloads: 10}, ...]
        totalDownloads = data.data.reduce((sum: number, day: any) => sum + (day.downloads || 0), 0);
      } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        // Object format: {data: {last_day: 10, last_week: 70, last_month: 300}}
        totalDownloads = data.data.last_day || data.data.last_week || data.data.last_month || 0;
      } else if (data.downloads) {
        // Direct downloads count
        totalDownloads = data.downloads;
      }
      
      return NextResponse.json({
        data: {
          last_day: totalDownloads,
          last_week: totalDownloads,
          last_month: totalDownloads,
        }
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Python API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Python stats' },
      { status: 500 }
    );
  }
}

