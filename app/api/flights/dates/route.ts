import { getAmadeusToken } from '../../../lib/token';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const oneWay = searchParams.get('oneWay') === 'true';
  const nonStop = searchParams.get('nonStop') === 'true';
  const duration = searchParams.get('duration');

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination' },
      { status: 400 }
    );
  }

  try {
    const token = await getAmadeusToken();

    const params = new URLSearchParams({
      origin: origin,
      destination: destination,
      oneWay: oneWay.toString(),
      nonStop: nonStop.toString(),
    });

    // Add duration if provided and not one-way
    if (duration && !oneWay) {
      params.append('duration', duration);
    }

    const response = await fetch(
      `https://test.api.amadeus.com/v1/shopping/flight-dates?${params.toString()}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus flight-dates API error:', errorText);
      throw new Error('Failed to fetch flight dates');
    }

    const responseData = await response.json();
    console.log("Fetched flight dates:", responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Flight dates search error:', error);
    return NextResponse.json(
      { error: 'Flight dates search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
