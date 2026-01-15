'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Plane, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Location {
  type: string
  subType: string
  name: string
  detailedName: string
  id: string
  iataCode: string
  address: {
    cityName: string
    cityCode: string
    countryName: string
    countryCode: string
  }
}

interface LocationSelectorProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function LocationSelector({ label, value, onChange, placeholder = "Search..." }: LocationSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (searchQuery.length < 2) {
      setLocations([])
      return
    }

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/locations/search?keyword=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setLocations(data.data || [])
        } else {
          setLocations([])
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
        setLocations([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchQuery])

  const handleSelect = (location: Location) => {
    onChange(location.iataCode)
    setOpen(false)
    setSearchQuery('')
    setLocations([])
  }

  // Filter out cities and only show airports
  const airports = locations.filter(loc => loc.subType === 'AIRPORT')
  
  // Group airports by city
  const airportsByCity = airports.reduce((acc, airport) => {
    const cityName = airport.address.cityName
    if (!acc[cityName]) {
      acc[cityName] = []
    }
    acc[cityName].push(airport)
    return acc
  }, {} as Record<string, Location[]>)

  return (
    <div>
      <Label htmlFor={label.toLowerCase()}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative mt-1">
            <Input
              id={label.toLowerCase()}
              value={value}
              onChange={(e) => {
                const newValue = e.target.value
                onChange(newValue)
                setSearchQuery(e.target.value)
                if (e.target.value.length >= 2) {
                  setOpen(true)
                } else if (e.target.value.length === 0) {
                  setOpen(false)
                }
              }}
              onFocus={() => {
                if (value.length >= 2) {
                  setSearchQuery(value)
                  setOpen(true)
                }
              }}
              placeholder={placeholder}
              className="w-full"
            />
            <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
          <Command>
            <CommandInput
              placeholder="Search airports..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {loading ? (
                <CommandEmpty>Searching...</CommandEmpty>
              ) : airports.length === 0 ? (
                <CommandEmpty>
                  {searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No airports found'}
                </CommandEmpty>
              ) : (
                <>
                  {Object.entries(airportsByCity).map(([cityName, cityAirports]) => (
                    <CommandGroup key={cityName} heading={`${cityName}, ${cityAirports[0].address.countryName}`}>
                      {cityAirports.map((location) => (
                        <CommandItem
                          key={location.id}
                          onSelect={() => handleSelect(location)}
                          className="flex items-center gap-2"
                        >
                          <Plane className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">{location.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {location.iataCode} • {location.address.countryCode}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
