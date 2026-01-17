import { getAmadeusToken } from "../../lib/token";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const date = searchParams.get("date");
  const currencyCode = searchParams.get("currency") || "USD";
  const oneWay =
    searchParams.get("oneWay") ||
    (searchParams.get("returnDate") ? "false" : "true");
  const returnDate = searchParams.get("returnDate") || "";

  if (!origin || !destination || !date) {
    return NextResponse.json(
      { error: "Missing required parameters: origin, destination, date" },
      { status: 400 }
    );
  }

  try {
    const token = await getAmadeusToken();

    const params = new URLSearchParams({
      originIataCode: origin,
      destinationIataCode: destination,
      departureDate: date,
      currencyCode: currencyCode,
      oneWay: (Boolean(oneWay) || !!returnDate).toString(),
    });

    const response = await fetch(
      `https://test.api.amadeus.com/v1/analytics/itinerary-price-metrics?${params.toString()}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Amadeus analytics API error:", errorText);
      throw new Error("Failed to fetch historical data");
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Historical search error:", error);
    return NextResponse.json(
      {
        error: "Historical search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
