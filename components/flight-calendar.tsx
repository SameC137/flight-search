"use client";

import { useState, useEffect, useMemo } from "react";
import { format, differenceInDays, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import dates from "@/dates.json";

interface FlightDate {
  type: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: {
    total: string;
  };
}

interface FlightCalendarProps {
  origin: string;
  destination: string;
  oneWay: boolean;
  selectedDepartureDate?: string;
  selectedReturnDate?: string;
  onDateSelect: (departureDate: string, returnDate?: string) => void;
  currency?: string;
}

export function FlightCalendar({
  origin,
  destination,
  oneWay,
  selectedDepartureDate,
  selectedReturnDate,
  onDateSelect,
  currency = "USD",
}: FlightCalendarProps) {
  const [open, setOpen] = useState(false);
  const [flightDates, setFlightDates] = useState<FlightDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculate duration if we have return date
  const duration = useMemo(() => {
    if (oneWay || !selectedDepartureDate || !selectedReturnDate)
      return undefined;
    try {
      const departure = parse(selectedDepartureDate, "yyyy-MM-dd", new Date());
      const returnDate = parse(selectedReturnDate, "yyyy-MM-dd", new Date());
      const days = differenceInDays(returnDate, departure);
      return days > 0 ? days.toString() : undefined;
    } catch {
      return undefined;
    }
  }, [selectedDepartureDate, selectedReturnDate, oneWay]);

  // Fetch flight dates when origin/destination changes
  useEffect(() => {
    if (
      !origin ||
      !destination ||
      origin.length < 3 ||
      destination.length < 3
    ) {
      setFlightDates([]);
      return;
    }

    const fetchFlightDates = async () => {
      setLoading(true);
      if(origin=="MAD" && destination=="MUC"){
        setFlightDates(dates.data);
        setCurrentMonth(new Date(2020, 8, 8));
        setLoading(false)
        return;
      }

      try {
        const params = new URLSearchParams({
          origin,
          destination,
          oneWay: oneWay.toString(),
          nonStop: "false",
        });

        // Add duration if available
        if (duration) {
          params.append("duration", duration);
        }

        const response = await fetch(`/api/flights/dates?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setFlightDates(data.data || []);
        } else {
          setFlightDates([]);
        }
      } catch (error) {
        console.error("Error fetching flight dates:", error);
        setFlightDates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlightDates();
  }, [origin, destination, oneWay, duration]);

  // Create a map of dates to prices
  const datePriceMap = useMemo(() => {
    const map = new Map<string, number>();
    flightDates.forEach((flight) => {
      const date = flight.departureDate;
      const price = parseFloat(flight.price.total);
      if (!map.has(date) || price < map.get(date)!) {
        map.set(date, price);
      }
    });
    return map;
  }, [flightDates]);

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const todayStr = format(new Date(), "yyyy-MM-dd");

    if (dateStr < todayStr) {
      return; // Can't select past dates
    }

    if (oneWay) {
      onDateSelect(dateStr);
      setOpen(false);
    } else {
      // For round trip, if no departure selected or departure is after this date, set as departure
      // Otherwise set as return
      if (!selectedDepartureDate || dateStr <= selectedDepartureDate) {
        onDateSelect(dateStr);
      } else if (dateStr > selectedDepartureDate) {
        onDateSelect(selectedDepartureDate, dateStr);
        setOpen(false);
      }
    }
  };

  const selectedDates = useMemo(() => {
    const start = selectedDepartureDate
      ? parse(selectedDepartureDate, "yyyy-MM-dd", new Date())
      : undefined;
    const end = selectedReturnDate
      ? parse(selectedReturnDate, "yyyy-MM-dd", new Date())
      : undefined;
    return { start, end };
  }, [selectedDepartureDate, selectedReturnDate]);

  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  if (flightDates.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Couldn't find best dates for this route
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <CalendarIcon className="mr-2 h-4 w-4" />
          See best days to travel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Flight Date</DialogTitle>
          <DialogDescription>
            {oneWay
              ? "Select your departure date"
              : "Select your departure and return dates"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Calendar
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              selectedDates={selectedDates}
              onDateClick={handleDateClick}
              datePrices={datePriceMap}
              currency={currency}
              minDate={minDate}
            />
          )}
          {flightDates.length === 0 && !loading && origin && destination && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No prices available for this route
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
