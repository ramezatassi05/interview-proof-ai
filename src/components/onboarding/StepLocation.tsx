'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  COUNTRIES,
  POPULAR_COUNTRY_CODES,
  searchCountries,
  getCitiesForCountries,
  getCountryByCode,
} from '@/lib/location-data';
import { TextAnimate } from '@/components/ui/text-animate';

interface StepLocationProps {
  targetCountries: string[];
  targetCities: string[];
  onTargetCountriesChange: (countries: string[]) => void;
  onTargetCitiesChange: (cities: string[]) => void;
  onContinue: () => void;
}

const popularCountries = POPULAR_COUNTRY_CODES.map((code) => {
  const c = COUNTRIES.find((c) => c.code === code);
  return c!;
});

export function StepLocation({
  targetCountries,
  targetCities,
  onTargetCountriesChange,
  onTargetCitiesChange,
  onContinue,
}: StepLocationProps) {
  const canContinue = targetCountries.length > 0;

  // ── Country search state ──
  const [countryQuery, setCountryQuery] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const countryInputRef = useRef<HTMLInputElement>(null);
  const countryDropdownRef = useRef<HTMLUListElement>(null);

  const filteredCountries = useMemo(() => {
    if (!countryQuery.trim()) return [];
    return searchCountries(countryQuery).filter((c) => !targetCountries.includes(c.code));
  }, [countryQuery, targetCountries]);

  const toggleCountry = useCallback(
    (code: string) => {
      const isSelected = targetCountries.includes(code);
      const next = isSelected
        ? targetCountries.filter((c) => c !== code)
        : [...targetCountries, code];
      onTargetCountriesChange(next);

      // Remove cities belonging to deselected countries
      if (isSelected) {
        const remaining = targetCities.filter((city) => {
          // City format: "CityName" — check if it's from the removed country
          const citiesForRemoved = getCitiesForCountries([code]);
          return !citiesForRemoved.some((c) => c.name === city);
        });
        if (remaining.length !== targetCities.length) {
          onTargetCitiesChange(remaining);
        }
      }
    },
    [targetCountries, targetCities, onTargetCountriesChange, onTargetCitiesChange]
  );

  const selectCountryFromSearch = useCallback(
    (code: string) => {
      if (!targetCountries.includes(code)) {
        onTargetCountriesChange([...targetCountries, code]);
      }
      setCountryQuery('');
      setShowCountryDropdown(false);
      setHighlightedIndex(-1);
    },
    [targetCountries, onTargetCountriesChange]
  );

  const handleCountryInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCountryQuery(e.target.value);
    setShowCountryDropdown(e.target.value.trim().length > 0);
    setHighlightedIndex(-1);
  }, []);

  const handleCountryInputFocus = useCallback(() => {
    if (countryQuery.trim().length > 0) setShowCountryDropdown(true);
  }, [countryQuery]);

  const handleCountryInputBlur = useCallback((e: React.FocusEvent) => {
    if (countryDropdownRef.current?.contains(e.relatedTarget as Node)) return;
    setShowCountryDropdown(false);
  }, []);

  const handleCountryKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showCountryDropdown || filteredCountries.length === 0) {
        if (e.key === 'Enter' && canContinue) {
          e.preventDefault();
          onContinue();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < filteredCountries.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredCountries.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredCountries.length) {
            selectCountryFromSearch(filteredCountries[highlightedIndex].code);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowCountryDropdown(false);
          break;
      }
    },
    [
      showCountryDropdown,
      filteredCountries,
      highlightedIndex,
      selectCountryFromSearch,
      canContinue,
      onContinue,
    ]
  );

  // ── City toggle ──
  const toggleCity = useCallback(
    (cityName: string) => {
      const isSelected = targetCities.includes(cityName);
      onTargetCitiesChange(
        isSelected ? targetCities.filter((c) => c !== cityName) : [...targetCities, cityName]
      );
    },
    [targetCities, onTargetCitiesChange]
  );

  // Cities for selected countries, grouped
  const availableCities = useMemo(
    () => getCitiesForCountries(targetCountries),
    [targetCountries]
  );

  // Group cities by country for display
  const citiesByCountry = useMemo(() => {
    const groups: { code: string; name: string; flag: string; cities: typeof availableCities }[] =
      [];
    for (const code of targetCountries) {
      const country = getCountryByCode(code);
      if (!country) continue;
      const cities = availableCities.filter((c) => c.countryCode === code);
      if (cities.length > 0) {
        groups.push({ code, name: country.name, flag: country.flag, cities });
      }
    }
    return groups;
  }, [targetCountries, availableCities]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* ── Headline ── */}
      <h2 className="heading-modern text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
        <TextAnimate animation="blurInUp" by="word" delay={0.05}>
          Where are you looking to work?
        </TextAnimate>
      </h2>
      <p className="text-[var(--text-secondary)] mb-8 text-center">
        We&apos;ll match you against real positions in your target locations.
      </p>

      <div className="w-full max-w-md space-y-6">
        {/* ── Country chips ── */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Country
          </label>
          <div className="flex flex-wrap gap-2">
            {popularCountries.map((c) => {
              const isSelected = targetCountries.includes(c.code);
              return (
                <motion.button
                  key={c.code}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleCountry(c.code)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 border border-orange-300 text-orange-700 shadow-md shadow-orange-400/10'
                        : 'bg-gray-100 text-[var(--text-secondary)] border border-transparent hover:bg-gray-200'
                    }
                  `}
                >
                  <span className="text-base">{c.flag}</span>
                  {c.name}
                </motion.button>
              );
            })}
          </div>

          {/* Selected non-popular countries as removable pills */}
          {targetCountries.some((code) => !POPULAR_COUNTRY_CODES.includes(code)) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {targetCountries
                .filter((code) => !POPULAR_COUNTRY_CODES.includes(code))
                .map((code) => {
                  const c = getCountryByCode(code);
                  if (!c) return null;
                  return (
                    <motion.button
                      key={c.code}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCountry(c.code)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 border border-orange-300 text-orange-700 shadow-md shadow-orange-400/10 transition-all duration-150"
                    >
                      <span className="text-base">{c.flag}</span>
                      {c.name}
                      <span className="ml-1 text-orange-400 text-xs">x</span>
                    </motion.button>
                  );
                })}
            </div>
          )}

          {/* Search for more countries */}
          <div className="relative mt-3">
            <input
              ref={countryInputRef}
              type="text"
              role="combobox"
              aria-expanded={showCountryDropdown && filteredCountries.length > 0}
              aria-controls="country-listbox"
              aria-activedescendant={
                highlightedIndex >= 0 ? `country-option-${highlightedIndex}` : undefined
              }
              aria-autocomplete="list"
              value={countryQuery}
              onChange={handleCountryInputChange}
              onFocus={handleCountryInputFocus}
              onBlur={handleCountryInputBlur}
              onKeyDown={handleCountryKeyDown}
              placeholder="Search for more countries..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
            />

            <AnimatePresence>
              {showCountryDropdown && filteredCountries.length > 0 && (
                <motion.ul
                  ref={countryDropdownRef}
                  id="country-listbox"
                  role="listbox"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-[200px] overflow-y-auto"
                  tabIndex={-1}
                >
                  {filteredCountries.map((c, i) => (
                    <li
                      key={c.code}
                      id={`country-option-${i}`}
                      role="option"
                      aria-selected={i === highlightedIndex}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectCountryFromSearch(c.code);
                      }}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors
                        ${
                          i === highlightedIndex
                            ? 'bg-orange-50 text-orange-700'
                            : 'text-[var(--text-primary)] hover:bg-gray-50'
                        }
                      `}
                    >
                      <span>{c.flag}</span>
                      {c.name}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── City selection (conditional) ── */}
        <AnimatePresence mode="wait">
          {targetCountries.length > 0 && (
            <motion.div
              key="cities"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Cities <span className="text-[var(--text-muted)] font-normal">(optional)</span>
              </label>

              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                {citiesByCountry.map((group) => (
                  <div key={group.code}>
                    <p className="text-xs font-medium text-[var(--text-muted)] mb-1.5">
                      {group.flag} {group.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.cities.map((city) => {
                        const isSelected = targetCities.includes(city.name);
                        return (
                          <motion.button
                            key={city.name}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleCity(city.name)}
                            className={`
                              px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150
                              ${
                                isSelected
                                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                  : 'bg-gray-100 text-[var(--text-secondary)] border border-transparent hover:bg-gray-200'
                              }
                            `}
                          >
                            {city.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Summary ── */}
        <AnimatePresence>
          {(targetCountries.length > 0 || targetCities.length > 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 border border-orange-100 p-3"
            >
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <span className="font-semibold text-orange-700">
                  {targetCountries.length} countr{targetCountries.length === 1 ? 'y' : 'ies'}
                </span>
                {targetCities.length > 0 && (
                  <>
                    {' and '}
                    <span className="font-semibold text-orange-700">
                      {targetCities.length} cit{targetCities.length === 1 ? 'y' : 'ies'}
                    </span>
                  </>
                )}{' '}
                selected — we&apos;ll analyze real job listings in these locations for your readiness
                score.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CTA ── */}
        <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-white via-white to-white/0">
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="group relative w-full rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 p-[2px] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            <span className="flex items-center justify-center rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-black/90 min-h-[48px]">
              Almost There
            </span>
          </button>
          <p className="text-xs text-[var(--text-muted)] text-center mt-2">
            You can change this later
          </p>
        </div>
      </div>
    </div>
  );
}
