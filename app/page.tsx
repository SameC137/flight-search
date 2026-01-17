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
} from "recharts";
import { Plane, Calendar, Users, Filter, Search } from "lucide-react";
import { LocationSelector } from "@/components/location-selector";

import { toast } from "sonner";
import { redirect, RedirectType } from 'next/navigation'
import { Switch } from "@/components/ui/switch";
import clsx from "clsx";
import { serialize } from "./lib/search-params";

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
}

export default function Home() {
  const [origin, setOrigin] = useState("LAX");
  const [destination, setDestination] = useState("NYC");
  const [departureDate, setDepartureDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [returnDate, setReturnDate] = useState<string|null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);

  const [oneWay, setOneWay] = useState(true);

  const goToSearch = () => {
    const data={
      origin:origin,
      destination: destination,
      departureDate:departureDate,
      returnDate:returnDate ,
      adults:adults,
      children:children,
      currency:currency,
      oneWay:oneWay,
    }

    console.log("data", data);
    const queryString = serialize(data);
    redirect(`/search${queryString}`, RedirectType.push);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}

        <div>
        <div className="absolute top-5 left-5">
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
        </div>
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Find Your Perfect Flight
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Search, compare, and book flights with real-time price tracking
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 shadow-lg">
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
            <div className={clsx("grid grid-cols-1 md:grid-cols-2 gap-4", oneWay ? "lg:grid-cols-5" : "lg:grid-cols-6")}>
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
                    value={returnDate||''}
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
                      console.log("oneWay", oneWay);
                      if(!oneWay ) {
                        setReturnDate(null);
                      }else{
                       setReturnDate( format(add(new Date(),{days:1}), "yyyy-MM-dd"))
                      }
                      setOneWay(!oneWay)}}
                  />
                  <Label htmlFor="oneWay">One Way</Label>
                  
              </div>
            </div>
            <Button
              onClick={goToSearch}
              disabled={loading}
              className="w-full mt-6"
              size="lg"
            >
              {loading ? "Searching..." : "Search Flights"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
