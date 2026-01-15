import { getAmadeusToken } from '../../../lib/token';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');

  if (!keyword || keyword.length < 2) {
    return NextResponse.json(
      { error: 'Keyword must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    const token = await getAmadeusToken();

    const params = new URLSearchParams({
      subType: 'CITY,AIRPORT',
      keyword: keyword,
    });

    const response = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?${params.toString()}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus locations API error:', errorText);
      throw new Error('Failed to fetch locations');
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json(
      { error: 'Location search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
