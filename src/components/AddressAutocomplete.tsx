"use client";

import { useEffect, useRef, useState } from "react";

interface AddressFields {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface Props {
  onChange: (fields: AddressFields) => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    initGooglePlaces?: () => void;
  }
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";
const labelClass = "text-sm font-medium text-slate-700";

export function AddressAutocomplete({ onChange }: Props) {
  const streetRef = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<AddressFields>({
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  useEffect(() => {
    function initAutocomplete() {
      if (!streetRef.current || !window.google) return;

      const autocomplete = new window.google.maps.places.Autocomplete(
        streetRef.current,
        { types: ["address"], componentRestrictions: { country: "us" } }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        let streetNumber = "";
        let route = "";
        let city = "";
        let state = "";
        let zip = "";

        for (const component of place.address_components) {
          const type = component.types[0];
          if (type === "street_number") streetNumber = component.long_name;
          if (type === "route") route = component.long_name;
          if (type === "locality") city = component.long_name;
          if (type === "administrative_area_level_1")
            state = component.short_name;
          if (type === "postal_code") zip = component.long_name;
        }

        const updated: AddressFields = {
          address: `${streetNumber} ${route}`.trim(),
          city,
          state,
          zip,
        };
        setFields(updated);
        onChange(updated);
      });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) return;

    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    window.initGooglePlaces = initAutocomplete;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [onChange]);

  function handleChange(field: keyof AddressFields, value: string) {
    const updated = { ...fields, [field]: value };
    setFields(updated);
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className={labelClass}>Street Address</span>
        <input
          ref={streetRef}
          name="address"
          type="text"
          required
          autoComplete="street-address"
          placeholder="123 Main St"
          value={fields.address}
          onChange={(e) => handleChange("address", e.target.value)}
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelClass}>City</span>
          <input
            name="city"
            type="text"
            required
            autoComplete="address-level2"
            value={fields.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>State</span>
          <input
            name="state"
            type="text"
            required
            autoComplete="address-level1"
            maxLength={2}
            placeholder="TX"
            value={fields.state}
            onChange={(e) => handleChange("state", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block">
        <span className={labelClass}>ZIP Code</span>
        <input
          name="zip"
          type="text"
          required
          autoComplete="postal-code"
          maxLength={10}
          placeholder="78701"
          value={fields.zip}
          onChange={(e) => handleChange("zip", e.target.value)}
          className={inputClass}
        />
      </label>
    </div>
  );
}
