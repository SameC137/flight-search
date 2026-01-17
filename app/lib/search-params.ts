// lib/search-params.ts
import { format } from 'date-fns';
import { 
    createSerializer, 
    parseAsString, 
    parseAsInteger, 
    parseAsIsoDate, 
    parseAsBoolean
  } from 'nuqs';
import { createLoader } from 'nuqs/server';
  
  export const flightSearchParams = {
    origin: parseAsString.withDefault('LAX').withOptions({clearOnDefault:false}),
    destination: parseAsString.withDefault('NYC').withOptions({clearOnDefault:false}),
    date: parseAsString.withDefault(format(new Date(), "yyyy-MM-dd")).withOptions({clearOnDefault:false}),
    adults: parseAsInteger.withDefault(1).withOptions({clearOnDefault:false}),
    children: parseAsInteger.withDefault(0).withOptions({clearOnDefault:false}),
    // infants: parseAsInteger.withDefault(0),
    currency: parseAsString.withDefault('USD').withOptions({clearOnDefault:false}),
    returnDate: parseAsString,
    oneWay:parseAsBoolean,
  };
  
  // This helps us build the URL string to navigate
  export const serialize = createSerializer(flightSearchParams);

  export const searchLoader=createLoader(flightSearchParams)