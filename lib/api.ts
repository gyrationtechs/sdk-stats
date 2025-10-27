export interface SDKStats {
  day: number;
  week: number;
  month: number;
}

export interface RubyStats {
  total: number;
  version: string;
  versionDownloads: number;
}

export async function fetchPythonStats(startDate?: string, endDate?: string): Promise<SDKStats> {
  let url = '/api/stats/python';
  if (startDate && endDate) {
    url += `?start=${startDate}&end=${endDate}`;
  }
  
  console.log('Fetching Python stats from:', url);
  const response = await fetch(url);
  const data = await response.json();
  console.log('Python API response:', data);
  
  // The API now handles date range calculation and returns consistent format
  if (data.data && typeof data.data === 'object') {
    return {
      day: data.data.last_day || 0,
      week: data.data.last_week || 0,
      month: data.data.last_month || 0,
    };
  } else {
    // Fallback for unexpected response format
    return {
      day: 0,
      week: 0,
      month: 0,
    };
  }
}

export async function fetchNodejsStats(startDate?: string, endDate?: string): Promise<SDKStats> {
  if (startDate && endDate) {
    // Use date range endpoint
    const response = await fetch(`/api/stats/nodejs?start=${startDate}&end=${endDate}`);
    const data = await response.json();
    
    // For range queries, calculate totals from the data
    let totalDownloads = 0;
    if (data.downloads && typeof data.downloads === 'number') {
      totalDownloads = data.downloads;
    } else if (Array.isArray(data.downloads)) {
      totalDownloads = data.downloads.reduce((sum: number, day: any) => sum + (day.downloads || 0), 0);
    }
    
    return {
      day: totalDownloads,
      week: totalDownloads,
      month: totalDownloads,
    };
  } else {
    // Use period-based endpoints
    const [dayRes, weekRes, monthRes] = await Promise.all([
      fetch('/api/stats/nodejs?period=last-day'),
      fetch('/api/stats/nodejs?period=last-week'),
      fetch('/api/stats/nodejs?period=last-month'),
    ]);

    const dayData = await dayRes.json();
    const weekData = await weekRes.json();
    const monthData = await monthRes.json();

    return {
      day: dayData.downloads || 0,
      week: weekData.downloads || 0,
      month: monthData.downloads || 0,
    };
  }
}

export async function fetchPhpStats(startDate?: string, endDate?: string): Promise<SDKStats> {
  let url = '/api/stats/php';
  if (startDate && endDate) {
    url += `?start=${startDate}&end=${endDate}`;
  }
  
  console.log('Fetching PHP stats from:', url);
  const response = await fetch(url);
  const data = await response.json();
  console.log('PHP API response:', data);
  
  return {
    day: data.downloads?.daily || 0,
    week: (data.downloads?.daily || 0) * 7,
    month: data.downloads?.monthly || 0,
  };
}

export async function fetchRubyStats(startDate?: string, endDate?: string): Promise<RubyStats> {
  let url = '/api/stats/ruby';
  if (startDate && endDate) {
    url += `?start=${startDate}&end=${endDate}`;
  }
  
  const response = await fetch(url);
  const data = await response.json();
  return {
    total: data.total_downloads || 0,
    version: '1.0.0',
    versionDownloads: data.version_downloads || 0,
  };
}


