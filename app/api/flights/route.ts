import { getAmadeusToken } from '../../lib/token';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log("Flights route called");
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');
  const adults = searchParams.get('adults') || '1';
  const children = searchParams.get('children') || '0';
  const currencyCode = searchParams.get('currencyCode') || 'USD';

  if (!origin || !destination || !date) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, date' },
      { status: 400 }
    );
  }

  try {
    const token = await getAmadeusToken();

    const params = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: adults,
      currencyCode: currencyCode,
    });

    // Add children parameter if provided
    if (children && parseInt(children) > 0) {
      params.append('children', children);
    }

    const response = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${params.toString()}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amadeus API error:', errorText);
      throw new Error('Failed to fetch flights');
    }

    const responseData = await response.json();
    console.log("Fetched flights:", responseData);
    
    // Extract dictionaries from response
    const dictionaries = responseData.dictionaries || {};
    const carriers = dictionaries.carriers || {};
    const aircraft = dictionaries.aircraft || {};
    
    // Transform flight data to include converted names
    if (responseData.data && Array.isArray(responseData.data)) {
      responseData.data = responseData.data.map((offer: any) => {
        // Process itineraries to add airline and aircraft names
        if (offer.itineraries && Array.isArray(offer.itineraries)) {
          offer.itineraries = offer.itineraries.map((itinerary: any) => {
            if (itinerary.segments && Array.isArray(itinerary.segments)) {
              itinerary.segments = itinerary.segments.map((segment: any) => {
                // Convert carrier code to airline name
                if (segment.carrierCode && carriers[segment.carrierCode]) {
                  segment.airlineName = carriers[segment.carrierCode];
                }
                
                // Convert aircraft code to aircraft name
                if (segment.aircraft?.code && aircraft[segment.aircraft.code]) {
                  segment.aircraft.name = aircraft[segment.aircraft.code];
                }
                
                // Convert operating carrier code to airline name
                if (segment.operating?.carrierCode && carriers[segment.operating.carrierCode]) {
                  segment.operating.airlineName = carriers[segment.operating.carrierCode];
                }
                
                return segment;
              });
            }
            return itinerary;
          });
        }
        
        // Add validating airline names
        if (offer.validatingAirlineCodes && Array.isArray(offer.validatingAirlineCodes)) {
          offer.validatingAirlineNames = offer.validatingAirlineCodes.map((code: string) => 
            carriers[code] || code
          );
        }
        
        return offer;
      });
    }
    
    // Include dictionaries in response for frontend use
    responseData.dictionaries = {
      carriers,
      aircraft,
      locations: dictionaries.locations || {},
      currencies: dictionaries.currencies || {},
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Flight search error:', error);
    return NextResponse.json(
      { error: 'Flight search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
