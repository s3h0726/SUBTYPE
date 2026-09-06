export const FEATURE_FLAGS=Object.freeze({
  korea:false
});

export const isCountryEnabled=countryId=>countryId!=='kr'||FEATURE_FLAGS.korea;
