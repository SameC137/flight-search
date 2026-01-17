"use client";

import { useState, useEffect, useMemo } from "react";
import { add, format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  BarStack,
} from "recharts";
import {
  Plane,
  Calendar,
  Users,
  Filter,
  Search,
  UsersRound,
} from "lucide-react";
import { LocationSelector } from "@/components/location-selector";
import { FlightCalendar } from "@/components/flight-calendar";
import { ErrorBoundary } from "@/components/error-boundary";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { parseAsString } from "nuqs/server";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  useQueryState,
} from "nuqs";
import { serialize } from "../lib/search-params";

// Currency formatter helper
const formatCurrency = (
  amount: number,
  currencyCode: string = "USD"
): string => {
  const currencySymbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
    CHF: "CHF ",
  };

  const symbol = currencySymbols[currencyCode] || currencyCode + " ";
  return `${symbol}${amount.toFixed(2)}`;
};

interface Flight {
  id: string;
  price: number;
  currency?: string;
  origin: string;
  destination: string;
  departureDate: string;
  arrivalDate: string;
  airline: string;
  aircraft?: string;
  stops: number;
  duration: string;
  numberOfBookableSeats?: number;
}

export default function Home() {
  const [origin, setOrigin] = useQueryState(
    "origin",
    parseAsString.withDefault("NYC")
  );
  const [destination, setDestination] = useQueryState(
    "destination",
    parseAsString.withDefault("LAX")
  );

  const [departureDate, setDepartureDate] = useQueryState(
    "date",
    parseAsString.withDefault(format(new Date(), "yyyy-MM-dd"))
  );
  const [returnDate, setReturnDate] = useQueryState(
    "returnDate",
    parseAsString
  );
  const [adults, setAdults] = useQueryState(
    "adults",
    parseAsInteger.withDefault(1)
  );
  const [children, setChildren] = useQueryState(
    "children",
    parseAsInteger.withDefault(0)
  );
  const [currency, setCurrency] = useQueryState(
    "currency",
    parseAsString.withDefault("USD")
  );
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);

  const  dynamicDefault = !!returnDate ?  false: true


  const [oneWay, setOneWay] = useQueryState(
    "oneWay",
    parseAsBoolean.withDefault(dynamicDefault)
  );
  // Filters
  const [maxStops, setMaxStops] = useQueryState("maxStops", parseAsInteger);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [selectedAirlines, setSelectedAirlines] = useQueryState(
    "selectedAirlines",
    parseAsArrayOf(parseAsString, ",")
  );

  // Handle calendar date selection - use nuqs to update URL and trigger search
  const handleCalendarDateSelect = (departure: string, returnDateParam?: string) => {
    // Use nuqs to update URL parameters, which will trigger fetchFlights via useEffect
    setDepartureDate(departure)
    
    if (returnDateParam && !oneWay) {
      setReturnDate(returnDateParam)
    } else if (oneWay) {
      setReturnDate(null)
    }
  
  }

  // Fetch flights
  const fetchFlights = async () => {
    if (!origin || !destination || !departureDate || (!oneWay && !returnDate)) {
     
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const params = {
        origin,
        destination,
        date: departureDate,
        adults: adults,
        children: children,
        currency: currency,
        returnDate: returnDate,
      };

      const queryString = serialize(params);
      console.log("Search ", queryString);
      const response = await fetch(`/api/flights${queryString}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched flights from API:", data);

      if (data.data && Array.isArray(data.data)) {
        const dictionaries = data.dictionaries || {};
        const carriers = dictionaries.carriers || {};
        const aircraft = dictionaries.aircraft || {};

        const transformedFlights: Flight[] = data.data.map(
          (offer: any, index: number) => {
            const itinerary = offer.itineraries?.[0];
            const segment = itinerary?.segments?.[0];
            const lastSegment =
              itinerary?.segments?.[itinerary.segments.length - 1];

            // Get airline name from dictionary or use carrier code
            const carrierCode = segment?.carrierCode || "";
            const airlineName =
              carriers[carrierCode] || carrierCode || "Unknown";

            // Get aircraft name from dictionary
            const aircraftCode = segment?.aircraft?.code || "";
            const aircraftName = aircraft[aircraftCode] || aircraftCode || "";

            const durationStr = itinerary?.duration || "PT0H0M";
            const durationMatch = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
            const hours = durationMatch?.[1] || "0";
            const minutes = durationMatch?.[2] || "0";
            const formattedDuration = `${hours}h ${minutes}m`.trim();

            return {
              id: offer.id || `flight-${index}`,
              price: parseFloat(offer.price?.total || "0"),
              currency: offer.price?.currency || currency,
              origin: segment?.departure?.iataCode || origin,
              destination: lastSegment?.arrival?.iataCode || destination,
              departureDate: segment?.departure?.at || departureDate,
              arrivalDate: lastSegment?.arrival?.at || "",
              airline: airlineName,
              aircraft: aircraftName,
              stops: (itinerary?.segments?.length || 1) - 1,
              numberOfBookableSeats:offer.numberOfBookableSeats,
              duration: formattedDuration,
            };
          }
        );

        setFlights(transformedFlights);

        // Update price range based on actual flight prices
        if (transformedFlights.length > 0) {
          const prices = transformedFlights.map((f) => f.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange([Math.floor(minPrice), Math.ceil(maxPrice)]);
        }
      } else {
        setPriceRange([280, 510]);
      }
    } catch (error) {
      console.error("Error fetching flights:", error);
      setPriceRange([350, 420]);
      toast.error("Failed to fetch flights. Please try again.");
      setFlights([]); // Clear flights on error
      // Don't re-throw - we handle errors gracefully with toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  // Filter flights based on current filters
  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      // Price filter
      if (flight.price < priceRange[0] || flight.price > priceRange[1]) {
        return false;
      }

      // Stops filter
      if (maxStops !== null && flight.stops > maxStops) {
        return false;
      }

      // Airline filter
      if (
        selectedAirlines &&
        selectedAirlines?.length > 0 &&
        !selectedAirlines?.includes(flight.airline)
      ) {
        return false;
      }

      return true;
    });
  }, [flights, priceRange, maxStops, selectedAirlines]);

  // Prepare data for price graph
  const graphData = useMemo(() => {
    if (filteredFlights.length === 0) return [];

    // Group flights by airline and calculate average price per airline
    const airlinePrices: { [key: string]: number[] } = {};

    filteredFlights.forEach((flight) => {
      if (!airlinePrices[flight.airline]) {
        airlinePrices[flight.airline] = [];
      }
      airlinePrices[flight.airline].push(flight.price);
    });



    const airlines = Object.keys(airlinePrices);
    const data: Array<{ name: string; avg: number, min:number,max:number,price:number[] }> = [];

    airlines.forEach((airline) => {
      const minPrice=Math.min(...airlinePrices[airline])
      const maxPrice=Math.max(...airlinePrices[airline])
      const avgPrice =
        airlinePrices[airline].reduce((a, b) => a + b, 0) /
        airlinePrices[airline].length;
      data.push({
        name: airline,
        price:[minPrice,maxPrice],
        avg: Number(avgPrice.toFixed(2)),
        min: minPrice,
        max:maxPrice
      });
    });

    return data;
  }, [filteredFlights]);



  // Get unique airlines
  const uniqueAirlines = useMemo(() => {
    return Array.from(new Set(flights.map((f) => f.airline))).sort();
  }, [flights]);

  const toggleAirline = (airline: string) => {
    setSelectedAirlines((prev) =>
      prev && prev.includes(airline)
        ? prev.filter((a) => a !== airline)
        : [...(prev ?? []), airline]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="w-full md:w-[20vw] pb-5">
          <Label htmlFor="currency">Currency</Label>
          <Select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CHF">CHF - Swiss Franc</option>
          </Select>
        </div>

        <Card className="mb-8 shadow-lg ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Flights
            </CardTitle>
            <CardDescription>
              Enter your travel details to find the best flights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <LocationSelector
                label="From"
                value={origin}
                onChange={setOrigin}
                placeholder="NYC or Munich"
              />
              <LocationSelector
                label="To"
                value={destination}
                onChange={setDestination}
                placeholder="LAX or Berlin"
              />
              <div>
                <Label htmlFor="departure">Departure Date</Label>
                <Input
                  id="departure"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="mt-1"
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              {!oneWay && (
                <div>
                  <Label htmlFor="returnDate">Return Date</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={returnDate || ""}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="mt-1"
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="adults">Adults</Label>
                <Input
                  id="adults"
                  type="number"
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                  min={1}
                  max={9}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="children">Children</Label>
                <Input
                  id="children"
                  type="number"
                  value={children}
                  onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                  min={0}
                  max={9}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
              <div className="lg:col-span-1 flex items-center space-x-2">
                <Switch
                  id="oneWay"
                  checked={oneWay}
                  onClick={() => {
                    if (!oneWay) {
                      setReturnDate(null);
                    } else {
                      setReturnDate(
                        format(add(new Date(), { days: 1 }), "yyyy-MM-dd")
                      );
                    }
                    setOneWay(!oneWay);
                  }}
                />
                <Label htmlFor="oneWay">One Way</Label>
              </div>
            </div>
            <Button
              onClick={fetchFlights}
              disabled={loading}
              className="w-full mt-6"
              size="lg"
            >
              {loading ? "Searching..." : "Search Flights"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Range */}
                <div>
                  <Label className="mb-2 block">
                    Max Price: {formatCurrency(priceRange[1], currency)}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) =>
                      setPriceRange([priceRange[0], value[1]])
                    }
                    min={0}
                    max={2000}
                    step={10}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatCurrency(priceRange[0], currency)}</span>
                    <span>{formatCurrency(priceRange[1], currency)}</span>
                  </div>
                </div>

                {/* Stops Filter */}
                <div>
                  <Label className="mb-2 block">Maximum Stops</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={maxStops === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMaxStops(null)}
                    >
                      Any
                    </Button>
                    <Button
                      variant={maxStops === 0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMaxStops(0)}
                    >
                      Non-stop
                    </Button>
                    <Button
                      variant={maxStops === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMaxStops(1)}
                    >
                      1 Stop
                    </Button>
                    <Button
                      variant={maxStops === 2 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMaxStops(2)}
                    >
                      2+ Stops
                    </Button>
                  </div>
                </div>

                {/* Airlines Filter */}
                <div>
                  <Label className="mb-2 block">Airlines</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uniqueAirlines.map((airline) => (
                      <label
                        key={airline}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAirlines?.includes(airline)}
                          onChange={() => toggleAirline(airline)}
                          className="rounded"
                        />
                        <span className="text-sm">{airline}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results and Graph */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Graph */}
            {filteredFlights.length > 0 && (
              <ErrorBoundary
                fallback={
                  <Card className="shadow-lg border-destructive">
                    <CardHeader>
                      <CardTitle className="text-destructive">Chart Error</CardTitle>
                      <CardDescription>
                        Failed to load price chart. Please try again.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                }
              >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Price Trends</CardTitle>
                  <CardDescription>
                    Real-time price comparison across airlines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          // angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-sm text-foreground font-semibold">{data.name}</p>
                        <p className="text-sm text-green-500">Lowest: ${data.min}</p>
                        <p className="text-sm text-destructive">Highest: ${data.max}</p>
                        <p className="text-sm text-info">Average: ${data.avg}</p>
                      </div>
                    )
                  }
                  return null
                }}
                cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
              />
                        {/* <Tooltip
                          formatter={(value: number | undefined) =>
                            value !== undefined
                              ? formatCurrency(value, currency)
                              : ""
                          }
                          labelStyle={{ color: "black" }}
                        /> */}
                        <Legend />
                        <BarStack>
                        <Bar
                          dataKey="price"
                          fill="#8884d8" 
                          maxBarSize={50}
                          // strokeWidth={2}
                          // dot={{ r: 4 }}
                          // activeDot={{ r: 6 }}
                        />
                        </BarStack>
                        <Line
                          type="monotone"
                          dataKey="avg"
                          stroke="hsl(221, 83%, 53%)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              </ErrorBoundary>
            )}

            {/* Price Calendar */}
            {origin && destination && (
              <ErrorBoundary
                fallback={
                  <Card className="shadow-lg border-destructive">
                    <CardHeader>
                      <CardTitle className="text-destructive">Calendar Error</CardTitle>
                      <CardDescription>
                        Failed to load price calendar. Please try again.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                }
              >
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <FlightCalendar
                      origin={origin}
                      destination={destination}
                      oneWay={oneWay}
                      selectedDepartureDate={departureDate}
                      selectedReturnDate={returnDate || undefined}
                      onDateSelect={handleCalendarDateSelect}
                      currency={currency}
                    />
                  </CardContent>
                </Card>
              </ErrorBoundary>
            )}

            {/* Flight Results */}
            <ErrorBoundary
              fallback={
                <Card className="shadow-lg border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Results Error</CardTitle>
                    <CardDescription>
                      Failed to load flight results. Please try again.
                    </CardDescription>
                  </CardHeader>
                </Card>
              }
            >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>
                  {filteredFlights.length} Flight
                  {filteredFlights.length !== 1 ? "s" : ""} Found
                </CardTitle>
                <CardDescription>
                  Showing results for {origin} → {destination}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">
                      Searching for flights...
                    </p>
                  </div>
                ) : filteredFlights.length === 0 ? (
                  <div className="text-center py-8">
                    <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No flights found. Try adjusting your filters.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFlights.map((flight) => (
                      <Card
                        key={flight.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <span className="text-2xl font-bold text-primary">
                                  {formatCurrency(
                                    flight.price,
                                    flight.currency
                                  )}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {flight.airline}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                <span>{flight.origin}</span>
                                <Plane className="h-4 w-4" />
                                <span>{flight.destination}</span>
                                <span className="ml-2">•</span>
                                <span>{flight.duration}</span>
                                <span>•</span>
                                {!!flight.numberOfBookableSeats && (
                                  <>
                                    <UsersRound className="h-4 w-4"/>
                                    <span>{`${
                                      flight?.numberOfBookableSeats
                                    } Seat${
                                      flight?.numberOfBookableSeats > 1
                                        ? "s"
                                        : ""
                                    } Available`}</span>
                                    <span>•</span>
                                  </>
                                )}

                                <span>
                                  {flight.stops === 0
                                    ? "Non-stop"
                                    : `${flight.stops} stop${
                                        flight.stops > 1 ? "s" : ""
                                      }`}
                                </span>
                                {flight.aircraft && (
                                  <>
                                    <span>•</span>
                                    <span className="text-xs">
                                      {flight.aircraft}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Button className="w-full md:w-auto">Select</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
